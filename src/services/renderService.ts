import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { AiProvider, RenderAspectRatio } from '../ai/AiProvider';
import { getAiProvider } from '../ai/getAiProvider';
import { ForbiddenError, ValidationError, AppError } from '../lib/errors';
import { assetService } from './assetService';
import { computeRenderCost } from '../ai/pricing';
import { renderPrompt } from '../domain/renderPrompt';
import { evaluateRenderGuard, type RenderBlocker } from '../domain/renderGuard';
import { validateInjectionAndBrandRules } from '../domain/validateInjection';
import { createAdminClient } from '../lib/supabaseServer';
import { validateEnv } from '../lib/env';
import type { Slot } from '../domain/slot';
import type { Brand } from '../domain/brand';

export interface RenderServiceOptions {
  entryId?: string;
  brandId?: string;
  aspectRatio?: RenderAspectRatio;
  /** Reference poster storage path, attached so the model matches the layout. */
  referencePath?: string;
  /** Product cutout, supplied per render and never persisted. */
  productBuffer?: Buffer;
  productMimeType?: string;
}

export interface RenderOutcome {
  status: 'succeeded' | 'blocked';
  renderId: string;
  /** Present when status === 'succeeded'. */
  imagePath?: string;
  signedUrl?: string;
  mimeType?: string;
  /** Present when status === 'blocked'. Costs $0. */
  blockers?: RenderBlocker[];
  needsYou?: string[];
  costUsd: number;
  model?: string;
}

function isRenderEnabled(): boolean {
  try {
    return validateEnv().ENABLE_RENDER;
  } catch {
    return process.env.ENABLE_RENDER !== 'false';
  }
}

/**
 * Renders a filled entry into a finished poster image.
 *
 * Ordering is deliberate and cost-driven: every free check runs before the paid
 * image call. A render blocked for unresolved prices or dates costs nothing.
 */
export class RenderService {
  constructor(
    private brandRepo: BrandRepo = new SupabaseBrandRepo(),
    private getProvider: () => AiProvider = getAiProvider
  ) {}

