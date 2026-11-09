import type { Metadata } from 'next';
import Link from 'next/link';
import { LpHeader } from '@/components/lp/LpHeader';

export const metadata: Metadata = {
  title: 'Nothing here',
  description: 'That page does not exist. Here is the way back.',
};

const Arrow = () => (
  <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true">
    <path d="M10 1l4 4-4 4M14 5H1" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

/** The 404 carries the concept: the colour rail with nothing on it, on bare paper. */
export default function NotFound() {
  return (
    <div className="lp lp-on-paper">
      <LpHeader />

      <main id="main" tabIndex={-1} className="lp-404 lp-shell">
        <p className="lp-label" data-reveal="fade" data-intro>
          404
        </p>

        <h1 className="lp-display lp-mega" data-split="lines" data-intro data-delay="0.1">
          Blank sheet.
        </h1>

        <p className="lp-lead" data-split="lines" data-intro data-delay="0.3">
          There is no page at this address. The posters are back on the front.
        </p>

        <div className="lp-hero__actions" data-reveal="up" data-intro data-delay="0.45">
          <Link href="/" className="lp-btn lp-btn--ghost" data-fill>
            <span className="lp-btn__fill" aria-hidden="true" />
            Back to the start
            <Arrow />
          </Link>
          <Link href="/guides" className="lp-btn lp-btn--ghost" data-fill>
            <span className="lp-btn__fill" aria-hidden="true" />
            Read the guides
          </Link>
        </div>
      </main>
    </div>
  );
}
