import type { Slot } from './slot';

/**
 * Pre-render factual-honesty gate.
 *
 * Anyref's core promise is that AI never invents a price, a discount, or a date.
 * Rendering an image in-app does not relax that promise — it makes it stricter,
 * because a rendered poster is a publishable artifact. A hallucinated "30% OFF"
 * baked into a JPEG is a commercial and legal hazard for the business that posts it.
 *
 * This guard runs BEFORE any paid image call, so a blocked render costs $0.
 */

export type RenderBlockReason =
  | 'unresolved_never_invent'
  | 'missing_required'
  | 'residual_placeholder';

export interface RenderBlocker {
  reason: RenderBlockReason;
  slotKeys: string[];
  message: string;
}

export interface RenderGuardResult {
  /** True only when the prompt is safe to send to a paid image model. */
  canRender: boolean;
  blockers: RenderBlocker[];
  /** Slots the user must fill in personally. Drives the "Needs you" UI. */
  needsYou: string[];
}

/** Matches any {{key}} left unsubstituted in a supposedly final prompt. */
const RESIDUAL_PLACEHOLDER = /\{\{\s*([a-z][a-z0-9_]{1,40})\s*\}\}/g;

/**
 * Values that look filled but carry no factual content. We treat these as unresolved
 * for never-invent slots specifically, because a placeholder price is worse than a
 * blank one — it reads as real.
 */
const PLACEHOLDER_VALUE_PATTERNS: RegExp[] = [
  /^n\/?a$/i,
  /^tbd$/i,
  /^tba$/i,
  /^xx+$/i,
  /^\?+$/i,
  /^-+$/i,
  /^0+$/,
  /^\$?\s*xx/i,
  /^<.*>$/,
  /^\[.*\]$/,
  /^your\s+/i,
  /^insert\s+/i,
  /^e\.?g\.?\b/i,
  /^placeholder$/i,
];

function isBlankish(value: string | undefined | null): boolean {
  if (value === undefined || value === null) return true;
  return value.trim() === '';
}

function isPlaceholderish(value: string): boolean {
  const trimmed = value.trim();
  return PLACEHOLDER_VALUE_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * Decides whether a slot-filled prompt may be rendered as an image.
 *
 * @param renderedPrompt The post-substitution prompt text.
 * @param slots The slot definitions for the entry.
 * @param values The user/brand/AI-supplied values keyed by slot key.
 */
export function evaluateRenderGuard(
  renderedPrompt: string,
  slots: Slot[],
  values: Record<string, string | undefined>
): RenderGuardResult {
  const blockers: RenderBlocker[] = [];
  const needsYou = new Set<string>();

  // 1. Never-invent slots must carry an explicit, non-placeholder human value.
  //    AI-sourced values are rejected here by design: see assertNeverInventSources.
  const unresolvedNeverInvent: string[] = [];
  for (const slot of slots) {
    if (!slot.never_invent) continue;
    // An optional never-invent slot that is simply absent is fine — the block
    // collapses and nothing factual is asserted.
    const value = values[slot.key];
    if (value === undefined || value === null || value.trim() === '') {
      if (slot.required) {
        unresolvedNeverInvent.push(slot.key);
        needsYou.add(slot.key);
      }
      continue;
    }
    if (isPlaceholderish(value)) {
      unresolvedNeverInvent.push(slot.key);
      needsYou.add(slot.key);
    }
  }

  if (unresolvedNeverInvent.length > 0) {
    blockers.push({
      reason: 'unresolved_never_invent',
      slotKeys: unresolvedNeverInvent,
      message:
        `Rendering is blocked because these values must come from you, not AI: ` +
        `${unresolvedNeverInvent.join(', ')}. Prices, discounts, and dates are never invented.`,
    });
  }

  // 2. Ordinary required slots.
  const missingRequired: string[] = [];
  for (const slot of slots) {
    if (!slot.required || slot.type === 'attachment') continue;
    if (slot.never_invent) continue; // already handled with a stricter rule
    if (isBlankish(values[slot.key])) {
      missingRequired.push(slot.key);
      needsYou.add(slot.key);
    }
  }

  if (missingRequired.length > 0) {
    blockers.push({
      reason: 'missing_required',
      slotKeys: missingRequired,
      message: `Fill in ${missingRequired.join(', ')} before rendering.`,
    });
  }

  // 3. Defense in depth: no {{token}} may survive into a paid call. If one does,
  //    the renderer would literally draw "{{price}}" onto the poster.
  const residual = new Set<string>();
  for (const match of renderedPrompt.matchAll(RESIDUAL_PLACEHOLDER)) {
    const key = match[1];
    if (key) residual.add(key);
  }
  if (residual.size > 0) {
    const keys = Array.from(residual);
    blockers.push({
      reason: 'residual_placeholder',
      slotKeys: keys,
      message:
        `The prompt still contains unsubstituted placeholders (${keys.join(', ')}). ` +
        `Rendering was stopped so they are not drawn onto the image.`,
    });
    keys.forEach((k) => needsYou.add(k));
  }

  return {
    canRender: blockers.length === 0,
    blockers,
    needsYou: Array.from(needsYou),
  };
}

/**
 * Asserts that no never-invent slot is carrying an AI-sourced value.
 *
 * The autofill path tags each value with a source. AI may *suggest* a headline;
 * it may never supply a price. This is checked separately from
 * {@link evaluateRenderGuard} because it needs source metadata, which the plain
 * values map does not carry.
 */
export function findAiSuppliedNeverInvent(
  slots: Slot[],
  sources: Record<string, 'user' | 'ai' | 'brand_default' | undefined>
): string[] {
  return slots
    .filter((s) => s.never_invent && sources[s.key] === 'ai')
    .map((s) => s.key);
}

/**
 * Hard instruction appended to every render call. Belt-and-braces: even with a
 * clean prompt, we tell the image model not to fabricate commercial facts or add
 * text we did not ask for.
 */
export const RENDER_HONESTY_DIRECTIVE = [
  'STRICT CONTENT RULES:',
  '- Render ONLY the text explicitly provided in this prompt. Do not add, invent, complete, or translate any words.',
  '- Do NOT add any price, currency amount, percentage, discount badge, date, deadline, or phone number that is not written verbatim above.',
  '- Do NOT add fine print, legal disclaimers, QR codes, barcodes, or website URLs unless given verbatim above.',
  '- Do NOT add watermarks, signatures, or generator branding.',
  '- Spell all provided text exactly as written, including capitalisation.',
].join('\n');
