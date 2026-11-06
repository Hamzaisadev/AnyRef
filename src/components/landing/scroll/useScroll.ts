'use client';

import { createContext, useContext, type RefObject } from 'react';
import type Lenis from 'lenis';
import type { ScrollToOptions } from '@/lib/landing/scroll';

export interface ScrollContextValue {
  /**
   * Active Lenis instance, or null if prefers-reduced-motion is active.
   */
  lenis: Lenis | null;
  /**
   * Offset scroll to target id with history hash update and focus management.
   */
  scrollToId: (id: string, options?: ScrollToOptions) => void;
  /**
   * Ref holding current scroll position in pixels. Does not trigger re-renders.
   */
  scrollY: RefObject<number>;
  /**
   * Ref holding scroll direction: 1 (down), -1 (up), or 0.
   */
  direction: RefObject<number>;
  /**
   * Locks scroll (stops Lenis and sets html overflow: hidden).
   */
  lock: () => void;
  /**
   * Unlocks scroll (resumes Lenis and clears html overflow).
   */
  unlock: () => void;
}

export const ScrollContext = createContext<ScrollContextValue | null>(null);

/**
 * Access the landing scroll system.
 * Returns refs and methods without triggering component re-renders on scroll.
 */
export function useScroll(): ScrollContextValue {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll must be used within a <ScrollProvider>');
  }
  return context;
}
