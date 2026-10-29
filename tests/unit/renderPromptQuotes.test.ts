import { describe, it, expect } from 'vitest';
import { renderPrompt } from '@/domain/renderPrompt';
import { Slot } from '@/domain/slot';

describe('S3-1: renderPrompt slot quoting behavior', () => {
  const slots: Slot[] = [
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
      key: 'brand_color',
      label: 'Brand Color',
      type: 'color',
      required: true,
      brand_field: 'colors_primary',
      optional_block: false,
      never_invent: false,
    },
    {
      key: 'item_count',
      label: 'Item Count',
      type: 'number',
      required: true,
      brand_field: null,
      optional_block: false,
      never_invent: false,
    },
    {
      key: 'launch_date',
      label: 'Launch Date',
      type: 'date',
      required: true,
      brand_field: null,
      optional_block: false,
      never_invent: false,
    },
    {
      key: 'layout_choice',
      label: 'Layout Choice',
      type: 'choice',
      options: ['minimal', 'bold'],
      required: true,
      brand_field: null,
      optional_block: false,
      never_invent: false,
    },
  ];

  it('quotes unquoted short_text slots', () => {
    const template = 'Headline: {{headline}}.';
    const result = renderPrompt(template, slots, { headline: 'Summer Sale' });
    expect(result.text).toBe('Headline: "Summer Sale".');
  });

  it('does NOT double-quote short_text slots that are already inside quotes in template', () => {
    const templateDouble = 'Headline: "{{headline}}".';
    const resultDouble = renderPrompt(templateDouble, slots, { headline: 'Summer Sale' });
    expect(resultDouble.text).toBe('Headline: "Summer Sale".');
    expect(resultDouble.text).not.toContain('""Summer Sale""');

    const templateSingle = "Headline: '{{headline}}'.";
    const resultSingle = renderPrompt(templateSingle, slots, { headline: 'Summer Sale' });
    expect(resultSingle.text).toBe("Headline: 'Summer Sale'.");
    expect(resultSingle.text).not.toContain("''Summer Sale''");
  });

  it('does NOT quote color slots', () => {
    const template = 'Accent color is {{brand_color}}.';
    const result = renderPrompt(template, slots, { brand_color: '#4B2BFF' });
    expect(result.text).toBe('Accent color is #4B2BFF.');
    expect(result.text).not.toContain('"#4B2BFF"');
  });

  it('does NOT quote number, date, or choice slots', () => {
    const template = 'Pack of {{item_count}} arriving on {{launch_date}} in {{layout_choice}} style.';
    const result = renderPrompt(template, slots, {
      item_count: '5',
      launch_date: '2026-11-01',
      layout_choice: 'minimal',
    });
    expect(result.text).toBe('Pack of 5 arriving on 2026-11-01 in minimal style.');
  });
});
