import type { Metadata } from 'next';
import Link from 'next/link';
import { LpHeader } from '@/components/lp/LpHeader';
import { ColourRail } from '@/components/lp/ColourRail';
import { Poster } from '@/components/lp/Poster';
import {
  audiences,
  faq,
  heroPosters,
  honesty,
  limits,
  photoCredits,
  pricing,
  proofPosters,
  site,
  steps,
} from '@/data/landing';

export const metadata: Metadata = {
  title: 'Anyref: your brand, every post',
  description: site.description,
  alternates: { canonical: '/' },
};

const Arrow = () => (
  <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true">
    <path d="M10 1l4 4-4 4M14 5H1" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export default function HomePage() {
  return (
    <div className="lp">
      <LpHeader />

      <main id="main" tabIndex={-1}>
        {/* ---------------- Hero: the colour field ---------------- */}
        <section className="lp-hero" data-hero>
          <div className="lp-shell lp-hero__grid">
            <div className="lp-hero__claim">
              <h1 className="lp-display lp-mega" data-breathe data-split="lines" data-intro>
                Your brand. Every post.
              </h1>
              <p className="lp-lead" data-split="lines" data-intro data-delay="0.15">
                Drop in any poster you like the look of. Anyref rebuilds it in your colours,
                your logo and your words, and hands you the finished image.
              </p>
              <div className="lp-hero__actions" data-reveal="up" data-intro data-delay="0.35">
                <Link
                  href="/login?next=/workspace/generate"
                  className="lp-btn lp-btn--solid"
                  data-fill
                >
                  <span className="lp-btn__fill" aria-hidden="true" />
                  Make one free
                  <Arrow />
                </Link>
                <a href="#how" className="lp-btn lp-btn--ghost" data-fill>
                  <span className="lp-btn__fill" aria-hidden="true" />
                  See how it works
                </a>
              </div>
              <div data-reveal="fade" data-intro data-delay="0.5">
                <ColourRail />
              </div>
            </div>

            <div className="lp-stack" data-reveal="up" data-intro data-delay="0.25">
              {heroPosters.map((p, i) => (
                <Poster key={p.brand} data={p} tint={i === 0} priority />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Proof: one layout, many brands ---------------- */}
        <section className="lp-section lp-shell lp-on-paper" id="examples">
          <div className="lp-section__head">
            <h2 className="lp-h2" data-split="lines">
              One layout. Five brands. No redrawing.
            </h2>
            <p className="lp-body" data-split="lines">
              Save a brand once and every poster you make afterwards already knows your
              colours, your wordmark and how you write.
            </p>
          </div>

          {/* The middle poster follows the colour rail, so picking an ink visibly
              re-skins work further down the page, not just the hero pair. */}
          <div className="lp-proof">
            {proofPosters.map((p, i) => (
              <div className="lp-proof__item" key={p.brand} data-reveal="up">
                <Poster
                  data={p}
                  tint={i === 1}
                  sizes="(max-width: 600px) 92vw, (max-width: 980px) 46vw, 420px"
                />
                <div className="lp-proof__meta">
                  <span className="lp-label">{p.kind}</span>
                  <span className="lp-tag">{i === 1 ? 'Your brand' : 'Example'}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="lp-label" style={{ marginTop: 'calc(var(--u) * 2.5)' }}>
            These brands are invented so you can see the format. Real customer work replaces
            them.
          </p>
        </section>

        {/* ---------------- Steps: a real sequence ---------------- */}
        <section className="lp-section lp-section--field" id="how">
          <div className="lp-shell">
            <div className="lp-section__head">
              <h2 className="lp-h2" data-split="lines">
                Three steps, about a minute.
              </h2>
            </div>
            <div className="lp-steps">
              {steps.map((s) => (
                <div className="lp-step" key={s.n} data-reveal="up">
                  <span className="lp-step__n lp-num">{s.n}</span>
                  <h3 className="lp-h3">{s.title}</h3>
                  <p className="lp-body">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Who it is for ---------------- */}
        <section className="lp-section lp-shell lp-on-paper">
          <div className="lp-section__head lp-section__head--wide">
            <h2 className="lp-h2" data-split="lines">
              Built for people who post more than they design.
            </h2>
            <p className="lp-body" data-split="lines">
              Anyref is not trying to replace a designer. It is trying to get the fourth
              poster this week out of the door without it looking like the first three were
              made by someone else.
            </p>
          </div>

          <div className="lp-audiences">
            {audiences.map((a) => (
              <div className="lp-audience" key={a.title} data-reveal="up">
                <span className="lp-label">{a.detail}</span>
                <h3 className="lp-h3">{a.title}</h3>
                <p className="lp-body">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Honesty ---------------- */}
        <section className="lp-section lp-shell lp-on-paper">
          <div className="lp-section__head lp-section__head--wide">
            <h2 className="lp-h2" data-split="lines">
              It fills in a lot. It never guesses your prices.
            </h2>
            <p className="lp-body" data-split="lines">
              An image model will happily put a number on a poster for you. That number
              becomes a claim the moment you post it, so Anyref leaves those to you.
            </p>
          </div>

          <div className="lp-split">
            <div data-reveal="up">
              <h3 className="lp-h3">{honesty.fills.title}</h3>
              <div className="lp-list">
                {honesty.fills.items.map((item) => (
                  <p className="lp-list__item" key={item}>
                    <span className="lp-list__mark" aria-hidden="true">
                      +
                    </span>
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </div>
            <div data-reveal="up" data-delay="0.08">
              <h3 className="lp-h3">{honesty.asks.title}</h3>
              <div className="lp-list">
                {honesty.asks.items.map((item) => (
                  <p className="lp-list__item" key={item}>
                    <span className="lp-list__mark" aria-hidden="true">
                      ?
                    </span>
                    <span>{item}</span>
                  </p>
                ))}
              </div>
              <p className="lp-body" style={{ marginTop: 'calc(var(--u) * 1.8)' }}>
                {honesty.asks.note}
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- Limits ---------------- */}
        <section className="lp-section lp-section--field">
          <div className="lp-shell">
            <div className="lp-section__head lp-section__head--wide">
              <h2 className="lp-h2" data-split="lines">
                {limits.title}
              </h2>
              <p className="lp-body" data-split="lines">
                Worth knowing before you sign up, so you are not disappointed twenty minutes
                in.
              </p>
            </div>
            <dl className="lp-limits">
              {limits.items.map((item) => (
                <div className="lp-limit" key={item.k} data-reveal="up">
                  <dt className="lp-h3">{item.k}</dt>
                  <dd className="lp-body">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ---------------- Pricing ---------------- */}
        <section className="lp-section lp-shell lp-on-paper" id="pricing">
          <div className="lp-section__head lp-section__head--wide">
            <h2 className="lp-h2" data-split="lines">
              Pay for posters, not for seats.
            </h2>
            <p className="lp-body" data-split="lines">
              Rendering is the only thing here that costs real money, so that is what you
              pay for. Refilling a saved template costs nothing and never counts against
              your month.
            </p>
          </div>

          <div className="lp-plans">
            <div className="lp-plan" data-reveal="up">
              <h3 className="lp-h3">{pricing.free.name}</h3>
              <p className="lp-plan__price lp-num">$0</p>
              <p className="lp-plan__renders">{pricing.free.renders} posters a month</p>
              <div className="lp-plan__lines">
                {pricing.free.lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
              <Link href="/login?next=/workspace/generate" className="lp-btn lp-btn--ghost" data-fill>
                <span className="lp-btn__fill" aria-hidden="true" />
                Start free
                <Arrow />
              </Link>
            </div>

            <div className="lp-plan lp-plan--lead" data-reveal="up" data-delay="0.08">
              <h3 className="lp-h3">{pricing.pro.name}</h3>
              <p className="lp-plan__price lp-num">
                ${pricing.pro.price}{' '}
                <span className="lp-label" style={{ marginLeft: '0.5rem' }}>
                  a month
                </span>
              </p>
              <p className="lp-plan__renders">{pricing.pro.renders} posters a month</p>
              <div className="lp-plan__lines">
                {pricing.pro.lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
                <span>Or ${pricing.pro.priceYear} a year.</span>
              </div>
              {/* Through login: /billing throws for signed-out visitors rather than redirecting. */}
              <Link href="/login?next=/billing" className="lp-btn lp-btn--solid" data-fill>
                <span className="lp-btn__fill" aria-hidden="true" />
                Get Pro
                <Arrow />
              </Link>
            </div>

            <div className="lp-plan lp-plan--soon" data-reveal="up" data-delay="0.16">
              <h3 className="lp-h3">{pricing.studio.name}</h3>
              <p className="lp-plan__price lp-num">${pricing.studio.price}</p>
              <p className="lp-plan__renders">{pricing.studio.renders} posters a month</p>
              <div className="lp-plan__lines">
                {pricing.studio.lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
              <p className="lp-label">Not open yet</p>
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section className="lp-section lp-section--tight lp-shell lp-on-paper">
          <div className="lp-section__head">
            <h2 className="lp-h2" data-split="lines">
              Fair questions.
            </h2>
          </div>
          <div className="lp-faq">
            {faq.map((item) => (
              <div className="lp-faq__item" key={item.q} data-reveal="up">
                <h3 className="lp-h3">{item.q}</h3>
                <p className="lp-body">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="lp-footer">
        <div className="lp-shell">
          <p className="lp-display lp-footer__mark" data-reveal="clip">
            {site.name}
          </p>
          <div className="lp-footer__cols">
            <div className="lp-footer__links">
              <Link href="/guides" className="lp-util">
                Guides
              </Link>
              <Link href="/privacy" className="lp-util">
                Privacy
              </Link>
              <Link href="/terms" className="lp-util">
                Terms
              </Link>
              <Link href="/login" className="lp-util">
                Sign in
              </Link>
            </div>
            <p className="lp-label">Prices read from the live plan config.</p>
          </div>

          {/* Colophon: the example photography is free-license and credited, and every
              poster brand on this page is invented. Both get replaced with real work. */}
          <p className="lp-colophon">
            Example posters use photographs by{' '}
            {photoCredits.map((c, i) => (
              <span key={c.href}>
                <a className="lp-link" href={c.href} target="_blank" rel="noreferrer noopener">
                  {c.author}
                </a>
                {i < photoCredits.length - 1 ? ', ' : ' '}
              </span>
            ))}
            on Unsplash. The brands are invented and the work is a placeholder.
          </p>
        </div>
      </footer>
    </div>
  );
}
