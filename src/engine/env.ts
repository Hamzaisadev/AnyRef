export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => matchMedia('(hover: none), (pointer: coarse)').matches;
export const isMobile = () => matchMedia('(max-width: 767px)').matches;

/**
 * Shared easing vocabulary. Use these names everywhere; never invent per-component curves.
 * The motion verb is "hold, then release": expo curves hold their position late and then
 * resolve fast, which is the point.
 */
export const ease = {
  out: 'expo.out', // default entrance
  inOut: 'expo.inOut', // curtains, page transitions
  soft: 'power3.out', // small UI, hover feedback
  spring: 'back.out(1.6)', // used rarely
} as const;
