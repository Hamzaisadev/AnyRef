import type Lenis from 'lenis';

/**
 * Reads the CSS variable --nav-h from the document root.
 * Defaults to 72px if not defined or during SSR.
 */
export function getNavHeight(): number {
  if (typeof window === 'undefined') return 72;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h').trim();
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 72 : parsed;
}

/**
 * Updates URL hash with a clean #id without affecting query parameters.
 */
export function updateUrlHash(id: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = id.replace(/^#/, '');
  const url = `${window.location.pathname}${window.location.search}#${cleanId}`;
  window.history.pushState(null, '', url);
}

export interface ScrollToOptions {
  immediate?: boolean;
  onComplete?: () => void;
}

/**
 * Scrolls to an element by ID or Element reference, offsetting by --nav-h so the
 * target top sits at exactly var(--nav-h) below viewport top.
 * Updates URL hash and moves focus to the element with tabindex="-1" for accessibility.
 */
export function scrollToTarget(
  target: HTMLElement | string,
  lenis: Lenis | null,
  options?: ScrollToOptions
): void {
  if (typeof window === 'undefined') return;

  const element = typeof target === 'string'
    ? document.getElementById(target.replace(/^#/, ''))
    : target;

  if (!element) return;

  const navH = getNavHeight();

  const handleFocus = () => {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }
    element.focus({ preventScroll: true });
    options?.onComplete?.();
  };

  if (lenis && !options?.immediate) {
    lenis.scrollTo(element, {
      offset: -navH,
      duration: 1.1,
      onComplete: handleFocus,
    });
  } else {
    const rect = element.getBoundingClientRect();
    const targetScroll = rect.top + window.scrollY - navH;
    window.scrollTo({
      top: targetScroll,
      behavior: 'auto',
    });
    handleFocus();
  }
}

/**
 * Public scroll helper that updates hash and performs offset scroll.
 */
export function scrollToId(
  id: string,
  lenis: Lenis | null,
  options?: ScrollToOptions
): void {
  const cleanId = id.replace(/^#/, '');
  updateUrlHash(cleanId);
  scrollToTarget(cleanId, lenis, options);
}
