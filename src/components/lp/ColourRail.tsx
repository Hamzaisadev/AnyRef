'use client';

/**
 * The signature moment.
 *
 * Five brand inks. Pick one and the page floods: the hero field, the posters, the steps
 * section, the Pro card and the footer all change together, because they all read the same
 * CSS variable written by the driver (src/motion/brand.ts).
 *
 * The claim "your brand, every post" stops being a claim and becomes a demonstration.
 */
import { useEffect, useState } from 'react';
import { INKS } from '@/data/landing';
import { onBrandChange, setBrand } from '@/motion/brand';

export function ColourRail() {
  const [active, setActive] = useState(0);

  // The driver is the single source of truth; this mirrors it for rendering.
  useEffect(() => onBrandChange((s) => setActive(s.index)), []);

  return (
    <div className="lp-rail">
      <p className="lp-label" id="rail-label">
        Try a brand colour
      </p>
      <div className="lp-rail__chips" role="group" aria-labelledby="rail-label">
        {INKS.map((ink, i) => (
          <button
            key={ink.name}
            type="button"
            className="lp-chip"
            style={{ background: ink.field }}
            aria-pressed={i === active}
            aria-label={`Use the ${ink.name} brand colour`}
            onClick={() => setBrand(i)}
          />
        ))}
      </div>
    </div>
  );
}
