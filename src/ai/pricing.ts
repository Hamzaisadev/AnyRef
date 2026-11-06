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
