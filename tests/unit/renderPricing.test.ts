import { describe, it, expect } from 'vitest';
import {
  computeRenderCost,
  getImagePricePerImage,
  IMAGE_MODEL_PRICING_CATALOG,
} from '@/ai/pricing';

describe('getImagePricePerImage', () => {
  it('prices Nano Banana Pro at the published 1K/2K rate', () => {
    expect(getImagePricePerImage('gemini-3-pro-image')).toBe(0.134);
  });

  it('prices the cheaper fallback models correctly', () => {
    expect(getImagePricePerImage('gemini-2.5-flash-image')).toBe(0.039);
    expect(getImagePricePerImage('nano-banana-2')).toBe(0.067);
  });

  it('falls back to env configuration for an unknown model', () => {
    expect(
      getImagePricePerImage('some-future-model', { AI_IMAGE_PRICE_PER_IMAGE_USD: '0.5' })
    ).toBe(0.5);
  });

  it('falls back to the Nano Banana Pro rate when nothing is configured', () => {
    expect(getImagePricePerImage(undefined, {})).toBe(0.134);
  });
});

describe('computeRenderCost', () => {
  it('charges the flat per-image rate', () => {
    expect(computeRenderCost(1, 0, 'gemini-3-pro-image')).toBe(0.134);
  });

  it('adds input token cost at $2.00 per 1M tokens', () => {
    // 1000 input tokens = $0.002
    expect(computeRenderCost(1, 1000, 'gemini-3-pro-image')).toBe(0.136);
  });

  it('scales with image count', () => {
    expect(computeRenderCost(3, 0, 'gemini-3-pro-image')).toBe(0.402);
  });

  it('rounds to 6dp to match the numeric(10,6) column', () => {
    const cost = computeRenderCost(1, 7, 'gemini-3-pro-image');
    expect(cost.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(6);
  });

  it('a render costs far more than a text call, justifying a separate budget', () => {
    const renderCost = computeRenderCost(1, 1200, 'gemini-3-pro-image');
    const textCallBenchmark = 0.003493;
    expect(renderCost / textCallBenchmark).toBeGreaterThan(30);
  });
});

describe('plan economics guardrails', () => {
  it('free tier render allowance stays within a defensible exposure', () => {
    // 3 free renders is the aha-moment allowance; it must stay under ~$0.50.
    const freeExposure = computeRenderCost(3, 0, 'gemini-3-pro-image');
    expect(freeExposure).toBeLessThanOrEqual(0.45);
  });

  it('Pro worst-case render spend leaves a positive margin at $15', () => {
    const netRevenue = 15 * 0.95 - 0.5; // 5% + $0.50 fees
    const worstCase = computeRenderCost(60, 0, 'gemini-3-pro-image');
    expect(worstCase).toBeLessThan(netRevenue);
    expect((netRevenue - worstCase) / netRevenue).toBeGreaterThan(0.35);
  });

  it('every catalogued image model has a positive per-image price', () => {
    for (const [model, pricing] of Object.entries(IMAGE_MODEL_PRICING_CATALOG)) {
      expect(pricing.perImage, `${model} must have a positive price`).toBeGreaterThan(0);
    }
  });
});