  async render(
    userId: string,
    template: string,
    slots: Slot[],
    values: Record<string, string | undefined>,
    options: RenderServiceOptions = {}
  ): Promise<RenderOutcome> {
    if (!isRenderEnabled()) {
      throw new ForbiddenError('In-app rendering is currently disabled. Use prompt export instead.');
    }

    const aspectRatio: RenderAspectRatio = options.aspectRatio || '1:1';

    // 1. Load brand (free)
    let brand: Brand | null = null;
    if (options.brandId) {
      brand = await this.brandRepo.findById(userId, options.brandId);
      if (!brand) {
        throw new ForbiddenError(`Cannot render: Brand "${options.brandId}" not found or unauthorized.`);
      }
    }

    // 2. Substitute slots (free)
    const rendered = renderPrompt(template, slots, values);

    // 3. Factual-honesty gate (free). This is the product's core promise.
    const guard = evaluateRenderGuard(rendered.text, slots, values);
    if (!guard.canRender) {
      const renderId = await this.recordRender({
        userId,
        entryId: options.entryId,
        brandId: options.brandId,
        renderedPrompt: rendered.text,
        aspectRatio,
        status: 'blocked',
        failureReason: guard.blockers.map((b) => b.message).join(' | '),
        costUsd: 0,
      });

      return {
        status: 'blocked',
        renderId,
        blockers: guard.blockers,
        needsYou: guard.needsYou,
        costUsd: 0,
      };
    }

    // 4. Injection and brand-rule validation on the final text (free)
    if (brand) {
      const injectionCheck = validateInjectionAndBrandRules(rendered.text, brand);
      if (!injectionCheck.valid) {
        throw new ValidationError(
          `Render blocked by safety rules:\n${injectionCheck.errors.join('\n')}`
        );
      }
    }

    // 5. Circuit breaker, daily quota, monthly render cap, monthly budget (free)
    const { QuotaService } = await import('./quotaService');
    await QuotaService.checkCircuitBreaker();
    await QuotaService.checkDailyQuota(userId, 'render_per_day');
    await QuotaService.checkMonthlyRenderCap(userId);
    await QuotaService.checkMonthlyBudget(userId, 'render');

    // 6. Gather attachments. Order mirrors the old Attach Checklist.
    const attachments: NonNullable<Parameters<NonNullable<AiProvider['renderImage']>>[0]['attachments']> = [];

    if (options.referencePath) {
      const ref = await this.loadStoredImage('references', options.referencePath);
      if (ref) {
        attachments.push({ buffer: ref.buffer, mimeType: ref.mimeType, role: 'reference_layout' });
      }
    }

    if (options.productBuffer) {
      // Product photos are processed in memory and never stored, per product policy.
      const check = assetService.validateUpload(options.productBuffer, options.productMimeType);
      attachments.push({ buffer: check.buffer, mimeType: check.mimeType, role: 'product' });
    }

    if (brand?.logo_path) {
      const logo = await this.loadStoredImage('logos', brand.logo_path);
      if (logo) {
        attachments.push({ buffer: logo.buffer, mimeType: logo.mimeType, role: 'logo' });
      }
    }

    // 7. Paid call
    const provider = this.getProvider();
    if (typeof provider.renderImage !== 'function') {
      throw new ForbiddenError(
        `Provider "${provider.name}" cannot render images. Set AI_PROVIDER=gemini or use prompt export.`
      );
    }

    let result;
    try {
      result = await provider.renderImage({
        prompt: rendered.text,
        aspectRatio,
        attachments,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.recordRender({
        userId,
        entryId: options.entryId,
        brandId: options.brandId,
        renderedPrompt: rendered.text,
        aspectRatio,
        status: 'failed',
        failureReason: message,
        costUsd: 0,
      });
      throw err instanceof AppError ? err : new AppError(message, 'RENDER_FAILED', 502);
    }

    // 8. Cost telemetry. Charged against the render budget, not the text budget.
    const costUsd = computeRenderCost(
      result.imageCount,
      result.usage?.inputTokens ?? 0,
      result.model
    );

    await QuotaService.recordAiUsage({
      userId,
      kind: 'render',
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      costUsd,
    });

    // 9. Persist the image to the results bucket so it joins the Winner flow
    const stored = await assetService.uploadImage(userId, 'results', result.imageBuffer, result.mimeType);

    const renderId = await this.recordRender({
      userId,
      entryId: options.entryId,
      brandId: options.brandId,
      renderedPrompt: rendered.text,
      aspectRatio,
      status: 'succeeded',
      imagePath: stored.path,
      mimeType: stored.mimeType,
      model: result.model,
      costUsd,
    });

    return {
      status: 'succeeded',
      renderId,
      imagePath: stored.path,
      signedUrl: stored.signedUrl,
      mimeType: stored.mimeType,
      costUsd,
      model: result.model,
    };
  }

  /** Downloads a user-owned stored image for use as a model attachment. */
  private async loadStoredImage(
    bucket: 'references' | 'logos',
    path: string
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error || !data) return null;
      const buffer = Buffer.from(await data.arrayBuffer());
      return { buffer, mimeType: data.type || 'image/png' };
    } catch {
      // A missing reference degrades render quality but should not fail the render.
      return null;
    }
  }

  private async recordRender(params: {
    userId: string;
    entryId?: string;
    brandId?: string;
    renderedPrompt: string;
    aspectRatio: string;
    status: 'succeeded' | 'failed' | 'blocked';
    imagePath?: string;
    mimeType?: string;
    model?: string;
    failureReason?: string;
    costUsd: number;
  }): Promise<string> {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('renders')
        .insert({
          user_id: params.userId,
          entry_id: params.entryId ?? null,
          brand_id: params.brandId ?? null,
          rendered_prompt: params.renderedPrompt,
          aspect_ratio: params.aspectRatio,
          status: params.status,
          image_path: params.imagePath ?? null,
          mime_type: params.mimeType ?? null,
          model: params.model ?? null,
          failure_reason: params.failureReason ?? null,
          est_cost_usd: params.costUsd,
        })
        .select('id')
        .single();

      if (error || !data) return 'unrecorded';
      return data.id as string;
    } catch {
      return 'unrecorded';
    }
  }
}

export const renderService = new RenderService();
