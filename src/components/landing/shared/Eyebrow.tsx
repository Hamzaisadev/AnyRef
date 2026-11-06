import React from 'react';

export interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Eyebrow primitive:
 * - mono, uppercase, 12px, tracking 0.14em
 * - 24px leading rule (horizontal rule preceding text and 24px line-height)
 */
export function Eyebrow({
  children,
  className = '',
  as: Component = 'div',
  ...props
}: EyebrowProps) {
  return (
    <Component
      className={`inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] leading-[24px] ${className}`}
      {...props}
    >
      <span
        className="inline-block w-6 h-px bg-current opacity-40 shrink-0"
        aria-hidden="true"
      />
      <span>{children}</span>
    </Component>
  );
}
