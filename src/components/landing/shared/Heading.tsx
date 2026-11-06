import React from 'react';

export type HeadingLevel = 'h1' | 'h2' | 'h3';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

const levelStyles: Record<HeadingLevel, string> = {
  h1: 'text-display-xl font-display font-bold',
  h2: 'text-h2 font-display font-bold',
  h3: 'text-h3 font-display font-semibold',
};

/**
 * Heading primitive:
 * - props: level ('h1' | 'h2' | 'h3'), as override
 * - applies type scale with clamp()
 */
export function Heading({
  level,
  as,
  children,
  className = '',
  ...props
}: HeadingProps) {
  const Component = as || level;
  const styles = levelStyles[level] || levelStyles.h2;

  return (
    <Component className={`${styles} ${className}`} {...props}>
      {children}
    </Component>
  );
}
