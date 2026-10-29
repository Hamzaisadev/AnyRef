import { describe, it, expect } from 'vitest';
import { computeAiCost, GEMINI_FLASH_PRICING } from '@/ai/pricing';

describe('AI Token Pricing Calculation (pricing.ts)', () => {
  it('correctly calculates cost for zero tokens', () => {
    expect(computeAiCost(0, 0)).toBe(0);
  });

  it('correctly calculates cost for 1,000,000 input tokens', () => {
    // 1M input * $0.075 / 1M = $0.075
    expect(computeAiCost(1_000_000, 0)).toBe(0.075);
  });

  it('correctly calculates cost for 1,000,000 output tokens', () => {
    // 1M output * $0.30 / 1M = $0.30
    expect(computeAiCost(0, 1_000_000)).toBe(0.3);
  });

  it('correctly calculates and rounds cost for 1,500 in and 350 out', () => {
    // 1500 * 0.075 / 1M = 0.0001125
    // 350 * 0.30 / 1M = 0.000105
    // Total = 0.0002175 -> rounded to 6 decimal places: 0.000218
    expect(computeAiCost(1500, 350)).toBe(0.000218);
  });
});
