'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Chip } from './Chip';
import { SlotType } from '@/lib/landing/tokens';

export interface PromptBlockProps {
  text: string;
  slotMap?: Record<string, { value: string; type: SlotType }>;
  allowCopy?: boolean;
  className?: string;
  theme?: 'ink' | 'paper';
}

export function PromptBlock({
  text,
  slotMap = {},
  allowCopy = true,
  className = '',
  theme = 'ink',
}: PromptBlockProps) {
  const [copied, setCopied] = useState(false);

  // Render text replacing {{slot}} tokens with interactive or highlighted styled spans
  function renderPromptContent(raw: string) {
    const parts = raw.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, idx) => {
      const match = part.match(/^\{\{([^}]+)\}\}$/);
      const slotKey = match?.[1];
      if (typeof slotKey === 'string') {
        const slotData = slotMap[slotKey];
        const type: SlotType =
          slotData?.type ||
          (slotKey.includes('brand') || slotKey.includes('wordmark')
            ? 'brand'
            : slotKey.includes('price') || slotKey.includes('offer')
            ? 'campaign'
            : 'layout');
        const displayVal = slotData?.value ? slotData.value : `{{${slotKey}}}`;

        return (
          <span key={idx} className="inline-block mx-0.5 align-middle">
            <Chip type={type} tag={slotKey}>
              {displayVal}
            </Chip>
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  }

  function handleCopy() {
    // Generate clean text by resolving slots if map exists
    let cleanText = text;
    Object.entries(slotMap).forEach(([k, v]) => {
      cleanText = cleanText.replaceAll(`{{${k}}}`, v.value || `{{${k}}}`);
    });

    navigator.clipboard?.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isPaper = theme === 'paper';

  return (
    <div
      className={`relative w-full rounded-2xl p-4 sm:p-5 font-mono text-xs sm:text-sm leading-relaxed border transition-colors select-text ${
        isPaper
          ? 'bg-[#EAE8E0] text-[#0F1020] border-[#0F1020]/10 shadow-sm'
          : 'bg-[#0B0C18] text-[#F7F6F2] border-white/10 shadow-xl'
      } ${className}`}
    >
      {/* Top Header Strip */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[10px] uppercase font-mono tracking-widest text-[#9AA0AE]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#1E9E6A]" />
          <span>PROMPT COMPILER // READY TO COPY</span>
        </div>
        {allowCopy && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy prompt to clipboard"
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/10 hover:bg-white/15 transition-all text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#1E9E6A]" />
                <span className="text-[#1E9E6A]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#9AA0AE]" />
                <span>Copy prompt</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Prompt Body */}
      <div className="break-words font-mono whitespace-pre-wrap leading-relaxed">
        {renderPromptContent(text)}
      </div>
    </div>
  );
}
