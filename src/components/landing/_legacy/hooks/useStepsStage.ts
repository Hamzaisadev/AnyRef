'use client';

import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface UseStepsStageProps {
  pinSectionRef: React.RefObject<HTMLElement | null>;
  stageCardRef: React.RefObject<HTMLElement | null>;
}

export function useStepsStage({ pinSectionRef, stageCardRef }: UseStepsStageProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const section = pinSectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.innerWidth >= 1024;

    if (prefersReducedMotion || !isDesktop) {
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          setScrollProgress(p);

          // Map 0..1 to steps 0, 1, 2, 3
          let stepIndex = 0;
          if (p >= 0.75) {
            stepIndex = 3;
          } else if (p >= 0.5) {
            stepIndex = 2;
          } else if (p >= 0.25) {
            stepIndex = 1;
          }
          setActiveStep(stepIndex);
        },
      });
    }, section);

    return () => ctx.revert();
  }, [pinSectionRef]);

  return {
    activeStep,
    setActiveStep,
    scrollProgress,
  };
}
