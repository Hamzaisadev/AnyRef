import { BrandDraftOutput, FieldSource } from '../ai/schemas';
import { ValidationError } from '../lib/errors';

export function stripControlAndZeroWidth(text: string): string {
  if (typeof text !== 'string') return text;
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');
}

const URL_REGEX = /(?:https?:\/\/|www\.)[^\s]+|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
const PHONE_REGEX = /(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;

function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/[\s\-_().+]/g, '');
}

/**
 * Checks if a string contains any URLs, emails, or phone numbers that do NOT appear
 * in the user-supplied business description.
 */
export function containsFabricatedContactOrUrl(fieldValue: string, userDescription: string): boolean {
  if (!fieldValue || typeof fieldValue !== 'string') return false;

  const normalizedUserDesc = normalizeForComparison(userDescription);

  // 1. Check URLs
  const urlMatches = fieldValue.match(URL_REGEX);
  if (urlMatches) {
    for (const match of urlMatches) {
      const cleanMatch = normalizeForComparison(match);
      if (cleanMatch.length >= 4 && !normalizedUserDesc.includes(cleanMatch)) {
        return true;
      }
    }
  }

  // 2. Check Emails
  const emailMatches = fieldValue.match(EMAIL_REGEX);
  if (emailMatches) {
    for (const match of emailMatches) {
      const cleanMatch = normalizeForComparison(match);
      if (!normalizedUserDesc.includes(cleanMatch)) {
        return true;
      }
    }
  }

  // 3. Check Phone Numbers
  const phoneMatches = fieldValue.match(PHONE_REGEX);
  if (phoneMatches) {
    for (const match of phoneMatches) {
      // Ignore very short numbers like '2026' or '100%'
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length >= 7) {
        const cleanMatch = normalizeForComparison(match);
        if (!normalizedUserDesc.includes(cleanMatch)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Validates and sanitizes a raw AI-generated BrandDraftOutput against strict honesty rules
 * and the user's supplied description.
 */
export function validateBrandDraft(
  draft: BrandDraftOutput,
  userDescription: string
): BrandDraftOutput {
  const cleanDescription = stripControlAndZeroWidth(userDescription.trim());
  const normalizedDesc = cleanDescription.toLowerCase();

  const sanitized: BrandDraftOutput = {
    name: { ...draft.name },
    what_you_sell: { ...draft.what_you_sell },
    why: { ...draft.why },
    tone: { ...draft.tone },
    colors: { ...draft.colors },
    wordmark: { ...draft.wordmark },
    slogan: { ...draft.slogan },
    footer_text: { ...draft.footer_text },
    never_do_rules: { ...draft.never_do_rules },
    default_values: { ...draft.default_values },
    missing: Array.isArray(draft.missing) ? [...draft.missing] : [],
  };

  // Helper to sanitize a text field
  const sanitizeTextField = (
    field: { value: string; source: FieldSource; note?: string },
    maxLength: number,
    fieldName: string
  ) => {
    let val = stripControlAndZeroWidth(field.value || '').trim();

    // 1. If source is empty, force empty value
    if (field.source === 'empty' || !val) {
      field.value = '';
      field.source = 'empty';
      return;
    }

    // 2. If contains fabricated URL, email, or phone number not in user description, blank it
    if (containsFabricatedContactOrUrl(val, cleanDescription)) {
      field.value = '';
      field.source = 'empty';
      field.note = undefined;
      return;
    }

    // 3. Truncate if exceeds max length
    if (val.length > maxLength) {
      val = val.slice(0, maxLength).trim();
    }

    field.value = val;
  };

  sanitizeTextField(sanitized.name, 80, 'name');
  sanitizeTextField(sanitized.what_you_sell, 600, 'what_you_sell');
  sanitizeTextField(sanitized.why, 600, 'why');
  sanitizeTextField(sanitized.tone, 300, 'tone');
  sanitizeTextField(sanitized.wordmark, 60, 'wordmark');
  sanitizeTextField(sanitized.slogan, 120, 'slogan');
  sanitizeTextField(sanitized.never_do_rules, 600, 'never_do_rules');

  // Specific rule for footer_text:
  // "footer_text is filled only with text the user typed (for example "Fast delivery"); otherwise empty."
  let cleanFooter = stripControlAndZeroWidth(sanitized.footer_text.value || '').trim();
  if (sanitized.footer_text.source === 'empty' || !cleanFooter) {
    sanitized.footer_text.value = '';
    sanitized.footer_text.source = 'empty';
  } else {
    // Must appear in description
    if (!normalizedDesc.includes(cleanFooter.toLowerCase())) {
      sanitized.footer_text.value = '';
      sanitized.footer_text.source = 'empty';
      sanitized.footer_text.note = undefined;
    } else {
      if (cleanFooter.length > 160) {
        cleanFooter = cleanFooter.slice(0, 160).trim();
      }
      sanitized.footer_text.value = cleanFooter;
      sanitized.footer_text.source = 'you_said';
    }
  }

  // Name & wordmark rule:
  // "name and wordmark come from the user's text; if no name is given, leave empty and flag Needs you."
  if (!sanitized.name.value) {
    sanitized.name.value = '';
    sanitized.name.source = 'empty';
    if (!sanitized.missing.includes('name')) {
      sanitized.missing.push('name');
    }
  }

  // Colors validation:
  if (sanitized.colors.source === 'empty' || !Array.isArray(sanitized.colors.value)) {
    sanitized.colors.value = [];
    sanitized.colors.source = 'empty';
  } else {
    // Keep only valid 6-character hex colors (up to 6)
    const validColors = sanitized.colors.value
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter((c) => /^#[0-9A-Fa-f]{6}$/.test(c))
      .slice(0, 6);

    if (validColors.length === 0) {
      sanitized.colors.value = [];
      sanitized.colors.source = 'empty';
      sanitized.colors.note = 'Add colors for better prompts.';
    } else {
      sanitized.colors.value = validColors;
    }
  }

  // Default values sanitization:
  if (sanitized.default_values.source === 'empty' || !sanitized.default_values.value) {
    sanitized.default_values.value = {};
    sanitized.default_values.source = 'empty';
  } else {
    const cleanDefaults: Record<string, string> = {};
    for (const [k, v] of Object.entries(sanitized.default_values.value)) {
      const cleanK = stripControlAndZeroWidth(k).trim().slice(0, 40);
      const cleanV = stripControlAndZeroWidth(String(v)).trim().slice(0, 120);
      if (cleanK && cleanV && !containsFabricatedContactOrUrl(cleanV, cleanDescription)) {
        cleanDefaults[cleanK] = cleanV;
      }
    }
    sanitized.default_values.value = cleanDefaults;
  }

  // If the draft contradicts nothing but is entirely empty, return friendly error:
  const hasContent =
    Boolean(sanitized.name.value) ||
    Boolean(sanitized.what_you_sell.value) ||
    Boolean(sanitized.why.value) ||
    Boolean(sanitized.tone.value) ||
    sanitized.colors.value.length > 0 ||
    Boolean(sanitized.wordmark.value) ||
    Boolean(sanitized.slogan.value) ||
    Boolean(sanitized.footer_text.value) ||
    Boolean(sanitized.never_do_rules.value) ||
    Object.keys(sanitized.default_values.value).length > 0;

  if (!hasContent) {
    throw new ValidationError(
      "We couldn't find enough detail, please add more.",
      { draft: sanitized }
    );
  }

  return sanitized;
}
