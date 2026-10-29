'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export interface AdSlotProps {
  name: 'library-sidebar' | 'library-bottom' | 'generating-interstitial';
  showAds?: boolean;
  adsEnabledGlobal?: boolean;
  className?: string;
}

export function AdSlot({
  name,
  showAds = true,
  adsEnabledGlobal = true,
  className = '',
}: AdSlotProps) {
  const [hasConsent, setHasConsent] = useState(true);

  useEffect(() => {
    // Check local consent storage
    const consent = localStorage.getItem('anyref_ad_consent');
    if (consent === 'denied') {
      setHasConsent(false);
    }
  }, []);

  // Staff and Plus never see ads; return null with zero layout shift
  if (!showAds || !adsEnabledGlobal || !hasConsent) {
    return null;
  }

  // Define static heights to prevent Cumulative Layout Shift (CLS < 0.1)
  const slotDimensions =
    name === 'library-sidebar'
      ? 'w-full min-h-[250px] h-[250px]'
      : name === 'generating-interstitial'
      ? 'w-full max-w-md min-h-[200px] h-[200px]'
      : 'w-full min-h-[90px] h-[90px]';

  return (
    <div
      data-ad-slot={name}
      aria-label="Advertisement"
      className={`rounded-2xl border border-border-subtle bg-surface-muted flex flex-col items-center justify-center p-4 relative overflow-hidden text-center ${slotDimensions} ${className}`}
    >
      {/* Top micro banner */}
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[10px] text-layout-layer font-sans">
        <span className="uppercase tracking-wider font-semibold">Sponsored</span>
        <Link
          href="/billing"
          className="hover:text-primary transition-colors flex items-center space-x-1"
        >
          <Sparkles className="w-2.5 h-2.5 text-primary" />
          <span>Remove ads with Plus</span>
        </Link>
      </div>

      {/* Ad creative container */}
      <div className="my-auto space-y-1.5 px-4">
        <div className="text-xs font-semibold text-ink">
          Empower Your Creative Production
        </div>
        <p className="text-[11px] text-layout-layer max-w-xs">
          High-performance AI visual design workflows for modern teams.
        </p>
      </div>

      <div className="absolute bottom-1 text-[9px] text-layout-layer">
        Ad choices • Privacy
      </div>
    </div>
  );
}
