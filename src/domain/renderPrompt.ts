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

  // 3. Replace {{key}} placeholders
  // User values are quoted in the rendered output
  rendered = rendered.replace(/\{\{([a-z0-9_]+)\}\}/g, (_match, key: string) => {
    const val = values[key];
    if (val !== undefined && val !== null && val.trim() !== '') {
      return `"${val.trim()}"`;
    }
    return '';
  });

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
