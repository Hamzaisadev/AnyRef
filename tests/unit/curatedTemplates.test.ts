import { describe, it, expect } from 'vitest';
import { CURATED_TEMPLATES, getCuratedTemplate } from '@/domain/curatedTemplates';
import { renderPrompt } from '@/domain/renderPrompt';
import { validatePromptTemplate } from '@/domain/validateTemplate';

describe('Curated Inspiration Vault (src/domain/curatedTemplates.ts)', () => {
  it('contains at least 6 high-craft commercial templates', () => {
    expect(CURATED_TEMPLATES.length).toBeGreaterThanOrEqual(6);
  });

  it('ensures each curated template passes validatePromptTemplate', () => {
    for (const t of CURATED_TEMPLATES) {
      const validation = validatePromptTemplate(t.prompt_template, t.slots);
      expect(
        validation.valid,
        `Template "${t.title}" failed validation: ${validation.errors.join(', ')}`
      ).toBe(true);
    }
  });

  it('renders cleanly with sample brand values without mustache leakage', () => {
    const sampleValues: Record<string, string> = {
      brand_name: 'REWIRED',
      primary_color: '#4B2BFF',
      secondary_color: '#00E5FF',
      accent_color: '#2C3E35',
      brand_color: '#111318',
      headline: 'TEST HEADLINE',
      subheadline: 'TEST SUBHEADLINE',
      product_name: 'Studio Master Series',
      price_tag: '$249',
      footer_note: 'Free shipping worldwide',
      tagline: 'Engineered for Pure Focus',
      slogan: 'Pure sound forever',
    };

    for (const t of CURATED_TEMPLATES) {
      const result = renderPrompt(t.prompt_template, t.slots, sampleValues);
      expect(result.text).not.toContain('{{');
      expect(result.text).not.toContain('}}');
      expect(result.text.length).toBeGreaterThan(50);
    }
  });

  it('finds template by id', () => {
    const found = getCuratedTemplate('vault-cyber-tech');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Cyberpunk Studio Tech Launch');

    const notFound = getCuratedTemplate('non-existent');
    expect(notFound).toBeUndefined();
  });
});
