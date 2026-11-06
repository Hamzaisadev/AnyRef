'use client';

import React from 'react';
import { AwwwardsHero } from '@/components/hero/AwwwardsHero';

/**
 * Section 1: Hero ("Poster to Slots" hero)
 * Integrated directly from the specialized Hero specification.
 */
export function Hero() {
  return (
    <div id="hero" className="relative w-full">
      <AwwwardsHero />
    </div>
  );
}

export default Hero;
