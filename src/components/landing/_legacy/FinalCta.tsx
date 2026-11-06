'use client';

import React from 'react';
import { MagneticButton } from './shared/MagneticButton';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { ArrowRight, Sparkles } from 'lucide-react';

export function FinalCta() {
  const { finalCta } = LANDING_CONTENT;

  // Background floating chips data
  const backgroundChips = [
    { text: '{{headline}}', top: '15%', left: '8%', delay: '0s' },
    { text: '{{offer}}', top: '65%', left: '12%', delay: '2s' },
    { text: '{{cta}}', top: '25%', right: '10%', delay: '1s' },
    { text: '{{product}}', top: '75%', right: '14%', delay: '3s' },
    { text: '{{palette}}', top: '45%', left: '4%', delay: '1.5s' },
    { text: '{{wordmark}}', top: '50%', right: '5%', delay: '2.5s' },
  ];

  return (
    <section
      className="relative w-full py-24 sm:py-32 px-4 sm:px-6 md:px-12 bg-[#4B2BFF] text-[#0F1020] overflow-hidden select-none"
      aria-label="Final Call to Action"
    >
      {/* Drifting Background Chips Field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {backgroundChips.map((chip, idx) => (
          <div
            key={idx}
            className="absolute px-3 py-1.5 rounded-lg border border-[#0F1020]/20 bg-white/10 font-mono text-xs sm:text-sm font-bold text-[#0F1020]/40 shadow-sm animate-pulse"
            style={{
              top: chip.top,
              left: chip.left,
              right: chip.right,
              animationDuration: '6s',
              animationDelay: chip.delay,
            }}
          >
            {chip.text}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0F1020]/10 border border-[#0F1020]/15 text-[#0F1020] font-mono text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#FF8A3D]" />
          <span>START IN SECONDS &bull; NO SETUP REQUIRED</span>
        </div>

        <h2 className="font-tight font-black tracking-[-0.03em] leading-[1.05] text-[clamp(2.5rem,5.5vw,5rem)] text-[#0F1020]">
          {finalCta.h2}
        </h2>

        <p className="max-w-2xl mx-auto text-base sm:text-xl font-sans text-[#0F1020]/80 leading-relaxed font-medium">
          {finalCta.subline}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <MagneticButton
            href={finalCta.cta.href}
            size="lg"
            className="bg-[#0F1020] text-white hover:bg-[#1a1c35] border-[#0F1020] shadow-[0_12px_30px_rgba(15,16,32,0.4)]"
          >
            <span className="font-tight font-extrabold">{finalCta.cta.label}</span>
            <ArrowRight className="w-5 h-5 ml-2 text-[#FF8A3D]" />
          </MagneticButton>
        </div>

        <p className="text-xs font-mono text-[#0F1020]/60 pt-2">
          Free forever plan &bull; Instant access &bull; No credit card required
        </p>
      </div>
    </section>
  );
}
