import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { AiProvider } from '../ai/AiProvider';
import { getAiProvider } from '../ai/getAiProvider';
import { StudioGenerateOutput } from '../ai/schemas';
import { ForbiddenError, ValidationError } from '../lib/errors';
import { verifyImageMagicBytes } from './assetService';
import { computeAiCost } from '../ai/pricing';
import { getActiveSystemPrompt } from './promptService';
import { validateEnv } from '../lib/env';

export interface StudioGenerateServiceOptions {
  brandId?: string;
  aspectRatio?: string;
  targetEngine?: 'midjourney' | 'flux' | 'ideogram' | 'universal';
  hint?: string;
}

export type StudioGenerateProposal = StudioGenerateOutput & {
  system_prompt_version?: number | null;
  cost_usd?: number;
};

function getMaxUploadMb(): number {
  try {
    return validateEnv().MAX_UPLOAD_MB || 10;
  } catch {
    const raw = Number(process.env.MAX_UPLOAD_MB);
    return Number.isFinite(raw) && raw > 0 ? raw : 10;
  }
}

export class StudioService {
  constructor(
    private brandRepo: BrandRepo = new SupabaseBrandRepo(),
    private getProvider: () => AiProvider = getAiProvider
  ) {}

  async generate(
    userId: string,
    referenceBuffer: Buffer,
    referenceMimeType: string,
    productBuffer: Buffer,
    productMimeType: string,
    options?: StudioGenerateServiceOptions
  ): Promise<StudioGenerateProposal> {
    // 0. Enforce file size limit against MAX_UPLOAD_MB
    const maxUploadMb = getMaxUploadMb();
    const maxUploadBytes = maxUploadMb * 1024 * 1024;
    if (referenceBuffer.length > maxUploadBytes) {
      throw new ValidationError(`Reference image exceeds maximum allowed size of ${maxUploadMb}MB`);
    }
    if (productBuffer.length > maxUploadBytes) {
      throw new ValidationError(`Product image exceeds maximum allowed size of ${maxUploadMb}MB`);
    }

    // 1. Verify authentic image magic bytes for both images
    const refMagicCheck = verifyImageMagicBytes(referenceBuffer);
    if (!refMagicCheck.isValid || !refMagicCheck.mimeType) {
      throw new ValidationError(
        refMagicCheck.error ||
          `Invalid reference image bytes: unsupported image type "${referenceMimeType}". Allowed: jpeg, png, webp.`
      );
    }

    const prodMagicCheck = verifyImageMagicBytes(productBuffer);
    if (!prodMagicCheck.isValid || !prodMagicCheck.mimeType) {
      throw new ValidationError(
        prodMagicCheck.error ||
          `Invalid product image bytes: unsupported image type "${productMimeType}". Allowed: jpeg, png, webp.`
      );
    }

    // 2. Load brand if provided
    let brand = null;
    if (options?.brandId) {
      brand = await this.brandRepo.findById(userId, options.brandId);
      if (!brand) {
        throw new ForbiddenError(`Cannot generate: Brand "${options.brandId}" not found or unauthorized.`);
      }
    }

    // 3. Circuit breaker & user daily quota gate
    const { QuotaService } = await import('./quotaService');
    await QuotaService.checkCircuitBreaker();
    await QuotaService.checkDailyQuota(userId, 'generate_per_day');
    await QuotaService.checkMonthlyBudget(userId, 'generate');

    const promptInfo = await getActiveSystemPrompt('studio');
    const provider = this.getProvider();

    if (typeof provider.generateStudio !== 'function') {
      throw new Error(`Provider "${provider.name}" does not support generateStudio.`);
    }

    const result = await provider.generateStudio({
      referenceBuffer,
      referenceMimeType: refMagicCheck.mimeType,
      productBuffer,
      productMimeType: prodMagicCheck.mimeType,
      brand,
      aspectRatio: options?.aspectRatio,
      targetEngine: options?.targetEngine,
      hint: options?.hint,
      systemPrompt: promptInfo.body,
    });

    // 4. Record AI telemetry
    const inputTokens = result.usage?.inputTokens ?? 1200;
    const outputTokens = result.usage?.outputTokens ?? 600;
    const reasoningTokens = result.usage?.reasoningTokens ?? 0;
    const costUsd = computeAiCost(inputTokens, outputTokens, reasoningTokens);

    await QuotaService.recordAiUsage({
      userId,
      kind: 'generate',
      inputTokens,
      outputTokens: outputTokens + reasoningTokens,
      costUsd,
    });

    return {
      ...result,
      system_prompt_version: promptInfo.version,
      cost_usd: costUsd,
    };
  }
}

export const studioService = new StudioService();
