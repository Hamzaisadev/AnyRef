import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeProvider } from '@/ai/claudeProvider';
import { AiProviderError, AiInvalidOutputError } from '@/lib/errors';

describe('ClaudeProvider', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('throws error when API key is missing or model ends with -latest', () => {
    expect(() => new ClaudeProvider('', 'claude-3-7-sonnet-20250219')).toThrow(
      'ANTHROPIC_API_KEY is required'
    );
    expect(() => new ClaudeProvider('test-key', 'claude-3-7-sonnet-latest')).toThrow(
      'must not end in "-latest"'
    );
  });

  it('throws AiProviderError when Anthropic API responds with non-200 status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue('{"error": {"message": "Invalid API key"}}'),
    } as any);

    const provider = new ClaudeProvider('invalid-key', 'claude-3-7-sonnet-20250219');

    await expect(
      provider.generateStudio({
        referenceBuffer: Buffer.from('ref-bytes'),
        referenceMimeType: 'image/jpeg',
        productBuffer: Buffer.from('prod-bytes'),
        productMimeType: 'image/png',
      })
    ).rejects.toThrow(AiProviderError);
  });

  it('successfully executes generateStudio, normalizes payload, and records token usage', async () => {
    const mockApiResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            marketingCopy: {
              headline: 'REDEFINE AUDIO',
              offer: 'EARLY BIRD · 30% OFF',
              cta: 'GET YOURS',
              accentColor: '#4B2BFF',
              brandName: 'AURA',
              productDescription: 'Matte black studio headphones',
            },
            readyPrompt:
              'Studio commercial ad featuring matte black studio headphones with high-contrast chiaroscuro lighting.',
            enginePrompts: {
              midjourney: 'Midjourney v6.1 prompt --ar 9:16 --v 6.1 --style raw',
              flux: 'Flux photographic prompt',
              ideogram: 'Ideogram typographic prompt',
            },
            visualAnalysis: {
              referenceStyle: 'Chiaroscuro studio lighting',
              productIdentified: 'Over-ear headphones',
              suggestedAspectRatio: '9:16',
              palette: ['#0F1020', '#4B2BFF'],
            },
            promptTemplate: 'Prompt with {{headline}} and {{offer}}.',
          }),
        },
      ],
      usage: {
        input_tokens: 1450,
        output_tokens: 620,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockApiResponse),
    } as any);

    const provider = new ClaudeProvider('sk-ant-test', 'claude-3-7-sonnet-20250219');
    const result = await provider.generateStudio({
      referenceBuffer: Buffer.from('ref-image'),
      referenceMimeType: 'image/jpeg',
      productBuffer: Buffer.from('prod-image'),
      productMimeType: 'image/png',
      aspectRatio: '9:16',
      targetEngine: 'midjourney',
    });

    expect(result.marketingCopy.headline).toBe('REDEFINE AUDIO');
    expect(result.marketingCopy.offer).toBe('EARLY BIRD · 30% OFF');
    expect(result.marketingCopy.cta).toBe('GET YOURS');
    expect(result.marketingCopy.accentColor).toBe('#4B2BFF');
    expect(result.usage?.inputTokens).toBe(1450);
    expect(result.usage?.outputTokens).toBe(620);
  });
});
