import { EntryRepo, SupabaseEntryRepo } from '../data/entryRepo';
import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { AiProvider } from '../ai/AiProvider';
import { getAiProvider } from '../ai/getAiProvider';
import { NotFoundError, ValidationError } from '../lib/errors';
import type { AutofillOutput } from '../ai/schemas';
import { verifyImageMagicBytes } from './assetService';
import { sanitizeText } from '../lib/sanitize';
import { computeAiCost } from '../ai/pricing';
import { getActiveSystemPrompt } from './promptService';
import { validateInjectionAndBrandRules } from '../domain/validateInjection';

export interface SanitizedAutofillResult extends AutofillOutput {
  layoutFitWarning: boolean;
  intendedProductShape?: string | null;
  productShape: string;
}

export class AutofillService {
  constructor(
    private entryRepo: EntryRepo = new SupabaseEntryRepo(),
    private brandRepo: BrandRepo = new SupabaseBrandRepo(),
    private getProvider: () => AiProvider = getAiProvider
  ) {}

  async autofill(
    userId: string,
    entryId: string,
    imageBuffer: Buffer,
    mimeType: string,
    hint?: string
  ): Promise<SanitizedAutofillResult> {
    // 1. Verify authentic image magic bytes
    const magicCheck = verifyImageMagicBytes(imageBuffer);
    if (!magicCheck.isValid || !magicCheck.mimeType) {
      throw new ValidationError(
        magicCheck.error || `Invalid image bytes: unsupported image type "${mimeType}". Allowed: jpeg, png, webp.`
      );
    }

    const entry = await this.entryRepo.findById(userId, entryId);
    if (!entry) {
      throw new NotFoundError(`Entry "${entryId}" not found.`);
    }

    const brand = await this.brandRepo.findById(userId, entry.brand_id);
    if (!brand) {
      throw new NotFoundError(`Brand "${entry.brand_id}" not found.`);
    }

    const cleanHint = hint ? sanitizeText(hint, 300) : undefined;

    // Circuit breaker & user daily quota gate
    const { QuotaService } = await import('./quotaService');
    await QuotaService.checkCircuitBreaker();
    await QuotaService.checkDailyQuota(userId, 'autofill_per_day');
    await QuotaService.checkMonthlyBudget(userId, 'autofill');

    const promptInfo = await getActiveSystemPrompt('autofill');
    const provider = this.getProvider();
    const rawOutput = await provider.autofillSlots({
      imageBuffer,
      mimeType: magicCheck.mimeType,
      brand,
      slots: entry.slots,
      hint: cleanHint,
      systemPrompt: promptInfo.body,
    });

    // Record AI telemetry
    const inputTokens = rawOutput.usage?.inputTokens ?? 1200;
    const outputTokens = rawOutput.usage?.outputTokens ?? 400;
    const reasoningTokens = rawOutput.usage?.reasoningTokens ?? 0;
    const costUsd = computeAiCost(inputTokens, outputTokens, reasoningTokens);

    await QuotaService.recordAiUsage({
      userId,
      kind: 'autofill',
      inputTokens,
      outputTokens: outputTokens + reasoningTokens,
      costUsd,
    });

    // Hard Rule 3: Programmatic Post-Filter
    // The app never invents prices, discounts or dates. Slots of those types stay empty
    // and flagged needs_you unless the user typed them or a brand default exists.
    const sanitizedValues: Record<string, { value: string; source: 'ai' | 'brand_default'; confidence: 'high' | 'medium' | 'low' }> = {};
    const needsYouSet = new Set(rawOutput.needs_you);
    const slotMap = new Map(entry.slots.map((s) => [s.key, s]));

    for (const [key, item] of Object.entries(rawOutput.values)) {
      const slot = slotMap.get(key);
      if (!slot || slot.never_invent) {
        needsYouSet.add(key);
        continue;
      }

      // Sanitize text and cap at slot.max_length
      const cleanVal = sanitizeText(item.value, slot.max_length ?? 500);

      // Verify safety
      const safety = validateInjectionAndBrandRules(cleanVal, brand);
      if (!safety.valid) {
        needsYouSet.add(key);
        continue;
      }

      sanitizedValues[key] = {
        ...item,
        value: cleanVal,
      };
    }

    for (const slot of entry.slots) {
      if (slot.never_invent) {
        delete sanitizedValues[slot.key];
        needsYouSet.add(slot.key);
      }
    }

    // Check layout-fit compatibility
    const intendedShape = entry.intended_product_shape;
    const actualShape = rawOutput.product_shape;
    const layoutFitWarning = Boolean(
      intendedShape &&
      intendedShape !== 'any' &&
      actualShape !== 'other' &&
      intendedShape !== actualShape
    );

    return {
      ...rawOutput,
      values: sanitizedValues,
      needs_you: Array.from(needsYouSet),
      layoutFitWarning,
      intendedProductShape: intendedShape,
      productShape: actualShape,
    };
  }

  async autofillBatch(
    userId: string,
    items: Array<{
      entryId: string;
      imageBuffer: Buffer;
      mimeType: string;
      hint?: string;
    }>
  ): Promise<SanitizedAutofillResult[]> {
    const { QuotaService } = await import('./quotaService');

    // 1. Enforce batch size limit against entitlements.limits.batch_max
    await QuotaService.checkBatchQuota(userId, items.length);

    // 2. Enforce daily autofill quota for the requested batch size
    await QuotaService.checkDailyQuota(userId, 'autofill_per_day', items.length);

    // 3. Process each item (checking circuit breaker and recording AI usage per item)
    const results: SanitizedAutofillResult[] = [];
    for (const item of items) {
      const res = await this.autofill(userId, item.entryId, item.imageBuffer, item.mimeType, item.hint);
      results.push(res);
    }
    return results;
  }
}

export const autofillService = new AutofillService();
