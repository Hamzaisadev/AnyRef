import { validateEnv } from '../lib/env';

export interface AiPricingConfig {
  inputPerMillion: number;
  outputPerMillion: number;
}

const DEFAULT_PRICING: AiPricingConfig = {
  inputPerMillion: 0.30,
  outputPerMillion: 2.50,
};

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

