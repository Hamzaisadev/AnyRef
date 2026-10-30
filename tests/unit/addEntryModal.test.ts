import { describe, it, expect } from 'vitest';

describe('Manual Add Entry & Bulk Import Logic', () => {
  function extractKeys(text: string): string[] {
    return Array.from(
      new Set(
        Array.from(text.matchAll(/\{\{([a-z][a-z0-9_]{1,40})\}\}/gi)).map((m) =>
          m[1]!.toLowerCase()
        )
      )
    );
  }

  function parseBulkPrompts(bulkText: string): string[] {
    return bulkText
      .split(/\n\s*---\s*\n|\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 10);
  }

  it('correctly extracts unique slot keys and normalizes to lowercase', () => {
    const prompt = 'Studio poster for {{brand_name}} featuring {{product_name}} with {{PRIMARY_COLOR}} background. {{brand_name}} wordmark.';
    const keys = extractKeys(prompt);

    expect(keys).toEqual(['brand_name', 'product_name', 'primary_color']);
  });

  it('splits bulk input by --- delimiters accurately', () => {
    const bulk = `First campaign prompt for {{brand_name}} with neon lighting.\n---\nSecond minimalist poster for {{product_name}} on stone podium.\n---\nThird festive holiday banner.`;
    const prompts = parseBulkPrompts(bulk);

    expect(prompts).toHaveLength(3);
    expect(prompts[0]).toContain('First campaign');
    expect(prompts[1]).toContain('Second minimalist');
    expect(prompts[2]).toContain('Third festive');
  });

  it('splits bulk input by double line breaks and ignores short lines', () => {
    const bulk = `Prompt number one with enough characters to qualify as a valid poster prompt.\n\n\nPrompt number two is also long enough and formatted nicely.\n\nToo short\n\nPrompt number three with high quality typography instructions.`;
    const prompts = parseBulkPrompts(bulk);

    expect(prompts).toHaveLength(3);
    expect(prompts.every((p) => p.length >= 10)).toBe(true);
  });
});
