import { Slot } from './slot';

export interface AttachItem {
  order: number;
  label: string;
}

export interface RenderResult {
  text: string;
  missingRequired: string[];
  warnings: string[];
  attachChecklist: AttachItem[];
}

export function renderPrompt(
  template: string,
  slots: Slot[],
  values: Record<string, string | undefined>
): RenderResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // 1. Identify missing required slots
  for (const slot of slots) {
    if (slot.required && slot.type !== 'attachment') {
      const val = values[slot.key];
      if (val === undefined || val === null || val.trim() === '') {
        missingRequired.push(slot.key);
      }
    }
  }

  // 2. Process optional blocks [[?key: body ]]
  // If key is empty/whitespace, remove the whole block.
  // Otherwise, render the inner body.
  let rendered = template.replace(
    /\[\[\?([a-z0-9_]+):([\s\S]*?)\]\]/g,
    (_match, key: string, body: string) => {
      const val = values[key];
      if (!val || val.trim() === '') {
        return '';
      }
      return body;
    }
  );

  const slotByKey = new Map<string, Slot>(slots.map((s) => [s.key, s]));

  // Helper to determine if a placeholder position is already enclosed in quotes
  function isAlreadyInQuotes(fullText: string, matchIndex: number, matchLength: number): boolean {
    const charBefore = matchIndex > 0 ? fullText[matchIndex - 1] : '';
    const charAfter = matchIndex + matchLength < fullText.length ? fullText[matchIndex + matchLength] : '';
    if ((charBefore === '"' && charAfter === '"') || (charBefore === '\'' && charAfter === '\'')) {
      return true;
    }

    const lineStart = fullText.lastIndexOf('\n', matchIndex) + 1;
    const lineEnd = fullText.indexOf('\n', matchIndex + matchLength);
    const effectiveLineEnd = lineEnd === -1 ? fullText.length : lineEnd;
    const beforeText = fullText.slice(lineStart, matchIndex);
    const afterText = fullText.slice(matchIndex + matchLength, effectiveLineEnd);

    const dblBefore = (beforeText.match(/"/g) || []).length;
    const dblAfter = (afterText.match(/"/g) || []).length;
    if (dblBefore % 2 === 1 && dblAfter % 2 === 1) {
      return true;
    }

    const sglBefore = (beforeText.match(/'/g) || []).length;
    const sglAfter = (afterText.match(/'/g) || []).length;
    if (sglBefore % 2 === 1 && sglAfter % 2 === 1) {
      return true;
    }

    return false;
  }

  // 3. Replace {{key}} placeholders
  // Quote only short_text slots whose template position is not already inside quotes
  rendered = rendered.replace(
    /\{\{([a-z0-9_]+)\}\}/g,
    (match: string, key: string, offset: number, fullString: string) => {
      const val = values[key];
      if (val === undefined || val === null || val.trim() === '') {
        return '';
      }
      const trimmed = val.trim();
      const slot = slotByKey.get(key);
      const isShortText = slot ? slot.type === 'short_text' : true;

      if (isShortText && !isAlreadyInQuotes(fullString, offset, match.length)) {
        return `"${trimmed}"`;
      }
      return trimmed;
    }
  );

  // 4. Normalize whitespaces and line endings
  rendered = rendered
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  // 5. Generate ordered Attach in Flow checklist
  const attachChecklist: AttachItem[] = slots
    .filter((slot) => slot.type === 'attachment')
    .sort((a, b) => (a.attachment_order ?? 999) - (b.attachment_order ?? 999))
    .map((slot, index) => ({
      order: slot.attachment_order ?? index + 1,
      label: slot.label,
    }));

  return {
    text: rendered,
    missingRequired,
    warnings,
    attachChecklist,
  };
}
