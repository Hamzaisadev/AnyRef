import { AiProvider } from '../ai/AiProvider';
import { getAiProvider } from '../ai/getAiProvider';
import { BrandDraftOutput } from '../ai/schemas';
import { QuotaService } from './quotaService';
import { getActiveSystemPrompt } from './promptService';
import { computeAiCost } from '../ai/pricing';
import { validateBrandDraft } from '../domain/validateBrandDraft';
import { verifyImageMagicBytes, assetService } from './assetService';
import { createAdminClient } from '../lib/supabaseServer';
import { ValidationError, ForbiddenError, NotFoundError } from '../lib/errors';
import { validateEnv } from '../lib/env';
import type { UserProfile } from './session';

export interface BrandDraftRequest {
  description: string;
  logo_path?: string | null;
}

export interface BrandDraftServiceResult {
  draft: BrandDraftOutput;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}

export class BrandDraftService {
  constructor(private getProvider: () => AiProvider = getAiProvider) {}

  async draftBrand(
    user: UserProfile,
    input: BrandDraftRequest
  ): Promise<BrandDraftServiceResult> {
    const rawDescription = input.description?.trim() || '';

    // 1. Input validation: description required, 20–2,000 characters
    if (rawDescription.length < 20 || rawDescription.length > 2000) {
      throw new ValidationError(
        'Description must be between 20 and 2,000 characters.'
      );
    }

    // 2. Validate optional logo if supplied
    let imageBuffer: Buffer | undefined;
    let mimeType: string | undefined;

    if (input.logo_path) {
      // Must not be an external HTTP URL (strict anti-SSRF)
      if (/^https?:\/\//i.test(input.logo_path)) {
        throw new ValidationError('External URLs are not permitted for logo assets.');
      }

      // Normalize path to {userId}/{filename}
      let storagePath = input.logo_path.trim();
      if (storagePath.startsWith('/api/assets/logos/')) {
        storagePath = storagePath.replace('/api/assets/logos/', '');
      } else if (storagePath.startsWith('logos/')) {
        storagePath = storagePath.replace('logos/', '');
      }

      // Verify asset belongs to the requesting user (or staff)
      const pathParts = storagePath.split('/');
      const ownerId = pathParts[0];

      if (ownerId !== user.id && user.role !== 'owner' && user.role !== 'admin') {
        throw new ForbiddenError('Access denied: You do not have permission to access this logo asset.');
      }

      const admin = createAdminClient();
      const { data: fileData, error: downloadError } = await admin.storage
        .from('logos')
        .download(storagePath);

      if (downloadError || !fileData) {
        throw new NotFoundError(`Logo asset "${storagePath}" not found.`);
      }

      const arrayBuffer = await fileData.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);

      // Check file size against MAX_UPLOAD_MB
      const maxUploadMb = validateEnv().MAX_UPLOAD_MB || 10;
      if (imageBuffer.length > maxUploadMb * 1024 * 1024) {
        throw new ValidationError(`Logo size exceeds maximum upload limit of ${maxUploadMb} MB.`);
      }

      // Check magic bytes
      const magicCheck = verifyImageMagicBytes(imageBuffer);
      if (!magicCheck.isValid || !magicCheck.mimeType) {
        throw new ValidationError(magicCheck.error || 'Invalid logo image format. Allowed: PNG, JPEG, WebP.');
      }
      mimeType = magicCheck.mimeType;
    }

    // 3. Quota & Circuit Breaker gate
    await QuotaService.checkCircuitBreaker({ id: user.id, role: user.role, status: user.status });
    await QuotaService.checkDailyQuota(user.id, 'brand_draft_per_day');
    await QuotaService.checkMonthlyBudget(user.id, 'brand_draft');

    // 4. Load versioned or default system prompt
    const promptInfo = await getActiveSystemPrompt('brand_draft');

    // 5. Invoke AI provider
    const provider = this.getProvider();
    const result = await provider.draftBrand({
      description: rawDescription,
      imageBuffer,
      mimeType,
      systemPrompt: promptInfo.body,
    });

    // 6. Cost & usage telemetry recording
    const inputTokens = result.usage?.inputTokens ?? 0;
    const outputTokens = result.usage?.outputTokens ?? 0;
    const reasoningTokens = result.usage?.reasoningTokens ?? 0;
    const costUsd = computeAiCost(inputTokens, outputTokens, reasoningTokens);

    await QuotaService.recordAiUsage({
      userId: user.id,
      kind: 'brand_draft',
      inputTokens,
      outputTokens: outputTokens + reasoningTokens,
      costUsd,
    });

    // 7. Server-side post-validation against honesty rules
    const validatedDraft = validateBrandDraft(result, rawDescription);

    return {
      draft: validatedDraft,
      usage: {
        inputTokens,
        outputTokens,
        costUsd,
      },
    };
  }
}

export const brandDraftService = new BrandDraftService();
