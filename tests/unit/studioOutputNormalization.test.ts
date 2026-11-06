import { describe, it, expect } from 'vitest';
import { normalizeStudioOutput } from '@/ai/geminiProvider';
import { StudioGenerateOutput } from '@/ai/schemas';

describe('normalizeStudioOutput', () => {
  it('supplies solid commercial fallbacks when model returns empty or minimal object', () => {
    const raw = {};
    const normalized = normalizeStudioOutput(raw);

    const validation = StudioGenerateOutput.safeParse(normalized);
    expect(validation.success).toBe(true);

    if (validation.success) {
      expect(validation.data.marketingCopy.headline).toBe('REDEFINE YOUR WORLD');
      expect(validation.data.marketingCopy.offer).toBe('LAUNCH SPECIAL · LIMITED EDITION');
      expect(validation.data.marketingCopy.cta).toBe('ORDER NOW');
      expect(validation.data.marketingCopy.accentColor).toBe('#4B2BFF');
      expect(validation.data.visualAnalysis.suggestedAspectRatio).toBe('9:16');
      expect(validation.data.visualAnalysis.palette.length).toBeGreaterThanOrEqual(1);
      expect(validation.data.enginePrompts.midjourney).toContain('--ar');
      expect(validation.data.enginePrompts.flux).toBeDefined();
      expect(validation.data.enginePrompts.ideogram).toBeDefined();
    }
  });

  it('normalizes hex colors without leading # and rejects invalid hex codes', () => {
    const raw = {
      marketingCopy: {
        headline: 'GLOW DEEPER',
        offer: 'BUY 1 GET 1',
        cta: 'SHOP',
        accentColor: 'FF8A3D', // missing hash
      },
      visualAnalysis: {
        palette: ['#000', '4B2BFF', 'invalid-color', '#123456'],
      },
    };

    const normalized = normalizeStudioOutput(raw);
    expect(normalized.marketingCopy.accentColor).toBe('#FF8A3D');
    expect(normalized.visualAnalysis.palette).toContain('#4B2BFF');
    expect(normalized.visualAnalysis.palette).toContain('#123456');
    expect(normalized.visualAnalysis.palette).not.toContain('invalid-color');
  });

  it('preserves valid engine-tailored prompts if provided by the model', () => {
    const raw = {
      marketingCopy: {
        headline: 'THE NEW STANDARD',
        offer: 'LIMITED RUN',
        cta: 'EXPLORE',
        accentColor: '#10B981',
      },
      readyPrompt: 'Clean commercial ad prompt ready for copy-paste.',
      promptTemplate: 'Clean commercial ad prompt with {{headline}} and {{offer}}.',
      enginePrompts: {
        midjourney: 'Custom Midjourney prompt with --ar 16:9 --v 6.1 --style raw',
        flux: 'Custom Flux prompt with natural lighting',
        ideogram: 'Custom Ideogram prompt with typography',
      },
    };

    const normalized = normalizeStudioOutput(raw);
    expect(normalized.enginePrompts.midjourney).toBe(raw.enginePrompts.midjourney);
    expect(normalized.enginePrompts.flux).toBe(raw.enginePrompts.flux);
    expect(normalized.enginePrompts.ideogram).toBe(raw.enginePrompts.ideogram);
  });
});
