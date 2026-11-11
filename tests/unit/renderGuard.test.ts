import { describe, it, expect } from 'vitest';
import {
  evaluateRenderGuard,
  findAiSuppliedNeverInvent,
  RENDER_HONESTY_DIRECTIVE,
} from '@/domain/renderGuard';
import type { Slot } from '@/domain/slot';

function slot(overrides: Partial<Slot> & { key: string }): Slot {
  return {
    label: overrides.key,
    type: 'short_text',
    required: false,
    brand_field: null,
    optional_block: false,
    never_invent: false,
    ...overrides,
  } as Slot;
}

describe('evaluateRenderGuard', () => {
  it('allows a fully resolved prompt', () => {
    const slots = [slot({ key: 'headline', required: true })];
    const result = evaluateRenderGuard('Poster reading "Summer Sale"', slots, {
      headline: 'Summer Sale',
    });

    expect(result.canRender).toBe(true);
    expect(result.blockers).toHaveLength(0);
    expect(result.needsYou).toHaveLength(0);
  });

  it('blocks a render when a required never-invent price is empty', () => {
    const slots = [slot({ key: 'price', required: true, never_invent: true, type: 'number' })];
    const result = evaluateRenderGuard('Poster', slots, { price: '' });

    expect(result.canRender).toBe(false);
    expect(result.blockers[0]?.reason).toBe('unresolved_never_invent');
    expect(result.needsYou).toContain('price');
  });

  it.each([
    ['TBD', 'tbd'],
    ['N/A', 'n/a'],
    ['XX', 'xx'],
    ['$XX.99', 'currency stub'],
    ['<price>', 'angle-bracket placeholder'],
    ['[price]', 'square-bracket placeholder'],
    ['your price', 'instructional stub'],
    ['e.g. 30%', 'example stub'],
    ['0', 'zero'],
    ['???', 'question marks'],
  ])('treats %s as unresolved for a never-invent slot (%s)', (value) => {
    const slots = [slot({ key: 'discount', required: true, never_invent: true })];
    const result = evaluateRenderGuard('Poster', slots, { discount: value });

    expect(result.canRender).toBe(false);
    expect(result.needsYou).toContain('discount');
  });

  it('accepts a genuine human-supplied price', () => {
    const slots = [slot({ key: 'price', required: true, never_invent: true })];
    const result = evaluateRenderGuard('Poster at $24.99', slots, { price: '$24.99' });

    expect(result.canRender).toBe(true);
  });

  it('permits an absent OPTIONAL never-invent slot', () => {
    // Nothing factual is asserted when the block collapses, so this is safe.
    const slots = [slot({ key: 'discount', required: false, never_invent: true })];
    const result = evaluateRenderGuard('Poster', slots, {});

    expect(result.canRender).toBe(true);
  });

  it('blocks on missing ordinary required slots', () => {
    const slots = [slot({ key: 'headline', required: true })];
    const result = evaluateRenderGuard('Poster', slots, {});

    expect(result.canRender).toBe(false);
    expect(result.blockers[0]?.reason).toBe('missing_required');
  });

  it('ignores attachment slots when checking required values', () => {
    const slots = [slot({ key: 'product_cutout', required: true, type: 'attachment' })];
    const result = evaluateRenderGuard('Poster', slots, {});

    expect(result.canRender).toBe(true);
  });

  it('blocks when an unsubstituted placeholder survives into the final prompt', () => {
    // Without this check the image model would draw the literal text "{{price}}".
    const slots = [slot({ key: 'price', required: true, never_invent: true })];
    const result = evaluateRenderGuard('Poster reading {{price}}', slots, { price: '$10' });

    expect(result.canRender).toBe(false);
    expect(result.blockers.some((b) => b.reason === 'residual_placeholder')).toBe(true);
    expect(result.needsYou).toContain('price');
  });

  it('reports several independent blockers at once', () => {
    const slots = [
      slot({ key: 'headline', required: true }),
      slot({ key: 'price', required: true, never_invent: true }),
    ];
    const result = evaluateRenderGuard('Poster {{cta}}', slots, {});

    const reasons = result.blockers.map((b) => b.reason);
    expect(reasons).toContain('missing_required');
    expect(reasons).toContain('unresolved_never_invent');
    expect(reasons).toContain('residual_placeholder');
  });

  it('does not leak a never-invent key into missing_required as well', () => {
    const slots = [slot({ key: 'price', required: true, never_invent: true })];
    const result = evaluateRenderGuard('Poster', slots, {});

    const missing = result.blockers.find((b) => b.reason === 'missing_required');
    expect(missing).toBeUndefined();
  });
});

describe('findAiSuppliedNeverInvent', () => {
  it('flags never-invent slots carrying AI-sourced values', () => {
    const slots = [
      slot({ key: 'price', never_invent: true }),
      slot({ key: 'headline', never_invent: false }),
    ];

    const flagged = findAiSuppliedNeverInvent(slots, { price: 'ai', headline: 'ai' });

    expect(flagged).toEqual(['price']);
  });

  it('allows user and brand_default sources on never-invent slots', () => {
    const slots = [slot({ key: 'price', never_invent: true }), slot({ key: 'valid_until', never_invent: true })];

    const flagged = findAiSuppliedNeverInvent(slots, {
      price: 'user',
      valid_until: 'brand_default',
    });

    expect(flagged).toEqual([]);
  });
});

describe('RENDER_HONESTY_DIRECTIVE', () => {
  it('forbids inventing the commercial facts the product promises never to invent', () => {
    expect(RENDER_HONESTY_DIRECTIVE).toMatch(/price/i);
    expect(RENDER_HONESTY_DIRECTIVE).toMatch(/discount/i);
    expect(RENDER_HONESTY_DIRECTIVE).toMatch(/date/i);
    expect(RENDER_HONESTY_DIRECTIVE).toMatch(/watermark/i);
  });
});
