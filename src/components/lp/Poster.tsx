import Image from 'next/image';
import type { Poster as PosterData } from '@/data/landing';

/**
 * A poster: real product photography with the brand's type set over it, which is what
 * Anyref actually produces. Not a fake app screenshot built from divs.
 *
 * `tint` makes the poster follow the active brand ink instead of its own stored colours,
 * which is how the rail re-skins work across the page. The photograph stays; only the
 * brand layer changes, which is the product's whole premise.
 */
export function Poster({
  data,
  tint = false,
  priority = false,
  // Cards render ~280px wide on desktop and ~330px on a phone; requesting 24vw of a
  // 1440px viewport fetched nearly double the pixels actually used.
  sizes = '(max-width: 600px) 46vw, (max-width: 980px) 40vw, 300px',
  className = '',
}: {
  data: PosterData;
  tint?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const style = tint
    ? ({
        '--p-bg': 'var(--field-deep)',
        '--p-ink': 'var(--deep-ink)',
        '--p-accent': 'var(--field)',
      } as React.CSSProperties)
    : ({
        '--p-bg': data.bg,
        '--p-ink': data.ink,
        '--p-accent': data.accent,
      } as React.CSSProperties);

  return (
    <figure className={`lp-poster ${className}`} style={style} data-tint={tint ? 'true' : 'false'}>
      <Image
        className="lp-poster__img"
        src={data.src}
        alt={data.alt}
        fill
        sizes={sizes}
        style={{ objectPosition: data.focus }}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
      {/* Scrim: the type sits over photography, so it needs a guaranteed floor. */}
      <span className="lp-poster__scrim" aria-hidden="true" />

      <div className="lp-poster__top">
        <span className="lp-poster__brand">{data.brand}</span>
        <span className="lp-poster__kicker">{data.kicker}</span>
      </div>

      <p className="lp-poster__headline">{data.headline}</p>

      <figcaption className="lp-poster__foot">
        <span className="lp-poster__price">{data.price}</span>
        <span>{data.foot}</span>
      </figcaption>
    </figure>
  );
}
