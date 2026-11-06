'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface UseProblemTimelineProps {
  sectionRef: React.RefObject<HTMLElement | null>;
  cardsContainerRef: React.RefObject<HTMLElement | null>;
  mergedCardRef: React.RefObject<HTMLElement | null>;
  painItemRefs: React.RefObject<(HTMLElement | null)[]>;
}

export function useProblemTimeline({
  sectionRef,
  cardsContainerRef,
  mergedCardRef,
  painItemRefs,
}: UseProblemTimelineProps) {
  useEffect(() => {
    const section = sectionRef.current;
    const cardsContainer = cardsContainerRef.current;
    const mergedCard = mergedCardRef.current;
    if (!section || !cardsContainer || !mergedCard) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 1024;

    const ctx = gsap.context(() => {
      const chaoticCards = cardsContainer.querySelectorAll('.chaotic-note-card');
      const painItems = painItemRefs.current?.filter(Boolean) as HTMLElement[];

      if (prefersReducedMotion) {
        // Immediate final organized state
        gsap.set(chaoticCards, { opacity: 0, scale: 0.8, display: 'none' });
        gsap.set(mergedCard, { opacity: 1, scale: 1, y: 0 });
        if (painItems.length) {
          gsap.set(painItems, { opacity: 1 });
        }
        return;
      }

      // Initial state of chaotic cards
      chaoticCards.forEach((card, i) => {
        const rot = ((i * 17) % 24) - 12; // -12 to 12 deg
        const offsetX = ((i * 23) % 40) - 20;
        const offsetY = ((i * 19) % 30) - 15;
        gsap.set(card, {
          rotate: rot,
          x: offsetX,
          y: offsetY,
          opacity: 0.85,
        });
      });

      gsap.set(mergedCard, { opacity: 0, scale: 0.92, y: 20 });
      if (painItems.length) {
        gsap.set(painItems, { opacity: 0.4 });
      }

      // Scrubbed ScrollTrigger timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: isMobile ? 'top 80%' : 'top 65%',
          end: isMobile ? 'bottom 85%' : 'bottom 35%',
          scrub: 0.8,
        },
      });

      // 1. Pain Point 1 activates & cards begin to straighten
      if (painItems[0]) {
        tl.to(painItems[0], { opacity: 1, duration: 0.3 }, 0);
      }
      tl.to(
        chaoticCards,
        {
          rotate: (i) => (((i * 17) % 10) - 5) * 0.5,
          x: (i) => ((i * 23) % 20) - 10,
          y: (i) => ((i * 19) % 15) - 7,
          stagger: 0.02,
          duration: 0.35,
          ease: 'none',
        },
        0
      );

      // 2. Pain Point 2 activates & cards align to grid
      if (painItems[1]) {
        tl.to(painItems[1], { opacity: 1, duration: 0.3 }, 0.35);
      }
      tl.to(
        chaoticCards,
        {
          rotate: 0,
          x: 0,
          y: 0,
          opacity: 0.4,
          scale: 0.85,
          stagger: 0.01,
          duration: 0.35,
          ease: 'none',
        },
        0.35
      );

      // 3. Pain Point 3 activates & merge into "One library" glowing card
      if (painItems[2]) {
        tl.to(painItems[2], { opacity: 1, duration: 0.3 }, 0.7);
      }
      tl.to(
        chaoticCards,
        {
          opacity: 0,
          scale: 0.6,
          duration: 0.3,
          ease: 'power2.in',
        },
        0.7
      );

      tl.to(
        mergedCard,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.35,
          ease: 'power2.out',
        },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, [sectionRef, cardsContainerRef, mergedCardRef, painItemRefs]);
}
