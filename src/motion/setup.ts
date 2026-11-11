/**
 * Global motion for this site: runs once on the client, before the first page initializes.
 * This is the only safe place for code that touches window at setup time.
 */
import { gsap } from 'gsap';
import {
  ease,
  isTouch,
  onPage,
  prefersReducedMotion,
  setLoaderExit,
  setLoaderFormat,
  setTransition,
} from '@/engine';
import { startIdle } from './idle';
import { startBrand } from './brand';

/**
 * The loader performs the product's own act rather than counting to 100.
 *
 * A blank sheet gains a poster's parts in order (reference image, brand, headline,
 * price), narrated by a step label, and the price field stays struck out and stamped
 * "Needs you" until the final beat, when it resolves to a real number. Anyone who
 * watches it has understood what Anyref does before reading a word of the page.
 *
 * The beats are driven by real progress, not a fixed timeline, so a fast connection
 * sees a fast build rather than an artificial wait.
 */
function loader() {
  const STEPS: Array<{ at: number; label: string; layer?: number }> = [
    { at: 0, label: 'Reading the reference' },
    { at: 22, label: 'Lifting the layout', layer: 1 },
    { at: 46, label: 'Applying your brand', layer: 2 },
    { at: 68, label: 'Setting the words', layer: 3 },
    { at: 88, label: 'Holding the price for you', layer: 4 },
  ];

  let lastStep = -1;

  setLoaderFormat((p) => {
    const root = document.getElementById('loader');
    if (root) {
      // Find the furthest beat reached and reveal everything up to it. Driving from
      // the progress value (not a timeline) keeps the build honest on slow networks.
      let idx = 0;
      for (let i = 0; i < STEPS.length; i++) if (p >= STEPS[i]!.at) idx = i;

      if (idx !== lastStep) {
        lastStep = idx;
        const step = root.querySelector<HTMLElement>('[data-loader-step]');
        if (step && step.textContent !== STEPS[idx]!.label) {
          // Each label swaps with a short lift so the narration reads as deliberate.
          gsap.fromTo(
            step,
            { yPercent: 110, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.32, ease: ease.out }
          );
          step.textContent = STEPS[idx]!.label;
        }

        for (let i = 1; i <= 4; i++) {
          const layer = root.querySelector<HTMLElement>(`[data-layer="${i}"]`);
          if (!layer) continue;
          const shouldShow = STEPS.slice(0, idx + 1).some((s) => s.layer === i);
          if (shouldShow && layer.style.opacity !== '1') {
            gsap.fromTo(
              layer,
              { autoAlpha: 0, y: i === 1 ? 0 : 14, scale: i === 1 ? 1.06 : 1 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: ease.out }
            );
            layer.style.opacity = '1';
          }
        }
      }

      // The last beat: the held price resolves, which is the product's whole promise.
      if (p >= 99) {
        const price = root.querySelector<HTMLElement>('.loader__layer--price');
        const value = root.querySelector<HTMLElement>('[data-loader-price]');
        if (price && price.dataset.resolved !== 'true') {
          price.dataset.resolved = 'true';
          if (value) value.textContent = '20% off';
          gsap.fromTo(price, { scale: 0.9 }, { scale: 1, duration: 0.45, ease: ease.spring });
        }
      }
    }
    return String(Math.round(p)).padStart(3, '0');
  });

  setLoaderExit((root) => {
    const sheet = root.querySelector<HTMLElement>('[data-loader-sheet]');
    const hero = document.querySelector<HTMLElement>('.lp-stack .lp-poster');

    // The finished sheet travels to where the hero's first poster sits and the field
    // wipes off around it, so the loader hands the poster to the page rather than
    // throwing it away. A FLIP move: measure both, animate the difference.
    const flip = () => {
      if (!sheet || !hero) return null;
      const a = sheet.getBoundingClientRect();
      const b = hero.getBoundingClientRect();
      if (!b.width || !b.height) return null;
      return {
        x: b.left + b.width / 2 - (a.left + a.width / 2),
        y: b.top + b.height / 2 - (a.top + a.height / 2),
        scale: b.width / a.width,
      };
    };

    const move = flip();
    // ~0.7s total. boot() cannot run until React hydrates, and the progress phase is
    // capped, so the exit takes what is left of the 2.6s budget. Everything overlaps.
    const tl = gsap.timeline();

    // The chrome clears first, leaving only the finished poster on the field.
    tl.to(root.querySelector('[data-loader-count]'), {
      yPercent: -140,
      autoAlpha: 0,
      duration: 0.24,
      ease: ease.inOut,
    })
      .to(root.querySelector('.loader__name'), { autoAlpha: 0, duration: 0.2 }, '<')
      .to(root.querySelector('.loader__foot'), { autoAlpha: 0, y: 14, duration: 0.24 }, '<');

    if (sheet && move) {
      // The poster flies to its place in the hero.
      tl.to(
        sheet,
        {
          x: move.x,
          y: move.y,
          scale: move.scale,
          duration: 0.62,
          ease: ease.inOut,
        },
        '-=0.1'
      );
      // The field peels away from the top, uncovering the page around the travelling
      // sheet rather than over it.
      tl.to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.48, ease: ease.inOut }, '-=0.34');
      // Hand off: the real hero poster is already underneath, so the clone can go.
      tl.to(sheet, { autoAlpha: 0, duration: 0.18 }, '-=0.14');
    } else {
      // No hero on this route (the 404, or a direct link to an inner page): just wipe.
      tl.to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.5, ease: ease.inOut }, '-=0.1');
    }

    return tl;
  });
}

