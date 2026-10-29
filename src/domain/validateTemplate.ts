import { Slot } from './slot';

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a prompt template against its slot definitions:
 * 1. Checks that all slot keys are unique.
 * 2. Ensures optional block markers [[?key: ... ]] are balanced and well-formed.
 * 3. Ensures every optional block references a valid slot key configured with optional_block = true.
 * 4. Ensures every {{key}} placeholder matches a defined slot.
 * 5. Ensures every defined slot is referenced in the template.
 */
export function validatePromptTemplate(
  template: string,
  slots: Slot[]
): TemplateValidationResult {
  const errors: string[] = [];

  if (!template || typeof template !== 'string' || template.trim() === '') {
    return { valid: false, errors: ['Prompt template cannot be empty.'] };
  }

  // 1. Check uniqueness of slot keys
  const seenKeys = new Set<string>();
  const duplicateKeys = new Set<string>();
  for (const slot of slots) {
    if (seenKeys.has(slot.key)) {
      duplicateKeys.add(slot.key);
    }
    seenKeys.add(slot.key);
  }
  if (duplicateKeys.size > 0) {
    errors.push(`Duplicate slot keys detected: ${Array.from(duplicateKeys).join(', ')}`);
  }

  const slotMap = new Map<string, Slot>(slots.map((s) => [s.key, s]));

  // 2. Validate optional blocks markers: count balance
  const openMatches = template.match(/\[\[\?/g) || [];
  const closeMatches = template.match(/\]\]/g) || [];
  if (openMatches.length !== closeMatches.length) {
    errors.push(
      `Unbalanced optional block markers: found ${openMatches.length} opening "[[?" and ${closeMatches.length} closing "]]".`
    );
  }

  // 3. Inspect individual optional blocks
  const optionalBlockRegex = /\[\[\?([a-z0-9_]+):([\s\S]*?)\]\]/g;
  let match: RegExpExecArray | null;
  const optionalBlockKeys = new Set<string>();

  while ((match = optionalBlockRegex.exec(template)) !== null) {
    const blockKey = match[1];
    if (!blockKey) continue;

    optionalBlockKeys.add(blockKey);

    const targetSlot = slotMap.get(blockKey);
    if (!targetSlot) {
      errors.push(
        `Optional block references undefined slot "${blockKey}": "[[?${blockKey}: ...]]"`
      );
    } else if (!targetSlot.optional_block) {
      errors.push(
        `Optional block references slot "${blockKey}", but slot does not have optional_block=true.`
      );
    }
  }

  // Check for malformed opening markers like [[? without a key or colon
  const malformedOpen = template.match(/\[\[\?(?![a-z0-9_]+:)/g);
  if (malformedOpen) {
    errors.push(
      'Malformed optional block opening marker. Syntax must be "[[?key: ... ]]".'
    );
  }

  // 4. Validate placeholders {{key}}
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const referencedKeys = new Set<string>();

  while ((match = placeholderRegex.exec(template)) !== null) {
    const rawKey = match[1]?.trim();
    if (!rawKey) continue;

    referencedKeys.add(rawKey);

    if (!slotMap.has(rawKey)) {
      errors.push(`Placeholder "{{${rawKey}}}" has no corresponding slot in definition.`);
    }
  }

  // Check for malformed single or unclosed braces: {key} or {{unclosed
  const unclosedPlaceholders = template.match(/\{\{[^}]*$/);
  if (unclosedPlaceholders) {
    errors.push('Unclosed placeholder found in prompt template.');
  }

  // 5. Ensure every defined slot is referenced in the template
  const unreferencedSlots: string[] = [];
  for (const slot of slots) {
    if (!referencedKeys.has(slot.key) && !optionalBlockKeys.has(slot.key)) {
      unreferencedSlots.push(slot.key);
    }
  }
  if (unreferencedSlots.length > 0) {
    errors.push(
      `Defined slots not referenced in prompt template: ${unreferencedSlots.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
