import { Slot } from '../domain/slot';

/**
 * Strips ASCII control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)
 * while preserving legitimate whitespace (\t = 0x09, \n = 0x0A, \r = 0x0D).
 * Also strips invisible unicode characters (zero-width space, joiners, direction overrides, BOM).
 */
export function sanitizeText(input: unknown, maxLength?: number): string {
  if (typeof input !== 'string') {
    return '';
  }

  // 1. Normalize Unicode (NFKC)
  let clean = input.normalize('NFKC');

  // 2. Strip dangerous ASCII control characters (preserving \t, \n, \r)
  // eslint-disable-next-line no-control-regex
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 3. Strip invisible / zero-width / bidi override Unicode codepoints
  clean = clean.replace(
    /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069]/g,
    ''
  );

  // 4. Trim leading/trailing whitespace
  clean = clean.trim();

  // 5. Enforce optional maximum length limit
  if (typeof maxLength === 'number' && maxLength > 0 && clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }

  return clean;
}

/**
 * Sanitizes all string values against slot definitions and caps each to its slot max_length.
 */
export function sanitizeSlotValues(
  values: Record<string, unknown>,
  slots: Slot[]
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const slotMap = new Map<string, Slot>(slots.map((s) => [s.key, s]));

  for (const [key, val] of Object.entries(values)) {
    const slot = slotMap.get(key);
    const maxLen = slot?.max_length ?? 500;
    sanitized[key] = sanitizeText(val, maxLen);
  }

  return sanitized;
}
