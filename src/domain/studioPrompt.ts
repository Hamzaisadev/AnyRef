import type { StudioMarketingCopy } from '../ai/schemas';

export type TargetEngine = 'midjourney' | 'flux' | 'ideogram' | 'universal';

export interface RenderStudioPromptOptions {
  template: string;
  copy: StudioMarketingCopy;
  engine?: TargetEngine;
  aspectRatio?: string;
}

/**
 * Strips any leftover unrendered placeholders {{key}} or conditional blocks [[?key:...]]
 */
export function cleanUnresolvedTokens(text: string): string {
  // 1. Remove unresolved conditional blocks [[?key: content]] entirely
  let cleaned = text.replace(/\[\[\?[a-z0-9_]+:\s*([\s\S]*?)\]\]/gi, '');
  // 2. Remove remaining mustache placeholders {{key}}
  cleaned = cleaned.replace(/\{\{[a-z0-9_]+\}\}/gi, '');
  // 3. Normalize multiple spaces
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

/**
 * Helper to insert extra prompt specifications (framing, tags, callouts)
 * into the positive prompt body before any trailing negative prompt directive.
 */
export function insertBeforeNegativePrompt(text: string, insertion: string): string {
  const trimmed = text.trim();
  const negMatch = trimmed.match(/\b(negative\s*(?:prompt)?\s*:[\s\S]*)$/i);
  if (negMatch && negMatch.index !== undefined && negMatch.index > 0) {
    const positivePart = trimmed.slice(0, negMatch.index).trim();
    const negativePart = trimmed.slice(negMatch.index).trim();
    return `${positivePart} ${insertion} ${negativePart}`.replace(/[ \t]{2,}/g, ' ').trim();
  }
  return `${trimmed}\n\n${insertion}`.trim();
}

/**
 * Compiles a parametric prompt template with marketing copy into an engine-optimized, ready-to-copy image prompt.
 */
export function renderStudioPrompt({
  template,
  copy,
  engine = 'universal',
  aspectRatio = '9:16',
}: RenderStudioPromptOptions): string {
  if (!template) return '';

  let compiled = template;

  const headline = (copy.headline || '').trim();
  const offer = (copy.offer || '').trim();
  const cta = (copy.cta || '').trim();
  const accentColor = (copy.accentColor || '#4B2BFF').trim();
  const brandName = (copy.brandName || '').trim();
  const productDescription = (copy.productDescription || '').trim();

  // 1. Process optional conditional blocks [[?key: body]]
  const copyMap: Record<string, string> = {
    headline,
    main_headline: headline,
    title: headline,
    offer,
    badge: offer,
    discount_text: offer,
    discount_badge: offer,
    cta,
    call_to_action: cta,
    button: cta,
    accent_color: accentColor,
    color: accentColor,
    brand_name: brandName,
    brand_wordmark: brandName,
    wordmark: brandName,
    product_description: productDescription,
    product_name: productDescription,
    product_title: productDescription,
    product: productDescription,
  };

  compiled = compiled.replace(
    /\[\[\?([a-z0-9_]+):([\s\S]*?)\]\]/gi,
    (_match, key: string, body: string) => {
      const val = copyMap[key.toLowerCase()];
      if (!val || val.trim() === '') {
        return '';
      }
      return body;
    }
  );

  // 2. Replace variable placeholders (case-insensitive variants)
  const replacements: [RegExp, string][] = [
    [/\{\{\s*headline\s*\}\}/gi, headline],
    [/\{\{\s*main_headline\s*\}\}/gi, headline],
    [/\{\{\s*title\s*\}\}/gi, headline],
    [/\{\{\s*offer\s*\}\}/gi, offer],
    [/\{\{\s*badge\s*\}\}/gi, offer],
    [/\{\{\s*discount_text\s*\}\}/gi, offer],
    [/\{\{\s*discount_badge\s*\}\}/gi, offer],
    [/\{\{\s*cta\s*\}\}/gi, cta],
    [/\{\{\s*call_to_action\s*\}\}/gi, cta],
    [/\{\{\s*button\s*\}\}/gi, cta],
    [/\{\{\s*accent_color\s*\}\}/gi, accentColor],
    [/\{\{\s*color\s*\}\}/gi, accentColor],
    [/\{\{\s*brand_name\s*\}\}/gi, brandName || 'BRAND'],
    [/\{\{\s*brand_wordmark\s*\}\}/gi, brandName || 'BRAND'],
    [/\{\{\s*wordmark\s*\}\}/gi, brandName || 'BRAND'],
    [/\{\{\s*product_description\s*\}\}/gi, productDescription],
    [/\{\{\s*product_name\s*\}\}/gi, productDescription],
    [/\{\{\s*product_title\s*\}\}/gi, productDescription],
    [/\{\{\s*product\s*\}\}/gi, productDescription],
  ];

  for (const [regex, val] of replacements) {
    compiled = compiled.replace(regex, val);
  }

  compiled = cleanUnresolvedTokens(compiled);

  // Engine-specific formatting & parameter flags
  switch (engine) {
    case 'midjourney': {
      // Remove any existing --ar or --v or --style flags from prompt body to prevent duplication
      let mjPrompt = compiled
        .replace(/--ar\s+[0-9]+:[0-9]+/gi, '')
        .replace(/--v\s+[0-9.]+/gi, '')
        .replace(/--style\s+[a-z0-9_-]+/gi, '')
        .trim();

      return `${mjPrompt} --ar ${aspectRatio} --v 6.1 --style raw`.trim();
    }

    case 'flux': {
      // Flux performs best with direct descriptive language and clear spatial framing
      const framingTag = `Aspect ratio: ${aspectRatio}. Ultra-detailed commercial product photography, 8k resolution, photorealistic sharp focus.`;
      if (!compiled.toLowerCase().includes('aspect ratio')) {
        return insertBeforeNegativePrompt(compiled, framingTag);
      }
      return compiled;
    }

    case 'ideogram': {
      // Ideogram excels when typographic text is explicitly enclosed in quotation marks
      let ideoPrompt = compiled;
      if (headline && !ideoPrompt.includes(`"${headline}"`)) {
        ideoPrompt = `Graphic design poster with prominent bold typography "${headline}". ${ideoPrompt}`;
      }
      if (offer && !ideoPrompt.includes(`"${offer}"`)) {
        ideoPrompt = insertBeforeNegativePrompt(ideoPrompt, `Featuring badge callout "${offer}".`);
      }
      return ideoPrompt;
    }

    case 'universal':
    default:
      return compiled;
  }
}
