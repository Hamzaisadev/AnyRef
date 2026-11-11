/**
 * The driver module: one variable (the active brand ink) fans out to every visual that
 * carries the concept, so they can never disagree.
 *
 * Consumers:
 *   - the hero field, the steps section, the Pro plan card and the footer (background)
 *   - all five posters (ground, ink and accent)
 *   - the header's ink, which flips when the field scrolls past
 *   - the hero display type's width axis (idle breath)
 *
 * The page demonstrates the product by being the product: one layout, many brands.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, onScroll, prefersReducedMotion } from '@/engine';
import { INKS, type Ink } from '@/data/landing';
import { idle } from './idle';

type State = { index: number; ink: Ink };

const state: State = { index: 0, ink: INKS[0]! };
const listeners = new Set<(s: State) => void>();

export const onBrandChange = (fn: (s: State) => void) => {
  listeners.add(fn);
  fn(state);
  // Returns void, not Set.delete's boolean, so it works as a React cleanup.
  return () => {
    listeners.delete(fn);
  };
};

export const brandState = () => state;

/** Called by the colour rail. Writes the ink to :root so CSS does the flooding. */
export function setBrand(index: number) {
  const ink = INKS[index];
  if (!ink || index === state.index) return;
  state.index = index;
  state.ink = ink;
  paint();
  listeners.forEach((fn) => fn(state));
}

function paint() {
  const root = document.querySelector<HTMLElement>('.lp');
  if (!root) return;
  const { field, fieldInk, fieldDeep, deepInk } = state.ink;
  root.style.setProperty('--field', field);
  root.style.setProperty('--field-ink', fieldInk);
  root.style.setProperty('--field-deep', fieldDeep);
  root.style.setProperty('--deep-ink', deepInk);
}

/** Idle: the hero type breathes on its width axis while nothing else happens. */
const tick = () => {
  const el = document.querySelector<HTMLElement>('[data-breathe]');
  if (!el) return;
  const w = 112 + Math.sin(idle.t * 0.55) * 1.5 + idle.x * 1.2;
  el.style.fontVariationSettings = `'wdth' ${w.toFixed(2)}`;
};

export function startBrand() {
  // The header sits on the field in the hero and on paper after it, so its ink flips.
  // Also steps the frame aside on the way down and back on the way up.
  let last = 0;
  onScroll(({ y }) => {
    const root = document.documentElement.classList;
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    if (hero) {
      root.toggle('past-hero', y > hero.offsetHeight - 90);
    }
    // Which kind of section sits under the header decides the band's colour.
    const under = document.elementFromPoint(innerWidth / 2, 40);
    root.toggle('on-field', !!under?.closest('.lp-section--field, .lp-footer, .lp-hero'));

    if (Math.abs(y - last) < 4) return;
    root.toggle('frame-away', y > 200 && y > last);
    last = y;
  });

  onPage(() => {
    paint();
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    if (prefersReducedMotion() || !hero) return;

    // Only run the idle clock while the hero is on screen.
    const st = ScrollTrigger.create({
      trigger: hero,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
    });
    // onToggle does not fire for a trigger already in view on load.
    if (st.isActive) gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
    };
  });
}
