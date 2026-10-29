import { describe, it, expect } from 'vitest';
import { validatePromptTemplate } from '@/domain/validateTemplate';
import { validateInjectionAndBrandRules } from '@/domain/validateInjection';
import type { Slot } from '@/domain/slot';
import type { Brand } from '@/domain/brand';

describe('validatePromptTemplate', () => {
  const validSlots: Slot[] = [
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
      label: 'Discount',
      type: 'short_text',
      required: false,
      brand_field: null,
      optional_block: true,
      never_invent: true,
    },
    {
      key: 'wordmark',
      label: 'Wordmark',
      type: 'short_text',
      required: true,
      optional_block: false,
      never_invent: false,
      brand_field: 'wordmark',
    },
  ];

  it('validates a correct template with placeholders and balanced optional blocks', () => {
    const template =
      'A sleek poster for {{wordmark}} featuring "{{headline}}". [[?discount: Special sale with {{discount}} off! ]] Clean studio background.';
    const result = validatePromptTemplate(template, validSlots);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('detects missing slot for placeholder {{missing_key}}', () => {
    const template = 'Poster for {{wordmark}} with {{missing_key}}.';
    const result = validatePromptTemplate(template, validSlots);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing_key'))).toBe(true);
  });

  it('detects defined slots that are never referenced in the template', () => {
    const template = 'Poster for {{wordmark}} only.';
    const result = validatePromptTemplate(template, validSlots);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('headline'))).toBe(true);
    expect(result.errors.some((e) => e.includes('discount'))).toBe(true);
  });

  it('detects duplicate slot keys in slot definitions', () => {
    const duplicateSlots: Slot[] = [
      ...validSlots,
      {
        key: 'headline', // duplicate!
        label: 'Headline Duplicate',
        type: 'short_text',
        required: false,
        brand_field: null,
        optional_block: false,
        never_invent: false,
      },
    ];
    const template = 'Poster for {{wordmark}} with {{headline}}. [[?discount: {{discount}} ]]';
    const result = validatePromptTemplate(template, duplicateSlots);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate slot keys'))).toBe(true);
  });

  it('detects unbalanced optional block markers', () => {
    const template = 'Poster for {{wordmark}} with {{headline}}. [[?discount: {{discount}}';
    const result = validatePromptTemplate(template, validSlots);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Unbalanced optional block markers'))).toBe(true);
  });

  it('detects optional block targeting a slot without optional_block=true', () => {
    const template =
      'Poster for {{wordmark}}. [[?headline: Featured text is {{headline}} ]] [[?discount: {{discount}} ]]';
    const result = validatePromptTemplate(template, validSlots);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('does not have optional_block=true'))).toBe(true);
  });

  it('rejects empty or whitespace-only prompt templates', () => {
    expect(validatePromptTemplate('', validSlots).valid).toBe(false);
    expect(validatePromptTemplate('   ', validSlots).valid).toBe(false);
  });
});

describe('validateInjectionAndBrandRules', () => {
  const mockBrand: Brand = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Rewired',
    what_you_sell: 'Audio gear',
    why: 'Focus',
    tone: 'Technical',
    colors: ['#0F1020'],
    wordmark: 'REWIRED',
    logo_path: null,
    footer_text: '',
    slogan: '',
    never_do_rules: 'Never use neon text; avoid vintage filters; no tangled cables.',
    default_values: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('rejects script injection tags', () => {
    const dirty = 'Poster layout <script>alert("hacked")</script>';
    const result = validateInjectionAndBrandRules(dirty, mockBrand);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('<script>'))).toBe(true);
  });

  it('rejects javascript: and dangerous URI protocols', () => {
    const dirty = 'Poster design with link javascript:doBad()';
    const result = validateInjectionAndBrandRules(dirty, mockBrand);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('javascript:'))).toBe(true);
  });

  it('rejects external URLs and email addresses inside prompt templates', () => {
    const withUrl = 'Visit https://malicious.com for promo details';
    expect(validateInjectionAndBrandRules(withUrl, mockBrand).valid).toBe(false);

    const withEmail = 'Contact support@brand.com for discounts';
    expect(validateInjectionAndBrandRules(withEmail, mockBrand).valid).toBe(false);
  });

  it('detects violations of brand never_do_rules', () => {
    const violatesNeon = 'Bold composition with glowing neon text in the center.';
    const result1 = validateInjectionAndBrandRules(violatesNeon, mockBrand);
    expect(result1.valid).toBe(false);
    expect(result1.errors.some((e) => e.includes('neon text'))).toBe(true);

    const violatesVintage = 'Warm portrait lighting with a retro vintage filter applied.';
    const result2 = validateInjectionAndBrandRules(violatesVintage, mockBrand);
    expect(result2.valid).toBe(false);
    expect(result2.errors.some((e) => e.includes('vintage filter'))).toBe(true);
  });

  it('passes clean marketing poster descriptions complying with rules', () => {
    const clean =
      'Minimalist matte black layout, studio rim lighting, neutral concrete pedestal.';
    const result = validateInjectionAndBrandRules(clean, mockBrand);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
