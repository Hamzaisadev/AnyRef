// First-load sequence. Progress follows REAL work (fonts + critical images), eased by GSAP,
// with a floor so it reads as intentional and a ceiling so it never becomes a usability
// problem. Markup (#loader) lives in the layout; its look is authored per project.
import { gsap } from 'gsap';
import { ease, prefersReducedMotion } from './env';

let format = (p: number) => String(Math.round(p)).padStart(3, '0');
/** Customize the counter text, e.g. a clock, a year, a frame count. p goes 0 -> 100. */
export const setLoaderFormat = (fn: (p: number) => string) => {
  format = fn;
};

let exit: ((root: HTMLElement) => gsap.core.Timeline) | null = null;
/** Replace the exit choreography (the loader -> hero handoff). Return a timeline. */
export const setLoaderExit = (fn: (root: HTMLElement) => gsap.core.Timeline) => {
  exit = fn;
};

// Measured from the head script, so these bound the whole visible loader including the
// ~1s of JS load and hydration before boot() can run. The exit adds ~0.6s on top, which
// keeps the total inside the 2.6s cap.
const MIN = 1.3; // seconds: long enough to read as a designed moment
const MAX = 1.9; // seconds: anything longer pushes the total past the cap

/**
 * Only the assets the first screen actually needs. Lazy images further down the page
 * must never gate the loader: waiting on all of them pushed it past 6s on a throttled
 * phone, which is a usability failure no matter how good the choreography is.
 */
function criticalAssets(): Promise<unknown>[] {
  const imgs = [
    ...document.querySelectorAll<HTMLImageElement>('img[data-critical], img[fetchpriority="high"]'),
  ];
  return [
    document.fonts.ready,
    ...imgs.map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => {}))),
  ];
}

export async function runLoader(): Promise<void> {
  const root = document.getElementById('loader');
  if (!root) return;

  if (prefersReducedMotion()) {
    // The head script only starts counting when motion is allowed, but clear it
    // defensively so no stray interval survives this path.
    const rw = window as Window & { __loaderTick?: number };
    if (rw.__loaderTick) clearInterval(rw.__loaderTick);
    await Promise.race([Promise.all(criticalAssets()), wait(MAX)]);
    await gsap.to(root, { autoAlpha: 0, duration: 0.3 });
    return finish(root);
  }

  const count = root.querySelector<HTMLElement>('[data-loader-count]');
  const bar = root.querySelector<HTMLElement>('[data-loader-bar]');
  const tasks = criticalAssets();
  let done = 0;

  // The head script has been counting since before hydration. Adopt its value and its
  // clock rather than restarting at zero, so the sequence reads as one continuous
  // progress bar instead of resetting the moment React wakes up.
  const w = window as Window & { __loaderStart?: number; __loaderTick?: number };
  if (w.__loaderTick) clearInterval(w.__loaderTick);
  const shown = { v: Math.min(96, parseFloat(count?.textContent || '0') || 0) };
  const target = { v: 0 };
  tasks.forEach((t) =>
    t.then(() => {
      done++;
      target.v = (done / tasks.length) * 100;
    })
  );
  // Elapsed includes the pre-boot phase, so MIN/MAX bound the whole visible loader.
  // __loaderStart is a Date.now() value, so convert it onto the performance clock.
  const start = w.__loaderStart
    ? performance.now() - (Date.now() - w.__loaderStart)
    : performance.now();

  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const timeCap = Math.min(100, (elapsed / MIN) * 100); // never faster than MIN
      const goal = elapsed > MAX ? 100 : Math.min(target.v, timeCap);
      // Past MAX, snap rather than lerp: an asymptotic approach to 100 can hang for
      // another second on a slow connection, which is how loaders overrun their cap.
      shown.v = elapsed > MAX ? 100 : shown.v + (goal - shown.v) * 0.12;
      if (goal === 100 && shown.v > 99.5) shown.v = 100;
      if (count) count.textContent = format(shown.v);
      if (bar) bar.style.transform = `scaleX(${shown.v / 100})`;
      if (shown.v === 100) {
        gsap.ticker.remove(tick);
        resolve();
      }
    };
    gsap.ticker.add(tick);
  });

  // Exit. Authored per project: it is the first handoff every visitor sees.
  if (exit) {
    await exit(root);
    return finish(root);
  }
  await gsap
    .timeline()
    .to(root.querySelectorAll('[data-loader-out]'), {
      yPercent: -110,
      duration: 0.7,
      ease: ease.inOut,
      stagger: 0.05,
    })
    .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: ease.inOut }, '-=0.35');
  finish(root);
}

// Hide rather than remove: in React apps the loader node belongs to React.
function finish(root: HTMLElement) {
  root.hidden = true;
  document.documentElement.classList.add('is-loaded');
}

const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
