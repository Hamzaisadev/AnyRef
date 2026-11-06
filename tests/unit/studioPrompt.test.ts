import { describe, it, expect } from 'vitest';
import { renderStudioPrompt, cleanUnresolvedTokens } from '@/domain/studioPrompt';

describe('Studio Prompt Domain Logic', () => {
  const mockTemplate = `Commercial product advertisement poster featuring {{product_description}}. In bold architectural typography, headline reads "{{headline}}". Floating badge highlights "{{offer}}". Call to action reads "{{cta}}". Editorial backdrop with {{accent_color}} accent details. Brand mark: {{brand_name}}. Negative prompt: blurry, low resolution, artifacts.`;

  const mockCopy = {
    headline: 'ELEVATE YOUR SOUND',
    offer: 'SUMMER DROP · 25% OFF',
    cta: 'SHOP NOW',
    accentColor: '#4B2BFF',
    brandName: 'AURA SOUND',
    productDescription: 'matte black wireless over-ear headphones with silver metallic accents',
  };

  it('renders a Universal prompt substituting all placeholder tokens', () => {
    const rendered = renderStudioPrompt({
      template: mockTemplate,
      copy: mockCopy,
      engine: 'universal',
      aspectRatio: '9:16',
    });

    expect(rendered).toContain('matte black wireless over-ear headphones');
    expect(rendered).toContain('ELEVATE YOUR SOUND');
    expect(rendered).toContain('SUMMER DROP · 25% OFF');
    expect(rendered).toContain('SHOP NOW');
    expect(rendered).toContain('#4B2BFF');
    expect(rendered).toContain('AURA SOUND');
    expect(rendered).not.toContain('{{');
    expect(rendered).not.toContain('}}');
  });

  it('formats Midjourney prompt with appropriate parameters and camera styling', () => {
    const rendered = renderStudioPrompt({
      template: mockTemplate,
      copy: mockCopy,
      engine: 'midjourney',
      aspectRatio: '9:16',
    });

    expect(rendered).toContain('--ar 9:16');
    expect(rendered).toContain('--v 6.1');
    expect(rendered).toContain('--style raw');
  });

  it('formats Flux prompt with natural photographic realism and framing details', () => {
    const rendered = renderStudioPrompt({
      template: mockTemplate,
      copy: mockCopy,
      engine: 'flux',
      aspectRatio: '1:1',
    });

    expect(rendered).toContain('Aspect ratio: 1:1');
    expect(rendered).toContain('Ultra-detailed commercial product photography');
    expect(rendered).toContain('ELEVATE YOUR SOUND');
    expect(rendered).not.toContain('--v 6.1');
  });

  it('formats Ideogram prompt with explicit quoted typography and graphic layout', () => {
    const unquotedTemplate = `Poster layout with {{product_description}}. Headline is {{headline}}. Offer is {{offer}}.`;
    const rendered = renderStudioPrompt({
      template: unquotedTemplate,
      copy: mockCopy,
      engine: 'ideogram',
      aspectRatio: '4:5',
    });

    expect(rendered).toContain('Graphic design poster with prominent bold typography "ELEVATE YOUR SOUND"');
    expect(rendered).toContain('Featuring badge callout "SUMMER DROP · 25% OFF"');
  });

  it('live reactive update: changing a single copy field immediately alters rendered output', () => {
    const prompt1 = renderStudioPrompt({
      template: mockTemplate,
      copy: mockCopy,
      engine: 'universal',
    });
    expect(prompt1).toContain('ELEVATE YOUR SOUND');

    const updatedCopy = { ...mockCopy, headline: 'SILENCE THE NOISE' };
    const prompt2 = renderStudioPrompt({
      template: mockTemplate,
      copy: updatedCopy,
      engine: 'universal',
    });
    expect(prompt2).toContain('SILENCE THE NOISE');
    expect(prompt2).not.toContain('ELEVATE YOUR SOUND');
  });

  it('cleanUnresolvedTokens removes any residual {{slot_key}} and unrendered [[?key:...]] blocks gracefully', () => {
    const dirty = 'Featuring {{product}} and {{unknown_slot_token}} with pristine quality. [[?unprovided: Promo: {{unprovided}}.]]';
    const cleaned = cleanUnresolvedTokens(dirty);
    expect(cleaned).toBe('Featuring and with pristine quality.');
    expect(cleaned).not.toContain('unprovided');
    expect(cleaned).not.toContain('Promo:');
  });

  it('keeps Negative prompt directive at the very end when Flux injects photographic framing tags', () => {
    const templateWithNegative = `Commercial poster of headphones. Negative prompt: blurry, artifacts, low resolution.`;
    const rendered = renderStudioPrompt({
      template: templateWithNegative,
      copy: mockCopy,
      engine: 'flux',
      aspectRatio: '9:16',
    });

    expect(rendered).toContain('Aspect ratio: 9:16. Ultra-detailed commercial product photography');
    // Ensure the framing tag appears BEFORE the negative prompt, not appended inside it
    const tagIndex = rendered.indexOf('Aspect ratio: 9:16');
    const negativeIndex = rendered.toLowerCase().indexOf('negative prompt:');
    expect(tagIndex).toBeGreaterThan(-1);
    expect(negativeIndex).toBeGreaterThan(tagIndex);
  });

  it('evaluates optional blocks [[?key:...]] keeping them when provided and removing them entirely when empty', () => {
    const templateWithOptionals = `Poster for {{product_description}}. [[?offer: Special badge: {{offer}}.]] [[?cta: Action button: {{cta}}.]] [[?missing_tag: Missing info.]] Negative prompt: blurry.`;
    const rendered = renderStudioPrompt({
      template: templateWithOptionals,
      copy: {
        ...mockCopy,
        offer: 'LIMITED DROP',
        cta: '', // empty
      },
      engine: 'universal',
    });

    expect(rendered).toContain('Special badge: LIMITED DROP.');
    expect(rendered).not.toContain('Action button');
    expect(rendered).not.toContain('Missing info');
  });

  it('replaces {{product_name}} placeholder as well as {{product_description}}', () => {
    const templateWithName = `Showcase featuring {{product_name}} with high-end aesthetic.`;
    const rendered = renderStudioPrompt({
      template: templateWithName,
      copy: mockCopy,
      engine: 'universal',
    });

    expect(rendered).toContain('matte black wireless over-ear headphones');
    expect(rendered).not.toContain('{{product_name}}');
  });
});
