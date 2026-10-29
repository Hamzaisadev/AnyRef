export const GEMINI_FLASH_PRICING = {
  inputPerMillion: 0.075,
  outputPerMillion: 0.30,
};

/**
 * Computes estimated cost in USD based on Gemini Flash token pricing.
 * Formatted with 6 decimal precision to align with Postgres numeric(10, 6).
 */
export function computeAiCost(inputTokens: number, outputTokens: number): number {
  const cost =
    (inputTokens * GEMINI_FLASH_PRICING.inputPerMillion +
      outputTokens * GEMINI_FLASH_PRICING.outputPerMillion) /
    1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
