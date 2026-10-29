'use client';

import React, { useState } from 'react';
import type { Slot } from '@/domain/slot';

export interface TextToken {
  type: 'text';
  content: string;
}

export interface SlotToken {
  type: 'slot';
  key: string;
  slot?: Slot;
}

export interface OptionalBlockToken {
  type: 'optional_block';
  key: string;
  content: string;
  innerTokens: TemplateToken[];
}

export type TemplateToken = TextToken | SlotToken | OptionalBlockToken;

/**
 * Returns WCAG AA compliant badge styling based on slot category:
 * - Brand slots: Blue token (--brand-layer)
 * - Never-invent / Needs you slots: Amber/orange token (--accent / warning)
 * - Per-poster / Campaign slots: Primary tint token (--primary)
 */
export function getSlotTokenColorClass(slot?: Slot): string {
  if (!slot) {
    return 'bg-layout-layer/10 text-layout-layer border-layout-layer/20';
  }
  if (slot.brand_field) {
    return 'bg-brand-layer/15 text-brand-layer border-brand-layer/30 hover:border-brand-layer/60';
  }
  if (slot.never_invent) {
    return 'bg-accent/20 text-accent border-accent/40 hover:border-accent/70 font-semibold';
  }
  return 'bg-primary/15 text-primary border-primary/30 hover:border-primary/60';
}

/**
 * Parses template syntax:
 * - Mustaches: {{slot_key}}
 * - Optional blocks: [[?slot_key: content]]
 * - Plain layout text
 */
export function parseTemplateTokens(template: string, slots: Slot[]): TemplateToken[] {
  const tokens: TemplateToken[] = [];
  if (!template) return tokens;

  // Regex matching either [[?key: content]] or {{key}}
  const tokenRegex = /(\[\[\?([a-z0-9_]+):([\s\S]*?)\]\])|(\{\{([a-z0-9_]+)\}\})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(template)) !== null) {
    // Leading plain text
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: template.substring(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // Optional block [[?key: content]]
      const key = match[2]!;
      const content = match[3]!;
      tokens.push({
        type: 'optional_block',
        key,
        content,
        innerTokens: parseTemplateTokens(content, slots),
      });
    } else if (match[4]) {
      // Slot placeholder {{key}}
      const key = match[5]!;
      const slot = slots.find((s) => s.key === key);
      tokens.push({
        type: 'slot',
        key,
        slot,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Trailing plain text
  if (lastIndex < template.length) {
    tokens.push({
      type: 'text',
      content: template.substring(lastIndex),
    });
  }

  return tokens;
}

interface SlotPreviewProps {
  template: string;
  slots: Slot[];
  interactive?: boolean;
  onCollapseSlot?: (slotKey: string) => void;
  onSlotClick?: (slotKey: string) => void;
  className?: string;
}

export function SlotPreview({
  template,
  slots,
  interactive = false,
  onCollapseSlot,
  onSlotClick,
  className = '',
}: SlotPreviewProps) {
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const tokens = parseTemplateTokens(template, slots);

  function handleChipClick(slotKey: string) {
    if (onSlotClick) {
      onSlotClick(slotKey);
    }
    if (interactive && onCollapseSlot) {
      setSelectedSlotKey((prev) => (prev === slotKey ? null : slotKey));
    }
  }

  function renderToken(token: TemplateToken, idx: number): React.ReactNode {
    if (token.type === 'text') {
      return (
        <span key={`text-${idx}`} className="text-ink/80 select-text">
          {token.content}
        </span>
      );
    }

    if (token.type === 'slot') {
      const isSelected = selectedSlotKey === token.key;
      const colorClass = getSlotTokenColorClass(token.slot);

      return (
        <span key={`slot-${token.key}-${idx}`} className="inline-block my-0.5 mx-1 relative group">
          <button
            type="button"
            onClick={() => handleChipClick(token.key)}
            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium border shadow-2xs transition-all ${colorClass} ${
              interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'
            }`}
            title={
              token.slot
                ? `${token.slot.label} (${token.slot.brand_field ? 'Brand' : token.slot.never_invent ? 'Needs You' : 'Campaign'})`
                : `Undefined slot: ${token.key}`
            }
          >
            <span>&#123;&#123;</span>
            <span className="font-bold">{token.key}</span>
            <span>&#125;&#125;</span>
          </button>

          {/* Interactive popover action: Collapse to text */}
          {interactive && isSelected && onCollapseSlot && (
            <div className="absolute left-0 bottom-full mb-1.5 z-20 bg-surface border border-border-subtle p-2 rounded-xl shadow-md min-w-[160px] space-y-1">
              <div className="text-[10px] text-layout-layer font-medium">Slot: {token.key}</div>
              <button
                type="button"
                onClick={() => {
                  onCollapseSlot(token.key);
                  setSelectedSlotKey(null);
                }}
                className="w-full text-left px-2 py-1 bg-surface-muted hover:bg-danger/10 hover:text-danger rounded-lg text-xs font-semibold text-ink transition-colors cursor-pointer"
              >
                Collapse to text
              </button>
            </div>
          )}
        </span>
      );
    }

    if (token.type === 'optional_block') {
      return (
        <span
          key={`opt-${token.key}-${idx}`}
          className="inline border border-dashed border-border-strong bg-surface-muted/40 px-1.5 py-0.5 rounded-lg my-0.5 mx-0.5"
          title={`Optional block conditioned on: ${token.key}`}
        >
          <span className="text-[10px] font-mono text-layout-layer mr-1">
            [[?{token.key}:
          </span>
          {token.innerTokens.map((inner, i) => renderToken(inner, i))}
          <span className="text-[10px] font-mono text-layout-layer ml-1">]]</span>
        </span>
      );
    }

    return null;
  }

  return (
    <div
      className={`font-mono text-xs leading-relaxed whitespace-pre-wrap p-4 rounded-xl border border-border-subtle bg-surface-muted ${className}`}
    >
      {tokens.map((token, index) => renderToken(token, index))}
    </div>
  );
}
