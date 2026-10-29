import { describe, it, expect } from 'vitest';
import type { Brand } from '@/domain/brand';
import { type Slot, resolveBrandSlotValue } from '@/domain/slot';

describe('S2-9: Workbench brand color mapping array alignment', () => {
  const sampleBrand: Brand = {
    id: 'brand-test-1',
    user_id: 'user-test-1',
    name: 'Spectrum Studio',
    what_you_sell: 'Design Services',
    why: 'Creativity',
    tone: 'Vibrant',
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    wordmark: 'SPECTRUM',
    logo_path: null,
    footer_text: '© 2026 Spectrum Studio',
    slogan: 'Color your world',
    never_do_rules: '',
    default_values: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('correctly maps colors_primary to colors[0] and colors_secondary to colors[1]', () => {
    const primarySlot: Slot = {
      key: 'bg_color',
      label: 'Background Color',
      type: 'color',
      required: true,
      optional_block: false,
      never_invent: false,
      brand_field: 'colors_primary',
    };

    const secondarySlot: Slot = {
      key: 'accent_color',
      label: 'Accent Color',
      type: 'color',
      required: false,
      optional_block: false,
      never_invent: false,
      brand_field: 'colors_secondary',
    };

    expect(resolveBrandSlotValue(primarySlot, sampleBrand)).toBe('#3B82F6');
    expect(resolveBrandSlotValue(secondarySlot, sampleBrand)).toBe('#10B981');
  });

  it('handles empty or missing secondary colors gracefully without throwing', () => {
    const singleColorBrand: Brand = {
      ...sampleBrand,
      colors: ['#000000'],
    };

    const secondarySlot: Slot = {
      key: 'accent_color',
      label: 'Accent Color',
      type: 'color',
      required: false,
      optional_block: false,
      never_invent: false,
      brand_field: 'colors_secondary',
    };

    expect(resolveBrandSlotValue(secondarySlot, singleColorBrand)).toBeUndefined();
  });

  it('F2-3: buildInitialAutofillValues pre-seeds brand-mapped slots, brand default_values, and slot defaults before overlaying AI values', async () => {
    const { buildInitialAutofillValues } = await import('@/domain/slot');
    const fs = await import('fs');
    const path = await import('path');

    const brandWithDefaults: Brand = {
      ...sampleBrand,
      default_values: {
        cta_text: 'Shop Spectrum Now',
      },
    };

    const slots: Slot[] = [
      {
        key: 'wordmark',
        label: 'Wordmark',
        type: 'short_text',
        required: true,
        optional_block: false,
        never_invent: false,
        brand_field: 'wordmark',
      },
      {
        key: 'primary_color',
        label: 'Primary Color',
        type: 'color',
        required: true,
        optional_block: false,
        never_invent: false,
        brand_field: 'colors_primary',
      },
      {
        key: 'cta_text',
        label: 'CTA',
        type: 'short_text',
        required: true,
        optional_block: false,
        never_invent: false,
        brand_field: null,
        default: 'Generic Fallback CTA',
      },
      {
        key: 'subheadline',
        label: 'Subheadline',
        type: 'short_text',
        required: true,
        optional_block: false,
        never_invent: false,
        brand_field: null,
        default: 'Default Subheadline',
      },
      {
        key: 'headline',
        label: 'Headline',
        type: 'short_text',
        required: true,
        optional_block: false,
        never_invent: false,
        brand_field: null,
        default: 'Default Headline',
      },
      {
        key: 'price_tag',
        label: 'Price',
        type: 'number',
        required: false,
        optional_block: true,
        never_invent: true,
        brand_field: null,
      },
    ];

    // AI returns only 'headline', omits brand slots and defaults, and marks 'price_tag' needs_you
    const initial = buildInitialAutofillValues(slots, brandWithDefaults, {
      values: {
        headline: { value: 'AI Extracted Headline', source: 'ai', confidence: 'high' },
      },
      needs_you: ['price_tag'],
    });

    expect(initial.wordmark).toBe('SPECTRUM');
    expect(initial.primary_color).toBe('#3B82F6');
    expect(initial.cta_text).toBe('Shop Spectrum Now');
    expect(initial.subheadline).toBe('Default Subheadline');
    expect(initial.headline).toBe('AI Extracted Headline');
    expect(initial.price_tag).toBe('');

    const autofillPageCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/(app)/workspace/autofill/page.tsx'),
      'utf8'
    );
    expect(autofillPageCode).toContain('buildInitialAutofillValues');
  });
});

