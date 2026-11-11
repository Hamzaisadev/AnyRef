// The idle input: t in seconds, x and y in -0.5..0.5, lagged behind the pointer.
// Publishes numbers and moves nothing by itself. What the drift means (here: a hold stamp
// that breathes) is the driver's decision.
import { gsap } from 'gsap';
import { isTouch, onScroll, prefersReducedMotion } from '@/engine';

export const idle = { t: 0, x: 0, y: 0 };

export function startIdle() {
  if (prefersReducedMotion()) return; // idle stays at zero: the page holds still
  const touch = isTouch();
  const aim = { x: 0, y: 0 };
  if (touch) {
    onScroll(({ velocity }) => {
      aim.y = gsap.utils.clamp(-0.5, 0.5, velocity / 40);
    });
  } else {
    addEventListener(
      'pointermove',
      (e) => {
        aim.x = e.clientX / innerWidth - 0.5;
        aim.y = e.clientY / innerHeight - 0.5;
      },
      { passive: true }
    );
  }
  gsap.ticker.add((t) => {
    const r = gsap.ticker.deltaRatio(); // same feel at 60 and 120 Hz
    if (touch) aim.y *= Math.pow(0.9, r); // velocity fades back to rest
    const k = 1 - Math.pow(0.95, r);
    idle.t = t;
    idle.x += (aim.x - idle.x) * k;
    idle.y += (aim.y - idle.y) * k;
  });
}
