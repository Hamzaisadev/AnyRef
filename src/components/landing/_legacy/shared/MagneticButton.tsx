'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export interface MagneticButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

export function MagneticButton({
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  type = 'button',
  ariaLabel,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el || disabled) return;

    // Check touch device or reduced motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' });

    function handleMouseMove(e: MouseEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      // Magnetic pull radius 50px
      xTo(distanceX * 0.22);
      yTo(distanceY * 0.22);
    }

    function handleMouseLeave() {
      xTo(0);
      yTo(0);
    }

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [disabled]);

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs min-h-[40px]',
    md: 'px-6 py-3.5 text-sm sm:text-base min-h-[48px]',
    lg: 'px-8 py-4 text-base sm:text-lg min-h-[52px]',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#4B2BFF] text-white hover:bg-[#391BDF] shadow-[0_10px_25px_rgba(75,43,255,0.35)] hover:shadow-[0_14px_35px_rgba(75,43,255,0.5)] border border-[#4B2BFF]',
    secondary:
      'bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:border-white/25 backdrop-blur-sm',
    ghost:
      'bg-transparent hover:bg-white/5 text-[#9AA0AE] hover:text-white border border-transparent hover:border-white/10',
    disabled:
      'bg-white/5 text-white/40 border border-white/10 cursor-not-allowed pointer-events-none',
  }[disabled ? 'disabled' : variant];

  const commonClass = `relative inline-flex items-center justify-center rounded-xl font-tight font-bold tracking-wide transition-all duration-200 select-none will-change-transform active:scale-[0.98] focus:outline-none focus-visible:ring-3 focus-visible:ring-[#4B2BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1020] ${sizeStyles} ${variantStyles} ${className}`;

  if (href && !disabled) {
    return (
      <Link
        href={href}
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        className={commonClass}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={commonClass}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
