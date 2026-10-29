import React from 'react';
import type { FieldSource } from '@/ai/schemas';
import { MessageSquare, Sparkles, Lightbulb, AlertCircle } from 'lucide-react';

interface FieldSourceBadgeProps {
  source: FieldSource;
  note?: string;
  className?: string;
}

export function FieldSourceBadge({ source, note, className = '' }: FieldSourceBadgeProps) {
  const configs: Record<
    FieldSource,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    you_said: {
      label: 'You said',
      icon: <MessageSquare className="w-3 h-3" />,
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/20',
    },
    inferred: {
      label: 'Inferred',
      icon: <Sparkles className="w-3 h-3" />,
      bg: 'bg-blue-500/10',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/20',
    },
    suggested: {
      label: 'Suggested',
      icon: <Lightbulb className="w-3 h-3" />,
      bg: 'bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/20',
    },
    empty: {
      label: 'Needs you',
      icon: <AlertCircle className="w-3 h-3" />,
      bg: 'bg-rose-500/10',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/20',
    },
  };

  const config = configs[source] || configs.empty;

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
      title={note ? `${config.label}: ${note}` : config.label}
      aria-label={note ? `${config.label}: ${note}` : config.label}
    >
      {config.icon}
      <span>{config.label}</span>
      {note && (
        <span className="text-[10px] opacity-80 max-w-[150px] truncate ml-0.5" title={note}>
          ({note})
        </span>
      )}
    </span>
  );
}
