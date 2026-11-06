'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ANIMATION_TOKENS } from '@/lib/landing/tokens';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface UseRevealOptions {
  triggerRef: React.RefObject<HTMLElement | null>;
  targetsSelector?: string;
  stagger?: number;
  yOffset?: number;
  duration?: number;
  start?: string;
}

export function useReveal({
  triggerRef,
  targetsSelector = '[data-reveal]',
  stagger = ANIMATION_TOKENS.stagger.default,
  yOffset = ANIMATION_TOKENS.yOffset,
  duration = ANIMATION_TOKENS.duration.medium,
  start = 'top 85%',
}: UseRevealOptions) {
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const targets = trigger.querySelectorAll(targetsSelector);
      if (!targets.length) return;

      if (prefersReducedMotion) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y: yOffset,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: ANIMATION_TOKENS.ease.entrance,
          scrollTrigger: {
            trigger,
            start,
            toggleActions: 'play none none none',
          },
        }
      );
    }, trigger);

    return () => ctx.revert();
  }, [triggerRef, targetsSelector, stagger, yOffset, duration, start]);
}
