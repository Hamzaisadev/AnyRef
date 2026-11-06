import React from 'react';

export type SectionTone = 'ink' | 'paper';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: SectionTone;
  id?: string;
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Section primitive:
 * - vertical padding: 96px mobile (py-24), 160px desktop (lg:py-40)
 * - sets background and text colors by tone ('ink' | 'paper')
 */
export function Section({
  tone = 'ink',
  id,
  children,
  className = '',
  as: Component = 'section',
  ...props
}: SectionProps) {
  const toneClasses =
    tone === 'paper'
      ? 'bg-[var(--paper)] text-[var(--text-on-paper)]'
      : 'bg-[var(--ink)] text-[var(--text-on-ink)]';

  return (
    <Component
      id={id}
      data-tone={tone}
      className={`w-full py-24 lg:py-40 ${toneClasses} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
