import { describe, it, expect, afterEach } from 'vitest';
import { computeAiCost, getAiPricing } from '@/ai/pricing';

describe('AI Token Pricing Calculation (pricing.ts)', () => {
  const origIn = process.env.AI_INPUT_PRICE_PER_1M_USD;
  const origOut = process.env.AI_OUTPUT_PRICE_PER_1M_USD;

  afterEach(() => {
    if (origIn === undefined) delete process.env.AI_INPUT_PRICE_PER_1M_USD;
    else process.env.AI_INPUT_PRICE_PER_1M_USD = origIn;
    if (origOut === undefined) delete process.env.AI_OUTPUT_PRICE_PER_1M_USD;
    else process.env.AI_OUTPUT_PRICE_PER_1M_USD = origOut;
  });

  it('correctly calculates cost for zero tokens', () => {
    expect(computeAiCost(0, 0, 0)).toBe(0);
  });

  it('reads prices from config (defaulting to gemini-3.5-flash-lite: $0.30/1M in, $2.50/1M out)', () => {
    delete process.env.AI_INPUT_PRICE_PER_1M_USD;
    delete process.env.AI_OUTPUT_PRICE_PER_1M_USD;
    const pricing = getAiPricing();
    expect(pricing.inputPerMillion).toBe(0.30);
    expect(pricing.outputPerMillion).toBe(2.50);

    expect(computeAiCost(1_000_000, 0)).toBe(0.30);
    expect(computeAiCost(0, 1_000_000)).toBe(2.50);
  });

  it('includes reasoning/thinking tokens billed at the output token rate', () => {
    process.env.AI_INPUT_PRICE_PER_1M_USD = '0.30';
    process.env.AI_OUTPUT_PRICE_PER_1M_USD = '2.50';
    // 1000 input * 0.30 / 1M = 0.000300
    // (400 output + 600 reasoning) * 2.50 / 1M = 0.002500
    // Total = 0.002800
    expect(computeAiCost(1000, 400, 600)).toBe(0.0028);
  });

  it('respects custom config prices from environment (e.g. gemini-3.8-flash: $0.75/1M in, $3.75/1M out)', () => {
    process.env.AI_INPUT_PRICE_PER_1M_USD = '0.75';
    process.env.AI_OUTPUT_PRICE_PER_1M_USD = '3.75';
    // 2000 input * 0.75 / 1M = 0.001500
    // (500 output + 500 reasoning) * 3.75 / 1M = 0.003750
    // Total = 0.005250
    expect(computeAiCost(2000, 500, 500)).toBe(0.00525);
  });
});

