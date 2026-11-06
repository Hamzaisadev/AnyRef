'use client';

import React, { useRef } from 'react';
import { SectionShell } from './shared/SectionShell';
import { MagneticButton } from './shared/MagneticButton';
import { useReveal } from './hooks/useReveal';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { Check, Sparkles, Clock, ArrowRight } from 'lucide-react';

interface PricingProps {
  showPrices?: boolean;
}

export function Pricing({ showPrices = false }: PricingProps) {
  const { pricing } = LANDING_CONTENT;
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useReveal({
    triggerRef: sectionRef,
    targetsSelector: '.pricing-card',
    stagger: 0.15,
  });

  return (
    <div ref={sectionRef} className="w-full">
      <SectionShell
        id="pricing"
        theme="ink"
        eyebrow={pricing.eyebrow}
        h2={pricing.h2}
        align="center"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {/* Card 1: Free (Available Now) */}
          <div className="pricing-card relative p-7 sm:p-8 rounded-3xl bg-[#141527] border border-white/15 shadow-xl hover:-translate-y-1.5 hover:border-[#4B2BFF]/60 hover:shadow-[0_20px_40px_rgba(75,43,255,0.25)] transition-all duration-300 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-tight font-black text-2xl sm:text-3xl text-white">
                  {pricing.freeCard.title}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#1E9E6A]/20 text-[#1E9E6A] border border-[#1E9E6A]/40 uppercase">
                  ACTIVE NOW
                </span>
              </div>

              <p className="text-xs sm:text-sm font-sans text-[#9AA0AE] mb-6 leading-relaxed">
                {pricing.freeCard.subline}
              </p>

              {/* Price display: 100% Free */}
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-tight font-black text-3xl sm:text-4xl text-white">
                    $0
                  </span>
                  <span className="font-mono text-xs text-[#9AA0AE]">
                    / forever
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#1E9E6A] block mt-1">
                  No credit card required
                </span>
              </div>

              {/* Features List */}
              <ul className="space-y-3 text-xs sm:text-sm font-mono text-slate-200 mb-6">
                {pricing.freeCard.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <Check className="w-4 h-4 text-[#1E9E6A] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <MagneticButton
                href={pricing.freeCard.cta.href}
                variant="primary"
                size="md"
                className="w-full text-center"
              >
                <span>{pricing.freeCard.cta.label}</span>
                <ArrowRight className="w-4 h-4 ml-2 text-[#FF8A3D]" />
              </MagneticButton>
            </div>
          </div>

          {/* Card 2: Pro (Coming Soon) */}
          <div className="pricing-card relative p-7 sm:p-8 rounded-3xl bg-[#121324] border-2 border-[#4B2BFF]/50 shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between text-left overflow-hidden">
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none p-px bg-gradient-to-br from-[#4B2BFF]/40 via-transparent to-[#FF8A3D]/20"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="font-tight font-black text-2xl sm:text-3xl text-white">
                  {pricing.proCard.title}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white/70 border border-white/15 uppercase flex items-center space-x-1.5">
                  <Clock className="w-3 h-3 text-[#FF8A3D]" />
                  <span>COMING SOON</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm font-sans text-[#9AA0AE] mb-6 leading-relaxed">
                {pricing.proCard.subline}
              </p>

              {/* Price display or Coming Soon */}
              <div className="mb-6 pb-6 border-b border-white/10">
                {showPrices ? (
                  <div className="flex items-baseline space-x-1.5">
                    <span className="font-tight font-black text-3xl sm:text-4xl text-white">
                      ${pricing.proCard.priceMonth}
                    </span>
                    <span className="font-mono text-xs text-[#9AA0AE]">
                      / month
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline space-x-1.5">
                    <span className="font-tight font-black text-2xl sm:text-3xl text-white/70">
                      Pro Tier
                    </span>
                  </div>
                )}
                <span className="text-[11px] font-mono text-[#9AA0AE] block mt-1">
                  {showPrices ? 'Billed monthly or annually' : 'Pricing announced upon general availability'}
                </span>
              </div>

              {/* Bullets */}
              <ul className="space-y-3 text-xs sm:text-sm font-mono text-slate-300 mb-6">
                {pricing.proCard.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-[#FF8A3D] shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 pt-4">
              <MagneticButton
                variant="disabled"
                disabled={true}
                size="md"
                className="w-full text-center"
              >
                <span>{pricing.proCard.buttonLabel}</span>
              </MagneticButton>
            </div>
          </div>

          {/* Card 3: Studio (Coming Soon) */}
          <div className="pricing-card relative p-7 sm:p-8 rounded-3xl bg-[#121324] border border-white/10 shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between text-left overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="font-tight font-black text-2xl sm:text-3xl text-white">
                  {pricing.studioCard.title}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white/70 border border-white/15 uppercase flex items-center space-x-1.5">
                  <Clock className="w-3 h-3 text-[#FF8A3D]" />
                  <span>COMING SOON</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm font-sans text-[#9AA0AE] mb-6 leading-relaxed">
                {pricing.studioCard.subline}
              </p>

              {/* Price display or Coming Soon */}
              <div className="mb-6 pb-6 border-b border-white/10">
                {showPrices ? (
                  <div className="flex items-baseline space-x-1.5">
                    <span className="font-tight font-black text-3xl sm:text-4xl text-white">
                      ${pricing.studioCard.priceMonth}
                    </span>
                    <span className="font-mono text-xs text-[#9AA0AE]">
                      / month
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline space-x-1.5">
                    <span className="font-tight font-black text-2xl sm:text-3xl text-white/70">
                      Studio Tier
                    </span>
                  </div>
                )}
                <span className="text-[11px] font-mono text-[#9AA0AE] block mt-1">
                  {showPrices ? 'Billed monthly or annually' : 'Pricing announced upon general availability'}
                </span>
              </div>

              {/* Bullets */}
              <ul className="space-y-3 text-xs sm:text-sm font-mono text-slate-300 mb-6">
                {pricing.studioCard.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-[#FF8A3D] shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 pt-4">
              <MagneticButton
                variant="disabled"
                disabled={true}
                size="md"
                className="w-full text-center"
              >
                <span>{pricing.studioCard.buttonLabel}</span>
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* Note Below Pricing */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm font-mono text-[#9AA0AE] leading-relaxed">
            &bull; {pricing.noteBelow}
          </p>
        </div>
      </SectionShell>
    </div>
  );
}
