import { Brand } from './brand';

export interface InjectionValidationResult {
  valid: boolean;
  errors: string[];
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
  if (brand?.never_do_rules && brand.never_do_rules.trim() !== '') {
    // Split negative rules by semicolons, periods, or newlines
    const rawRules = brand.never_do_rules
      .split(/[;.\n]+/)
      .map((r) => r.trim())
      .filter((r) => r.length > 3);

    for (const rule of rawRules) {
      // Extract banned key terms (removing common prefixes like "never use", "no", "avoid", "don't use")
      const cleanedTerm = rule
        .toLowerCase()
        .replace(/^(never(\s+use)?|no|do\s+not\s+use|don't\s+use|avoid)\s+/i, '')
        .trim();

      const singularTerm = cleanedTerm.endsWith('s') ? cleanedTerm.slice(0, -1) : cleanedTerm;

      if (
        (cleanedTerm.length >= 3 && lowerContent.includes(cleanedTerm)) ||
        (singularTerm.length >= 3 && lowerContent.includes(singularTerm))
      ) {
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
