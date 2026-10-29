import { describe, it, expect } from 'vitest';
import { renderPrompt } from '@/domain/renderPrompt';
import type { Slot } from '@/domain/slot';
import type { Brand } from '@/domain/brand';

describe('S2-7: Prompt rendering with brand fields rather than raw mustache tags', () => {
  it('renders prompt substituting brand defaults and brand_field bindings instead of raw tags', () => {
    const brand: Brand = {
      id: 'brand-1',
      user_id: 'user-1',
      name: 'Luxe Watches',
      what_you_sell: 'Watches',
      why: 'Craftsmanship',
      tone: 'Refined',
      colors: ['#0A0A0A', '#E5E5E5'],
      wordmark: 'LUXE',
      logo_path: null,
      footer_text: 'Precision Since 1890',
      slogan: 'Time Redefined',
      never_do_rules: '',
      default_values: { headline: 'The New Chronograph' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const slots: Slot[] = [
      {
        key: 'brand_name',
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
        key: 'brand_color',
        label: 'Primary Color',
        type: 'color',
        required: true,
        optional_block: false,
        never_invent: false,
        brand_field: 'colors_primary',
      },
      {
        key: 'footer',
        label: 'Legal Footer',
        type: 'short_text',
        required: false,
        optional_block: true,
        never_invent: false,
        brand_field: 'footer_text',
      },
    ];

    const template = 'Poster for {{brand_name}} in color {{brand_color}}: {{headline}} [[?footer: footer: {{footer}} ]].';

    // Populate values using the logic implemented in LibraryPage copyPrompt
    const initialValues: Record<string, string> = { ...(brand.default_values || {}) };
    for (const slot of slots) {
      if (!initialValues[slot.key] && slot.brand_field) {
        if (slot.brand_field === 'wordmark' && brand.wordmark) {
          initialValues[slot.key] = brand.wordmark;
        } else if (slot.brand_field === 'colors_primary' && brand.colors?.[0]) {
          initialValues[slot.key] = brand.colors[0];
        } else if (slot.brand_field === 'colors_secondary' && brand.colors?.[1]) {
          initialValues[slot.key] = brand.colors[1];
        } else if (slot.brand_field === 'name' && brand.name) {
          initialValues[slot.key] = brand.name;
        } else if (slot.brand_field === 'footer_text' && brand.footer_text) {
          initialValues[slot.key] = brand.footer_text;
        } else if (slot.brand_field === 'slogan' && brand.slogan) {
          initialValues[slot.key] = brand.slogan;
        }
      }
    }

    const { text, missingRequired } = renderPrompt(template, slots, initialValues);

    expect(missingRequired).toHaveLength(0);
    expect(text).not.toContain('{{brand_name}}');
    expect(text).not.toContain('{{headline}}');
    expect(text).not.toContain('{{brand_color}}');
    expect(text).toContain('"LUXE"');
    expect(text).toContain('"The New Chronograph"');
    expect(text).toContain('"#0A0A0A"');
    expect(text).toContain('"Precision Since 1890"');
  });
});
