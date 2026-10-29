import { describe, it, expect } from 'vitest';
import { renderPrompt } from '@/domain/renderPrompt';
import { Slot } from '@/domain/slot';

describe('Seam 3: Pure Prompt Renderer (renderPrompt.ts)', () => {
  const baseSlots: Slot[] = [
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
    {
      key: 'discount',
      label: 'Discount Rate',
      type: 'short_text',
      required: false,
      brand_field: null,
      optional_block: true,
      never_invent: true,
    },
  ];

  it('correctly interpolates {{key}} placeholders inside quotes', () => {
    const template = 'Poster featuring {{wordmark}} with title {{headline}}.';
    const values = {
      wordmark: 'REWIRED',
      headline: 'PURE ACOUSTICS',
    };

    const result = renderPrompt(template, baseSlots, values);
    expect(result.text).toContain('"REWIRED"');
    expect(result.text).toContain('"PURE ACOUSTICS"');
    expect(result.missingRequired).toEqual([]);
  });

  it('removes optional blocks [[?key: ...]] when the slot is empty', () => {
    const template = 'Poster with {{headline}}. [[?discount: Special offer {{discount}} off!]]';
    const values = {
      headline: 'LAUNCH DAY',
      discount: '',
    };

    const result = renderPrompt(template, baseSlots, values);
    expect(result.text).not.toContain('Special offer');
    expect(result.text).not.toContain('discount');
  });

  it('renders optional blocks [[?key: ...]] when the slot is provided', () => {
    const template = 'Poster with {{headline}}. [[?discount: Special offer {{discount}} off!]]';
    const values = {
      headline: 'LAUNCH DAY',
      discount: '25%',
    };

    const result = renderPrompt(template, baseSlots, values);
    expect(result.text).toContain('Special offer "25%" off!');
  });

  it('flags missing required slots', () => {
    const template = 'Poster featuring {{wordmark}} and {{headline}}.';
    const values = {
      wordmark: 'REWIRED',
      // headline missing
    };

    const result = renderPrompt(template, baseSlots, values);
    expect(result.missingRequired).toContain('headline');
  });

  it('generates the ordered Attach in Flow checklist', () => {
    const attachmentSlots: Slot[] = [
      ...baseSlots,
      {
        key: 'product_photo',
        label: 'Product Photo',
        type: 'attachment',
        required: true,
        brand_field: null,
        optional_block: false,
        never_invent: false,
        attachment_order: 1,
      },
      {
        key: 'brand_logo',
        label: 'Brand Wordmark SVG',
        type: 'attachment',
        required: true,
        brand_field: 'wordmark',
        optional_block: false,
        never_invent: false,
        attachment_order: 2,
      },
    ];

    const template = 'Poster featuring {{wordmark}}.';
    const result = renderPrompt(template, attachmentSlots, { wordmark: 'REWIRED', headline: 'TEST' });

    expect(result.attachChecklist).toEqual([
      { order: 1, label: 'Product Photo' },
      { order: 2, label: 'Brand Wordmark SVG' },
    ]);
  });
});
