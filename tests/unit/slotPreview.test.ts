import { describe, it, expect } from 'vitest';
import type { Slot } from '@/domain/slot';
import { parseTemplateTokens, getSlotTokenColorClass } from '@/components/SlotPreview';

describe('S2-11: SlotPreview token colors and template parsing', () => {
  const sampleSlots: Slot[] = [
    {
      key: 'brand_wordmark',
      label: 'Brand Wordmark',
      type: 'short_text',
      required: true,
      optional_block: false,
      never_invent: false,
      brand_field: 'wordmark',
    },
    {
      key: 'headline',
      label: 'Headline',
      type: 'short_text',
      required: true,
      optional_block: false,
      never_invent: false,
      brand_field: null,
    },
    {
      key: 'discount',
      label: 'Discount',
      type: 'short_text',
      required: true,
      optional_block: false,
      never_invent: true,
      brand_field: null,
    },
  ];

  it('assigns blue token class to brand slots', () => {
    const brandSlot = sampleSlots.find((s) => s.key === 'brand_wordmark')!;
    const colorClass = getSlotTokenColorClass(brandSlot);
    expect(colorClass).toContain('brand-layer');
  });

  it('assigns amber/orange token class to per-poster/campaign and never-invent slots', () => {
    const campaignSlot = sampleSlots.find((s) => s.key === 'headline')!;
    const neverInventSlot = sampleSlots.find((s) => s.key === 'discount')!;

    const campaignColor = getSlotTokenColorClass(campaignSlot);
    const neverInventColor = getSlotTokenColorClass(neverInventSlot);

    expect(campaignColor).toMatch(/primary|accent/);
    expect(neverInventColor).toMatch(/accent|danger/);
  });

  it('parses template into text and slot tokens correctly', () => {
    const template = 'Poster for {{brand_wordmark}}: {{headline}} with {{discount}} off.';
    const tokens = parseTemplateTokens(template, sampleSlots);

    expect(tokens).toHaveLength(7);
    expect(tokens[0]).toEqual({ type: 'text', content: 'Poster for ' });
    expect(tokens[1]).toMatchObject({ type: 'slot', key: 'brand_wordmark' });
    expect(tokens[2]).toEqual({ type: 'text', content: ': ' });
    expect(tokens[3]).toMatchObject({ type: 'slot', key: 'headline' });
    expect(tokens[4]).toEqual({ type: 'text', content: ' with ' });
    expect(tokens[5]).toMatchObject({ type: 'slot', key: 'discount' });
    expect(tokens[6]).toEqual({ type: 'text', content: ' off.' });
  });

  it('handles optional blocks [[?key: ...]] parsing', () => {
    const template = 'Header [[?footer: Legal: {{footer}} ]].';
    const slotsWithFooter: Slot[] = [
      ...sampleSlots,
      {
        key: 'footer',
        label: 'Footer Text',
        type: 'short_text',
        required: false,
        optional_block: true,
        never_invent: false,
        brand_field: 'footer_text',
      },
    ];

    const tokens = parseTemplateTokens(template, slotsWithFooter);
    const optionalToken = tokens.find((t) => t.type === 'optional_block');
    expect(optionalToken).toBeDefined();
    expect(optionalToken?.key).toBe('footer');
  });
});
