'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  glowColor?: string;
}

export function MagneticButton({
  children,
  className = '',
  strength = 0.35,
  glowColor = 'rgba(75, 43, 255, 0.4)',
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(buttonRef.current, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: 'power2.out',
    });

    if (contentRef.current) {
      gsap.to(contentRef.current, {
        x: x * (strength * 0.5),
        y: y * (strength * 0.5),
        duration: 0.3,
        ease: 'power2.out',
      });
    }

    if (glowRef.current) {
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      gsap.to(glowRef.current, {
        opacity: 0.8,
        background: `radial-gradient(circle at ${px}% ${py}%, ${glowColor}, transparent 70%)`,
        duration: 0.2,
      });
    }
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: 'elastic.out(1.1, 0.4)',
    });

    if (contentRef.current) {
      gsap.to(contentRef.current, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1.1, 0.4)',
      });
    }

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0,
        duration: 0.4,
      });
    }
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center justify-center overflow-hidden transition-shadow select-none ${className}`}
      {...props}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity"
        aria-hidden="true"
      />
      <span ref={contentRef} className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
