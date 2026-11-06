import React from 'react';
import { SlotType, SLOT_COLORS } from '@/lib/landing/tokens';

export interface ChipProps {
  type: SlotType;
  children: React.ReactNode;
  tag?: string;
  source?: 'You said' | 'Inferred' | 'Suggested' | 'Needs you';
  isLocked?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Chip({
  type,
  children,
  tag,
  source,
  isLocked,
  className = '',
  onClick,
  style,
}: ChipProps) {
  const config = SLOT_COLORS[type];

  // Specific badge color mapping for source badges
  const sourceColors: Record<string, string> = {
    'You said': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Inferred: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Suggested: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    'Needs you': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  };

  return (
    <span
      onClick={onClick}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.text,
        ...style,
      }}
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-semibold tracking-tight transition-all duration-200 select-none ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
    >
      {tag && (
        <span className="opacity-60 text-[10px] uppercase font-bold tracking-wider mr-0.5">
          {tag}:
        </span>
      )}

      <span>{children}</span>

      {source && (
        <span
          className={`ml-1 text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${
            sourceColors[source] || 'bg-white/10 text-white/80 border-white/20'
          }`}
        >
          {source}
        </span>
      )}

      {isLocked && (
        <span className="ml-1 text-[10px] text-amber-400" title="Locked by schema">
          🔒
        </span>
      )}
    </span>
  );
}
