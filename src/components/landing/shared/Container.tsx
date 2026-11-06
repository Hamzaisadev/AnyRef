import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

/**
 * Container primitive:
 * - max width: 1280px
 * - horizontal padding: 16px under 640px, 24px up to 1024px, 32px above
 * - centered with mx-auto
 */
export function Container({
  as: Component = 'div',
  children,
  className = '',
  ...props
}: ContainerProps) {
  return (
    <Component
      className={`mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
