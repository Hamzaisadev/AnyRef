import { validateEnv } from '../lib/env';

export interface AiPricingConfig {
  inputPerMillion: number;
  outputPerMillion: number;
  sourceUrl?: string;
  retrievedDate?: string;
}

export const OFFICIAL_PRICING_METADATA = {
  sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
  retrievedDate: '2026-10-29',
} as const;

/**
 * Standard token pricing ($ per 1M tokens) across frontier models.
 * Google Gemini: https://ai.google.dev/gemini-api/docs/pricing
 * Anthropic Claude: https://www.anthropic.com/pricing
 */
export const MODEL_PRICING_CATALOG: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  // Frontier Gemini 2.0 / 2.5
  'gemini-2.0-flash': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-2.0-flash-exp': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },
  'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },
  'gemini-3.5-flash-lite': { inputPerMillion: 0.30, outputPerMillion: 2.50 },
  // Frontier Anthropic Claude 3.5 / 3.7
  'claude-3-5-sonnet-20241022': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'claude-3-7-sonnet-20250219': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'claude-3-5-haiku-20241022': { inputPerMillion: 0.80, outputPerMillion: 4.00 },
};

/**
 * Per-image output pricing for image generation models ($ per image).
 * Gemini bills generated images as output tokens at $120/1M: 1120 tokens at 1K/2K
 * and 2000 at 4K, which resolves to the flat per-image figures below.
 * Source: https://aistudio.google.com/docs/pricing (retrieved 2026-11-07)
 */
export const IMAGE_MODEL_PRICING_CATALOG: Record<string, { perImage: number; perImage4k?: number }> = {
  'gemini-3-pro-image': { perImage: 0.134, perImage4k: 0.24 },
  // Scheduled for shutdown 2026-06-25; kept so existing rows price correctly.
  'gemini-3-pro-image-preview': { perImage: 0.134, perImage4k: 0.24 },
  'nano-banana-2': { perImage: 0.067 },
  'gemini-2.5-flash-image': { perImage: 0.039 },
};

const DEFAULT_PER_IMAGE_USD = 0.134;

/**
 * Resolves the flat per-image cost for a render.
 * Falls back to env config, then to the Nano Banana Pro 1K/2K rate.
 */
export function getImagePricePerImage(
  modelName?: string,
  rawEnv: Record<string, unknown> = process.env
): number {
  const catalogEntry = modelName
    ? IMAGE_MODEL_PRICING_CATALOG[modelName.trim().toLowerCase()]
    : undefined;
  if (catalogEntry) return catalogEntry.perImage;

  const fromEnv = Number(rawEnv.AI_IMAGE_PRICE_PER_IMAGE_USD);
  if (Number.isFinite(fromEnv) && fromEnv >= 0) return fromEnv;

  return DEFAULT_PER_IMAGE_USD;
}

/**
 * Computes the cost of an image render.
 * Input tokens (prompt + attached reference images) are billed separately from the
 * flat per-image output charge, so both are included.
 */
export function computeRenderCost(
  imageCount: number,
  inputTokens: number = 0,
  modelName?: string,
  rawEnv: Record<string, unknown> = process.env
): number {
  const perImage = getImagePricePerImage(modelName, rawEnv);
  // Gemini 3 Pro Image text/image input is $2.00 per 1M tokens.
  const inputCost = (inputTokens * 2.0) / 1_000_000;
  const cost = imageCount * perImage + inputCost;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

const DEFAULT_PRICING: AiPricingConfig = {
  inputPerMillion: 0.30,
  outputPerMillion: 2.50,
  sourceUrl: OFFICIAL_PRICING_METADATA.sourceUrl,
  retrievedDate: OFFICIAL_PRICING_METADATA.retrievedDate,
};

/**
 * Resolves standard pricing for a given model identifier.
 */
export function getModelPricing(modelName?: string): { inputPerMillion: number; outputPerMillion: number } | null {
  if (!modelName) return null;
  const trimmed = modelName.trim().toLowerCase();
  return MODEL_PRICING_CATALOG[trimmed] || null;
}

/**
 * Reads AI token pricing ($ per 1M tokens) from environment config (`env.ts`).
 * Defaults to Google's official standard paid-tier rates for `gemini-3.5-flash-lite`
 * ($0.30 / 1M input tokens, $2.50 / 1M output & thinking tokens).
 */
export function getAiPricing(rawEnv: Record<string, unknown> = process.env): AiPricingConfig {
  try {
    const cfg = validateEnv(rawEnv);
    return {
      inputPerMillion: cfg.AI_INPUT_PRICE_PER_1M_USD,
      outputPerMillion: cfg.AI_OUTPUT_PRICE_PER_1M_USD,
      sourceUrl: OFFICIAL_PRICING_METADATA.sourceUrl,
      retrievedDate: OFFICIAL_PRICING_METADATA.retrievedDate,
    };
  } catch {
    const rawIn = Number(rawEnv.AI_INPUT_PRICE_PER_1M_USD);
    const rawOut = Number(rawEnv.AI_OUTPUT_PRICE_PER_1M_USD);
    return {
      inputPerMillion:
        rawEnv.AI_INPUT_PRICE_PER_1M_USD !== undefined &&
        rawEnv.AI_INPUT_PRICE_PER_1M_USD !== '' &&
        Number.isFinite(rawIn) &&
        rawIn >= 0
          ? rawIn
          : DEFAULT_PRICING.inputPerMillion,
      outputPerMillion:
        rawEnv.AI_OUTPUT_PRICE_PER_1M_USD !== undefined &&
        rawEnv.AI_OUTPUT_PRICE_PER_1M_USD !== '' &&
        Number.isFinite(rawOut) &&
        rawOut >= 0
          ? rawOut
          : DEFAULT_PRICING.outputPerMillion,
      sourceUrl: OFFICIAL_PRICING_METADATA.sourceUrl,
      retrievedDate: OFFICIAL_PRICING_METADATA.retrievedDate,
    };
  }
}

/**
 * Computes estimated cost in USD based on configured token pricing in env.ts.
 * Includes reasoning/thinking tokens (`thoughtsTokenCount`), which Google Gemini API
 * bills at the output token rate.
 * Formatted with 6 decimal precision to align with Postgres numeric(10, 6).
 */
export function computeAiCost(
  inputTokens: number,
  outputTokens: number,
  reasoningTokens: number = 0,
  pricingOverride?: AiPricingConfig
): number {
  const pricing = pricingOverride ?? getAiPricing();
  const billableOutputTokens = outputTokens + reasoningTokens;
  const cost =
    (inputTokens * pricing.inputPerMillion +
      billableOutputTokens * pricing.outputPerMillion) /
    1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
