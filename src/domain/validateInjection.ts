import { Brand } from './brand';

export interface InjectionValidationResult {
  valid: boolean;
  errors: string[];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if a search term matches as a whole word in text using Unicode-aware boundaries.
 */
export function matchesWholeWord(text: string, term: string): boolean {
  if (!term || term.trim() === '') return false;
  const escaped = escapeRegex(term.trim());
  // Unicode-aware boundary: not preceded or followed by Unicode letters or numbers
  const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu');
  return regex.test(text);
}

/**
 * Validates prompt templates and user inputs against script injection,
 * malicious URLs/emails, and brand "never_do_rules".
 */
export function validateInjectionAndBrandRules(
  content: string,
  brand?: Brand | null
): InjectionValidationResult {
  const errors: string[] = [];

  if (!content || typeof content !== 'string') {
    return { valid: true, errors: [] };
  }

  const lowerContent = content.toLowerCase();

  // 1. Dangerous script / protocol injections
  const dangerousPatterns = [
    { pattern: /<script\b[^>]*>/i, name: 'Script tag (<script>)' },
    { pattern: /<\/script>/i, name: 'Closing script tag (</script>)' },
    { pattern: /<iframe\b[^>]*>/i, name: 'Iframe tag (<iframe>)' },
    { pattern: /javascript:/i, name: 'JavaScript URI protocol (javascript:)' },
    { pattern: /data:text\/html/i, name: 'Data HTML URI (data:text/html)' },
    { pattern: /\bonerror\s*=/i, name: 'Inline event handler (onerror=)' },
    { pattern: /\bonload\s*=/i, name: 'Inline event handler (onload=)' },
  ];

  for (const { pattern, name } of dangerousPatterns) {
    if (pattern.test(content)) {
      errors.push(`Potentially dangerous content detected: ${name}`);
    }
  }

  // 2. Disallow external URLs and emails inside prompt templates
  // Poster prompts should describe visual aesthetics, not external links or email addresses.
  if (/https?:\/\/[^\s]+/i.test(content)) {
    errors.push('Prompt template must not contain external URLs (http/https).');
  }

  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content)) {
    errors.push('Prompt template must not contain email addresses.');
  }

  // 3. Brand "never_do_rules" verification
  if (brand?.never_do_rules) {
    const rawRules: string[] = Array.isArray(brand.never_do_rules)
      ? (brand.never_do_rules as string[]).map((r) => String(r).trim()).filter((r) => r.length > 3)
      : typeof brand.never_do_rules === 'string' && brand.never_do_rules.trim() !== ''
      ? brand.never_do_rules
          .split(/[;.\n]+/)
          .map((r) => r.trim())
          .filter((r) => r.length > 3)
      : [];

    for (const rule of rawRules) {
      // Extract banned key terms (removing common prefixes like "never use", "no", "avoid", "don't use")
      const cleanedTerm = rule
        .toLowerCase()
        .replace(/^(never(\s+use)?|no|do\s+not\s+use|don't\s+use|avoid)\s+/i, '')
        .trim();

      const singularTerm = cleanedTerm.endsWith('s') ? cleanedTerm.slice(0, -1) : cleanedTerm;

      const matchesCleaned = cleanedTerm.length >= 3 && matchesWholeWord(content, cleanedTerm);
      const matchesSingular = singularTerm.length >= 3 && matchesWholeWord(content, singularTerm);

      if (matchesCleaned || matchesSingular) {
        errors.push(
          `Prompt violates brand negative rule: "${rule}" (matched forbidden term "${cleanedTerm}")`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
