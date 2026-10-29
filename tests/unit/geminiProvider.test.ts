import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '@/ai/geminiProvider';
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
    provider = new GeminiProvider('dummy-key', 'gemini-2.5-flash');
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
    expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it('extracts usageMetadata from API response when available', async () => {
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(sampleValidGenerateOutput),
          usageMetadata: {
            promptTokenCount: 1500,
            candidatesTokenCount: 350,
            totalTokenCount: 1850,
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
});
