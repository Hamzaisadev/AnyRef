import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeSlotValues } from '@/lib/sanitize';
import type { Slot } from '@/domain/slot';

describe('sanitizeText', () => {
  it('preserves clean ASCII and normal whitespace', () => {
    const input = 'High-performance audio poster with bold typography.';
    expect(sanitizeText(input)).toBe(input);
  });

  it('preserves valid newlines, tabs, and carriage returns', () => {
    const input = "Line 1\nLine 2\tTabbed\r\nLine 3";
    expect(sanitizeText(input)).toBe("Line 1\nLine 2\tTabbed\r\nLine 3");
  });

  it('strips dangerous ASCII control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F)', () => {
    const dirty = "Hello\x00\x01\x07World\x7F!\x1B[31mRed";
    expect(sanitizeText(dirty)).toBe("HelloWorld![31mRed");
  });

  it('strips invisible zero-width and bidirectional override unicode characters', () => {
    // \u200B (ZWSP), \u200C (ZWNJ), \u200D (ZWJ), \uFEFF (BOM), \u202E (Right-to-Left Override)
    const dirty = "Nike\u200B \uFEFFAir\u200D \u202EMax";
    expect(sanitizeText(dirty)).toBe("Nike Air Max");
  });

  it('normalizes unicode via NFKC', () => {
    // Ligatures and compatibility characters (e.g. ﬁ -> fi)
    const ligature = 'The \uFB01nal poster';
    expect(sanitizeText(ligature)).toBe('The final poster');
  });

  it('enforces maximum length truncation when specified', () => {
    const longText = 'A'.repeat(500);
    const result = sanitizeText(longText, 50);
    expect(result.length).toBe(50);
  });

  it('handles non-string inputs safely by returning empty string', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText(12345)).toBe('');
    expect(sanitizeText({})).toBe('');
  });
});

describe('sanitizeSlotValues', () => {
  const mockSlots: Slot[] = [
    {
      key: 'headline',
      label: 'Main Headline',
      type: 'short_text',
      required: true,
      max_length: 20,
      brand_field: null,
      optional_block: false,
      never_invent: false,
    },
    {
      key: 'description',
      label: 'Body Text',
      type: 'short_text',
      required: false,
      max_length: 100,
      brand_field: null,
      optional_block: true,
      never_invent: false,
    },
  ];

  it('caps each slot value to its slot max_length definition', () => {
    const rawValues = {
      headline: 'This is an excessively long headline that exceeds 20 characters',
      description: 'Clean description text',
    };

    const sanitized = sanitizeSlotValues(rawValues, mockSlots);
    expect(sanitized.headline).toBeDefined();
    expect(sanitized.headline?.length).toBe(20);
    expect(sanitized.headline).toBe('This is an excessive');
    expect(sanitized.description).toBe('Clean description text');
  });

  it('strips control and zero-width characters across all slot values', () => {
    const rawValues = {
      headline: 'Fresh\u200B \x00Drop',
    };

    const sanitized = sanitizeSlotValues(rawValues, mockSlots);
    expect(sanitized.headline).toBe('Fresh Drop');
  });
});