/**
 * Page transition: a press run.
 *
 * Four ink bands sweep across in sequence, like plates laid down one after another on a
 * press, then lift in the opposite order on the far side. It comes from the same world
 * as the loader (a poster being made) rather than being a generic curtain, and it reads
 * as one mechanism instead of a fade.
 *
 * The bands take the visitor's current brand colour, so the transition is never a colour
 * the page has not already been wearing.
 */
function transition() {
  const BANDS = 4;

  /** Build the band elements once, inside the existing curtain panel. */
  function bandsOf(c: HTMLElement): HTMLElement[] {
    const panel = c.querySelector<HTMLElement>('.curtain__panel');
    if (!panel) return [];
    let list = Array.from(panel.querySelectorAll<HTMLElement>('.curtain__band'));
    if (list.length !== BANDS) {
      panel.innerHTML = '';
      list = Array.from({ length: BANDS }, () => {
        const b = document.createElement('span');
        b.className = 'curtain__band';
        panel.appendChild(b);
        return b;
      });
      // Park them off-screen through GSAP, not CSS, so nothing stacks with the tweens.
      gsap.set(list, { xPercent: -101 });
    }
    // Read the live brand ink; each band is a shade of it, so the stack reads as one
    // colour being built up rather than four unrelated stripes.
    const styles = getComputedStyle(document.querySelector('.lp') || document.documentElement);
    const field = styles.getPropertyValue('--field').trim() || '#ff4d2e';
    const deep = styles.getPropertyValue('--field-deep').trim() || '#a62612';
    list.forEach((b, i) => {
      b.style.background = i % 2 === 0 ? field : deep;
    });
    return list;
  }

  setTransition({
    leave: (c) => {
      const bands = bandsOf(c);
      const panel = c.querySelector<HTMLElement>('.curtain__panel');
      if (panel) panel.style.background = 'transparent';

      return gsap
        .timeline()
        .set(c, { autoAlpha: 1 })
        .fromTo(
          bands,
          { xPercent: -101 },
          { xPercent: 0, duration: 0.5, stagger: 0.07, ease: ease.inOut }
        );
    },
    enter: (c) => {
      const bands = bandsOf(c);
      return gsap
        .timeline()
        .to(bands, {
          xPercent: 101,
          duration: 0.55,
          // Reverse order on the way out, so the last plate down is the first to lift.
          stagger: { each: 0.07, from: 'end' },
          ease: ease.inOut,
        })
        .set(c, { autoAlpha: 0 })
        .set(bands, { xPercent: -101 });
    },
  });
}

/**
 * Primary-target treatment: the fill floods from the side the pointer entered from.
 * CSS covers touch, no-JS and reduced motion; this adds the directional nuance.
 */
function buttonFill() {
  onPage(() => {
    if (isTouch() || prefersReducedMotion()) return;
    const off: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>('[data-fill]').forEach((btn) => {
      const fill = btn.querySelector<HTMLElement>('.lp-btn__fill');
      if (!fill) return;
      const from = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect();
        return `${e.clientX - r.left}px ${e.clientY - r.top}px`;
      };
      let closed = true;
      const open = (at: string) => {
        if (closed) gsap.set(fill, { clipPath: `circle(0% at ${at})` });
        closed = false;
        btn.classList.add('is-filled');
        gsap.to(fill, {
          clipPath: `circle(150% at ${at})`,
          duration: 0.55,
          ease: ease.soft,
          overwrite: true,
        });
      };
      const close = (at: string) => {
        btn.classList.remove('is-filled');
        gsap.to(fill, {
          clipPath: `circle(0% at ${at})`,
          duration: 0.45,
          ease: ease.soft,
          overwrite: true,
          onComplete: () => {
            closed = true;
          },
        });
      };
      const enter = (e: PointerEvent) => open(from(e));
      const leaveBtn = (e: PointerEvent) => close(from(e));
      const focus = () => btn.matches(':focus-visible') && open('50% 50%');
      const blur = () => close('50% 50%');
      btn.addEventListener('pointerenter', enter);
      btn.addEventListener('pointerleave', leaveBtn);
      btn.addEventListener('focus', focus);
      btn.addEventListener('blur', blur);
      off.push(() => {
        btn.removeEventListener('pointerenter', enter);
        btn.removeEventListener('pointerleave', leaveBtn);
        btn.removeEventListener('focus', focus);
        btn.removeEventListener('blur', blur);
      });
    });
    return () => off.forEach((f) => f());
  });
}

export function setupMotion() {
  loader();
  transition();
  startIdle();
  startBrand();
  buttonFill();
}
