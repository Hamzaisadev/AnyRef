import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { AiProvider } from '../ai/AiProvider';
import { getAiProvider } from '../ai/getAiProvider';
import { GenerateOutput } from '../ai/schemas';
import { ForbiddenError, ValidationError, AiInvalidOutputError } from '../lib/errors';
import { verifyImageMagicBytes } from './assetService';
import { validatePromptTemplate } from '../domain/validateTemplate';
import { validateInjectionAndBrandRules } from '../domain/validateInjection';

export class GenerateService {
  constructor(
    private brandRepo: BrandRepo = new SupabaseBrandRepo(),
    private getProvider: () => AiProvider = getAiProvider
  ) {}

  async generate(
    userId: string,
    brandId: string,
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<GenerateOutput> {
    // 1. Verify authentic image magic bytes
    const magicCheck = verifyImageMagicBytes(imageBuffer);
    if (!magicCheck.isValid || !magicCheck.mimeType) {
      throw new ValidationError(
        magicCheck.error || `Invalid image bytes: unsupported image type "${mimeType}". Allowed: jpeg, png, webp.`
      );
    }

    const brand = await this.brandRepo.findById(userId, brandId);
    if (!brand) {
      throw new ForbiddenError(`Cannot generate: Brand "${brandId}" not found or unauthorized.`);
    }

    // Circuit breaker & user daily quota gate
    const { QuotaService } = await import('./quotaService');
    await QuotaService.checkCircuitBreaker();
    await QuotaService.checkDailyQuota(userId, 'generate_per_day');

    const provider = this.getProvider();
    const result = await provider.generateTemplate({
      imageBuffer,
      mimeType: magicCheck.mimeType,
      brand,
    });

    // Record AI telemetry
    await QuotaService.recordAiUsage({
      userId,
      kind: 'generate',
      inputTokens: 1000,
      outputTokens: 500,
      costUsd: 0.001,
    });

    // 2. Post-validate AI output consistency
    const templateValidation = validatePromptTemplate(result.prompt_template, result.slots);
    if (!templateValidation.valid) {
      throw new AiInvalidOutputError(
        `AI generated inconsistent template:\n${templateValidation.errors.join('\n')}`,
        templateValidation.errors
      );
    }

    // 3. Post-validate against injections and brand rules
    const injectionValidation = validateInjectionAndBrandRules(result.prompt_template, brand);
    if (!injectionValidation.valid) {
      throw new AiInvalidOutputError(
        `AI generated output violating safety rules:\n${injectionValidation.errors.join('\n')}`,
        injectionValidation.errors
      );
    }

    return result;
  }
}

export const generateService = new GenerateService();
