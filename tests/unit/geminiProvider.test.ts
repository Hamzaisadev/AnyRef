import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GeminiProvider,
  normalizeGenerateOutput,
  normalizeAutofillOutput,
  parseJsonFromLlm,
} from '@/ai/geminiProvider';
import { GenerateOutput, AutofillOutput } from '@/ai/schemas';
import { AiInvalidOutputError, AiProviderError } from '@/lib/errors';
import type { Brand } from '@/domain/brand';

describe('Slice 3 Seam: GeminiProvider (geminiProvider.ts)', () => {
  let provider: GeminiProvider;
  const mockBrand: Brand = {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    user_id: 'u-1',
    name: 'Rewired',
    what_you_sell: 'Audio gear',
    why: 'Focus',
    tone: 'Energetic',
    colors: ['#0F1020', '#4B2BFF'],
    wordmark: 'REWIRED',
    slogan: 'Engineered for Focus',
    footer_text: 'All rights reserved.',
    never_do_rules: 'No neon.',
    default_values: {},
    created_at: 'now',
    updated_at: 'now',
  };

  const sampleValidGenerateOutput = {
    prompt_template: 'A modern studio poster with clean concrete floor. In the center sits the exact product in the attached product image, reproduced faithfully and unchanged. Top reads {{wordmark}} in bold. Bottom reads {{headline}}.',
    slots: [
      {
        key: 'wordmark',
        label: 'Brand Wordmark',
        type: 'short_text',
        required: true,
        brand_field: 'wordmark',
        optional_block: false,
        never_invent: false,
      },
      {
        key: 'headline',
        label: 'Headline',
        type: 'short_text',
        required: true,
        brand_field: null,
        optional_block: false,
        never_invent: false,
      },
    ],
    poster_type: 'launch',
    intended_product_shape: 'tall',
    layout_notes: 'Minimalist studio setup',
  };

  beforeEach(() => {
    provider = new GeminiProvider('dummy-key', 'gemini-3.5-flash-lite');
  });

  it('uses the exact configured model name and does not silently rewrite gemini-2.5-flash or gemini-3.5-flash-lite', () => {
    const p1 = new GeminiProvider('dummy-key', 'gemini-2.5-flash');
    expect((p1 as unknown as { model: { model: string } }).model.model).toContain('gemini-2.5-flash');

    const p2 = new GeminiProvider('dummy-key', 'gemini-3.5-flash-lite');
    expect((p2 as unknown as { model: { model: string } }).model.model).toContain('gemini-3.5-flash-lite');
  });

  it('throws if modelName is empty or ends in "-latest"', () => {
    expect(() => new GeminiProvider('dummy-key', '')).toThrow();
    expect(() => new GeminiProvider('dummy-key', 'gemini-flash-latest')).toThrow(/-latest/i);
  });

  it('successfully parses valid model JSON output', async () => {
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(sampleValidGenerateOutput),
        },
      }),
    };
    (provider as unknown as { model: typeof mockModel }).model = mockModel;

    const result = await provider.generateTemplate({
      imageBuffer: Buffer.from('fake-image'),
      mimeType: 'image/jpeg',
      brand: mockBrand,
    });

    expect(result.poster_type).toBe('launch');
    expect(result.slots.length).toBe(2);
    // When usageMetadata is absent in response, falls back to 0
    expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0, reasoningTokens: 0 });
  });

  it('extracts usageMetadata including thoughtsTokenCount as reasoningTokens from API response', async () => {
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(sampleValidGenerateOutput),
          usageMetadata: {
            promptTokenCount: 1500,
            candidatesTokenCount: 350,
            thoughtsTokenCount: 210,
            totalTokenCount: 2060,
          },
        },
      }),
    };
    (provider as unknown as { model: typeof mockModel }).model = mockModel;

    const result = await provider.generateTemplate({
      imageBuffer: Buffer.from('fake-image'),
      mimeType: 'image/jpeg',
      brand: mockBrand,
    });

    expect(result.usage).toEqual({
      inputTokens: 1500,
      outputTokens: 350,
      reasoningTokens: 210,
    });
  });

  it('throws AiInvalidOutputError when model output fails Zod validation after retry', async () => {
    const invalidOutput = {
      prompt_template: 'Too short', // fails min(200)
      slots: [],
      poster_type: 'launch',
      intended_product_shape: 'tall',
      layout_notes: '',
    };

    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(invalidOutput),
        },
      }),
    };
    (provider as unknown as { model: typeof mockModel }).model = mockModel;

    await expect(
      provider.generateTemplate({
        imageBuffer: Buffer.from('fake-image'),
        mimeType: 'image/jpeg',
        brand: mockBrand,
      })
    ).rejects.toThrow(AiInvalidOutputError);

    // Verify retry-once policy executed (2 calls)
    expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
  });

  it('throws AiProviderError when upstream API throws network failure', async () => {
    const mockModel = {
      generateContent: vi.fn().mockRejectedValue(new Error('API quota exceeded or network down')),
    };
    (provider as unknown as { model: typeof mockModel }).model = mockModel;

    await expect(
      provider.generateTemplate({
        imageBuffer: Buffer.from('fake-image'),
        mimeType: 'image/jpeg',
        brand: mockBrand,
      })
    ).rejects.toThrow(AiProviderError);
  });

  describe('normalizeGenerateOutput resilience', () => {
    it('normalizes raw model output with missing fields, uppercase keys, and synonym enums', () => {
      const rawLlmOutput = {
        prompt:
          'A professional studio shot with neutral concrete backdrop. In the center sits the exact product in the attached product image, reproduced faithfully and unchanged. Top text reads {{Headline}} in bold sans-serif. Bottom footer reads {{Brand-Wordmark}}.',
        slots: [
          {
            key: 'Headline',
            label: 'Headline',
            type: 'text',
          },
          {
            key: 'Brand-Wordmark',
            label: 'Brand Wordmark',
            type: 'text',
            brand_field: 'wordmark',
          },
        ],
        poster_type: 'promotional',
        product_shape: 'portrait',
      };

      const normalized = normalizeGenerateOutput(rawLlmOutput);
      const validation = GenerateOutput.safeParse(normalized);

      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.poster_type).toBe('sale');
        expect(validation.data.intended_product_shape).toBe('tall');
        expect(validation.data.layout_notes).toBe('Reference poster layout analyzed.');
        const s0 = validation.data.slots[0]!;
        const s1 = validation.data.slots[1]!;
        expect(s0.key).toBe('headline');
        expect(s0.type).toBe('short_text');
        expect(s0.required).toBe(true);
        expect(s0.optional_block).toBe(false);
        expect(s0.brand_field).toBeNull();
        expect(s1.key).toBe('brand_wordmark');
        expect(s1.brand_field).toBe('wordmark');
        expect(validation.data.prompt_template).toContain('{{headline}}');
        expect(validation.data.prompt_template).toContain('{{brand_wordmark}}');
      }
    });

    it('synthesizes missing slot definitions from placeholders in prompt_template', () => {
      const rawLlmOutput = {
        prompt_template:
          'A minimalist studio poster with soft directional lighting. In the center sits the exact product in the attached product image, reproduced faithfully and unchanged. Features prominent callout {{discount_text}} and cta button [[?cta_button: {{cta_button}}]].',
        slots: [],
        poster_type: 'sale',
        intended_product_shape: 'square',
        layout_notes: 'Studio lighting',
      };

      const normalized = normalizeGenerateOutput(rawLlmOutput);
      const validation = GenerateOutput.safeParse(normalized);

      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.slots.some((s) => s.key === 'discount_text')).toBe(true);
        expect(validation.data.slots.some((s) => s.key === 'cta_button')).toBe(true);
      }
    });
  });

  describe('parseJsonFromLlm', () => {
    it('strips markdown code blocks around JSON', () => {
      const markdownJson = '```json\n{\n  "key": "value"\n}\n```';
      const parsed = parseJsonFromLlm(markdownJson);
      expect(parsed).toEqual({ key: 'value' });
    });
  });

  describe('normalizeAutofillOutput resilience', () => {
    it('normalizes shorthand string values and maps shape synonyms', () => {
      const rawAutofill = {
        values: {
          headline: 'Fresh Brew, Every Morning',
          cta: { value: 'Shop Now', source: 'brand_default', confidence: 'high' },
        },
        needs_you: ['price_tag'],
        product_shape: 'vertical',
        product_guess: 'Coffee beans bag',
      };

      const normalized = normalizeAutofillOutput(rawAutofill);
      const validation = AutofillOutput.safeParse(normalized);

      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.product_shape).toBe('tall');
        expect(validation.data.values.headline).toEqual({
          value: 'Fresh Brew, Every Morning',
          source: 'ai',
          confidence: 'high',
        });
        expect(validation.data.values.cta).toEqual({
          value: 'Shop Now',
          source: 'brand_default',
          confidence: 'high',
        });
      }
    });
  });
});
