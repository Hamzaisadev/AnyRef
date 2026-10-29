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
});
