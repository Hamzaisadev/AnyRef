'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { ScrollContext, type ScrollContextValue } from './useScroll';
import { scrollToId, scrollToTarget, type ScrollToOptions } from '@/lib/landing/scroll';

/**
 * ScrollProvider
 * 
 * - Wraps the landing page only (not the whole app).
 * - Drives Lenis from GSAP's ticker (single animation loop).
 * - Honors prefers-reduced-motion: does not instantiate Lenis, keeps native scrolling only.
 * - Handles offset scrolling for #anchor navigation accounting for var(--nav-h).
 * - Any scrollable inner area (for example a code block with overflow) must have data-lenis-prevent.
 */

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export interface ScrollProviderProps {
  children: React.ReactNode;
}

export function ScrollProvider({ children }: ScrollProviderProps) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const scrollYRef = useRef<number>(0);
  const directionRef = useRef<number>(0);
  const isLockedRef = useRef<boolean>(false);

  const scrollToIdHandler = useCallback((id: string, options?: ScrollToOptions) => {
    scrollToId(id, lenisRef.current, options);
  }, []);

  const lock = useCallback(() => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    if (lenisRef.current) {
      lenisRef.current.stop();
    }
    document.documentElement.style.overflow = 'hidden';
  }, []);

  const unlock = useCallback(() => {
    if (!isLockedRef.current) return;
    isLockedRef.current = false;
    if (lenisRef.current) {
      lenisRef.current.start();
    }
    document.documentElement.style.overflow = '';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Configure ScrollTrigger
    ScrollTrigger.config({ ignoreMobileResize: true });

    let lenis: Lenis | null = null;
    let tickerCallback: ((time: number) => void) | null = null;
    let onNativeScroll: (() => void) | null = null;

    if (!prefersReducedMotion) {
      // Initialize Lenis with single GSAP ticker loop
      lenis = new Lenis({
        autoRaf: false,
        duration: 1.1,
        smoothWheel: true,
        syncTouch: false, // touch devices keep native scrolling (do not smooth touch)
        touchMultiplier: 1,
        anchors: false, // anchors handled by scrollToId
        prevent: (node) =>
          node.hasAttribute('data-lenis-prevent') ||
          node.closest('[data-lenis-prevent]') !== null,
      });

      lenisRef.current = lenis;
      setLenisInstance(lenis);
      (window as any).__lenis = lenis;

      // Single animation loop via GSAP ticker
      tickerCallback = (time: number) => {
        lenis?.raf(time * 1000);
      };

      gsap.ticker.add(tickerCallback);
      gsap.ticker.lagSmoothing(0);

      // Update ScrollTrigger on scroll
      lenis.on('scroll', (e) => {
        scrollYRef.current = e.scroll;
        directionRef.current = e.direction;
        ScrollTrigger.update();
      });
    } else {
      // Reduced motion: no Lenis created, native scrolling only
      lenisRef.current = null;
      setLenisInstance(null);

      onNativeScroll = () => {
        const currentY = window.scrollY;
        directionRef.current = currentY >= scrollYRef.current ? 1 : -1;
        scrollYRef.current = currentY;
        ScrollTrigger.update();
      };
      window.addEventListener('scroll', onNativeScroll, { passive: true });
    }

    // ScrollTrigger refreshes: once on fonts ready, once on window load, debounced on resize
    if (document.fonts) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }

    if (document.readyState === 'complete') {
      ScrollTrigger.refresh();
    } else {
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener('load', onLoad, { once: true });
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener('resize', onResize);

    // Initial hash navigation after fonts ready and layout settled
    const initialHash = window.location.hash.replace(/^#/, '');
    if (initialHash) {
      const handleInitialHash = () => {
        requestAnimationFrame(() => {
          scrollToTarget(initialHash, lenis, { immediate: false });
        });
      };

      if (document.fonts) {
        document.fonts.ready.then(handleInitialHash);
      } else {
        handleInitialHash();
      }
    }

    return () => {
      if (lenis) {
        lenis.destroy();
        lenisRef.current = null;
        setLenisInstance(null);
      }
      if (tickerCallback) {
        gsap.ticker.remove(tickerCallback);
      }
      gsap.ticker.lagSmoothing(500, 33); // restore default lagSmoothing
      window.removeEventListener('resize', onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (onNativeScroll) {
        window.removeEventListener('scroll', onNativeScroll);
      }
      document.documentElement.style.overflow = '';
    };
  }, []);

  const value: ScrollContextValue = {
    lenis: lenisInstance,
    scrollToId: scrollToIdHandler,
    scrollY: scrollYRef,
    direction: directionRef,
    lock,
    unlock,
  };

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}
