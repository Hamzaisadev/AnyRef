import { describe, it, expect } from 'vitest';
import React from 'react';
import { BrandSwitcher } from '@/components/BrandSwitcher';

describe('S2-12: BrandSwitcher empty brand fallback CTA', () => {
  it('renders "Create your first brand" link CTA when brands list is empty instead of returning null', () => {
    // Invoke component directly with empty brands
    const result = BrandSwitcher({ initialBrands: [] });

    expect(result).not.toBeNull();
    expect(result?.props?.href).toBe('/brands');
    const children = Array.isArray(result?.props?.children)
      ? result.props.children
      : [result?.props?.children];
    const textChild = children.find((c: any) => c?.props?.children === 'Create your first brand');
    expect(textChild).toBeDefined();
  });

  it('renders dropdown select when brands are present', () => {
    const sampleBrands = [
      {
        id: 'brand-1',
        name: 'Nexus Alpha',
        user_id: 'user-1',
        what_you_sell: '',
        why: '',
        tone: '',
        colors: ['#000000'],
        wordmark: '',
        logo_path: null,
        footer_text: '',
        slogan: '',
        never_do_rules: '',
        default_values: {},
        created_at: '',
        updated_at: '',
      },
    ];

    const result = BrandSwitcher({ initialBrands: sampleBrands, activeBrandId: 'brand-1' });
    expect(result).not.toBeNull();
    expect(JSON.stringify(result)).toContain('Nexus Alpha');
    expect(JSON.stringify(result)).toContain('select');
  });
});
