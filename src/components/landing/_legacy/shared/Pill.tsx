import React from 'react';

export interface PillProps {
  children: React.ReactNode;
  variant?: 'winner' | 'needsTweak' | 'failed' | 'primary' | 'neutral';
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Pill({
  children,
  variant = 'neutral',
  isActive = false,
  onClick,
  className = '',
  size = 'md',
}: PillProps) {
  const variantStyles = {
    winner: 'bg-[#1E9E6A]/20 text-[#1E9E6A] border-[#1E9E6A]/40',
    needsTweak: 'bg-[#FF8A3D]/20 text-[#FF8A3D] border-[#FF8A3D]/40',
    failed: 'bg-[#D64545]/20 text-[#D64545] border-[#D64545]/40',
    primary: 'bg-[#4B2BFF]/20 text-[#4B2BFF] border-[#4B2BFF]/40',
    neutral: isActive
      ? 'bg-white/20 text-white border-white/40'
      : 'bg-white/5 text-[#9AA0AE] hover:text-white border-white/10 hover:border-white/20',
  }[variant];

  const sizeStyles = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3.5 py-1 text-xs';

  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`inline-flex items-center space-x-1.5 rounded-full border font-mono font-medium tracking-tight transition-all duration-200 select-none ${sizeStyles} ${variantStyles} ${
        onClick
          ? 'cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2BFF]'
          : ''
      } ${className}`}
    >
      {variant === 'winner' && <span className="w-1.5 h-1.5 rounded-full bg-[#1E9E6A]" />}
      {variant === 'needsTweak' && <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A3D]" />}
      {variant === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-[#D64545]" />}
      <span>{children}</span>
    </span>
  );
}
