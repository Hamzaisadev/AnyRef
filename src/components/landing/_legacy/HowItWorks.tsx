'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { SectionShell } from './shared/SectionShell';
import { Chip } from './shared/Chip';
import { PosterArt } from './shared/PosterArt';
import { PromptBlock } from './shared/PromptBlock';
import { Pill } from './shared/Pill';
import { MagneticButton } from './shared/MagneticButton';
import { useStepsStage } from './hooks/useStepsStage';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { Check, Copy, Sparkles, Layers, ArrowRight, ExternalLink } from 'lucide-react';

export function HowItWorks() {
  const { howItWorks } = LANDING_CONTENT;
  const pinSectionRef = useRef<HTMLDivElement | null>(null);
  const stageCardRef = useRef<HTMLDivElement | null>(null);

  const { activeStep, setActiveStep } = useStepsStage({
    pinSectionRef,
    stageCardRef,
  });

  // Stage 3 interactive input state
  const [headlineInput, setHeadlineInput] = useState('SOY CANDLES 2026');
  const [offerInput, setOfferInput] = useState('BUY 2 GET 1 FREE');

  // Stage 4 checklist state
  const [attachedItems, setAttachedItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false,
  });

  return (
    <div ref={pinSectionRef} className="w-full">
      <SectionShell
        id="how-it-works"
        theme="ink"
        eyebrow={howItWorks.eyebrow}
        h2={howItWorks.h2}
        className="min-h-screen flex flex-col justify-center"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column (4/12): Vertical Step List with Progress Bar */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div className="relative pl-6 space-y-8">
              {/* Vertical Progress Rail */}
              <div
                className="absolute left-2 top-3 bottom-3 w-0.5 bg-white/10"
                aria-hidden="true"
              >
                <div
                  className="w-full bg-[#4B2BFF] transition-all duration-300"
                  style={{
                    height: `${((activeStep + 1) / 4) * 100}%`,
                  }}
                />
              </div>

              {/* Step Navigation Buttons */}
              {howItWorks.steps.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <button
                    key={step.stepNumber}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`relative w-full text-left transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2BFF] rounded-xl p-2 ${
                      isActive ? 'opacity-100' : 'opacity-40 hover:opacity-75'
                    }`}
                  >
                    {/* Node Dot on rail */}
                    <div
                      className={`absolute -left-[23px] top-3.5 w-3 h-3 rounded-full border-2 transition-all ${
                        isActive
                          ? 'bg-[#4B2BFF] border-white scale-125'
                          : 'bg-[#0F1020] border-white/40'
                      }`}
                    />

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#FF8A3D]">
                          {step.stepNumber}
                        </span>
                        <h3 className="font-tight font-bold text-lg sm:text-xl text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm font-sans text-[#9AA0AE] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* End of Steps CTA */}
            <div className="pt-4">
              <MagneticButton href={howItWorks.cta.href} variant="primary" size="md">
                <span>{howItWorks.cta.label}</span>
                <ArrowRight className="w-4 h-4 ml-2 text-[#FF8A3D]" />
              </MagneticButton>
            </div>
          </div>

          {/* Right Column (8/12): Morphing Stage Card */}
          <div className="lg:col-span-8 w-full flex items-center justify-center">
            <div
              ref={stageCardRef}
              className="relative w-full max-w-[700px] min-h-[480px] p-6 sm:p-8 rounded-3xl bg-[#141527] border border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Stage Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs font-mono text-[#9AA0AE]">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4B2BFF]" />
                  <span>
                    STAGE // STEP {howItWorks.steps[activeStep]?.stepNumber ?? 1}: {(howItWorks.steps[activeStep]?.title ?? '').toUpperCase()}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white">
                  LIVE SIMULATION
                </span>
              </div>

              {/* Stage Morphing Content */}
              <div className="relative py-6 flex-1 flex flex-col justify-center">
                {/* STEP 1: Set up your brand */}
                {activeStep === 0 && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-[#9AA0AE]">
                        Describe your business:
                      </label>
                      <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-white leading-relaxed">
                        &quot;We sell handmade soy candles in warm, earthy terracotta jars with wood wicks and natural botanicals.&quot;
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-mono tracking-widest text-[#2B7BFF] uppercase">
                        Extracted Brand DNA Fields:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                          <span className="text-[10px] font-mono text-[#9AA0AE] block">Wordmark</span>
                          <span className="font-mono text-xs font-bold text-white">FAJAR</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                          <span className="text-[10px] font-mono text-[#9AA0AE] block">Palette</span>
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#D48152]" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#F4EDE4]" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#2B3A2C]" />
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                          <span className="text-[10px] font-mono text-[#9AA0AE] block">Tone</span>
                          <span className="font-mono text-xs text-white">Warm &amp; Earthy</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Drop in a reference */}
                {activeStep === 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in duration-500">
                    <div className="relative">
                      <PosterArt
                        brandName="EXAMPLE BRAND"
                        headline="REFERENCE POSTER"
                        showAnnotations={true}
                        productShape="tall"
                        palette={{
                          primary: '#4B2BFF',
                          secondary: '#2B7BFF',
                          accent: '#FF8A3D',
                          bg: '#0F1020',
                        }}
                      />
                    </div>
                    <div className="space-y-3 text-left max-w-xs">
                      <span className="text-xs font-mono text-[#FF8A3D] uppercase font-bold tracking-wider">
                        Deconstruction Analysis:
                      </span>
                      <ul className="space-y-2 text-xs font-mono text-[#9AA0AE]">
                        <li className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2B7BFF]" />
                          <span>Layout: 4:5 Portrait Grid</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A3D]" />
                          <span>Lighting: Soft Rim Studio</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E9E6A]" />
                          <span>Typography: Bold Header + Badge</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                          <span>Artwork: 100% Brand-Isolated</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* STEP 3: Fill the blanks */}
                {activeStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-500 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className="text-[#2B7BFF] font-bold">Headline slot</span>
                          <span className={headlineInput.length > 20 ? 'text-[#FF8A3D]' : 'text-[#9AA0AE]'}>
                            {headlineInput.length}/24 chars
                          </span>
                        </div>
                        <input
                          type="text"
                          value={headlineInput}
                          onChange={(e) => setHeadlineInput(e.target.value)}
                          maxLength={24}
                          className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#4B2BFF]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className="text-[#FF8A3D] font-bold">Offer slot</span>
                          <span className="text-[#9AA0AE]">{offerInput.length}/20 chars</span>
                        </div>
                        <input
                          type="text"
                          value={offerInput}
                          onChange={(e) => setOfferInput(e.target.value)}
                          maxLength={20}
                          className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#4B2BFF]"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] font-mono text-[#9AA0AE] uppercase block mb-1">
                        Compiled Live Prompt:
                      </span>
                      <PromptBlock
                        text={`Commercial editorial poster for {{brand}}, bold modern typography reading "${headlineInput}", special promotional tag "${offerInput}", soft diffuse studio lighting, 4:5 aspect ratio.`}
                        slotMap={{
                          brand: { value: 'FAJAR', type: 'brand' },
                        }}
                        allowCopy={false}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: Generate, compare, save */}
                {activeStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-500 text-left">
                    {/* Attach Order Checklist */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                      <span className="text-[10px] font-mono text-[#9AA0AE] uppercase tracking-wider block">
                        Attach in this exact order:
                      </span>
                      <div className="flex flex-wrap gap-2 text-xs font-mono">
                        {['1. Layout Reference', '2. Product Photo', '3. Color Swatch'].map((item, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setAttachedItems((prev) => ({ ...prev, [i]: !prev[i] }))
                            }
                            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                              attachedItems[i]
                                ? 'bg-[#1E9E6A]/20 border-[#1E9E6A]/40 text-[#1E9E6A]'
                                : 'bg-white/5 border-white/10 text-[#9AA0AE]'
                            }`}
                          >
                            <span className="text-[11px]">{attachedItems[i] ? '✓' : '○'}</span>
                            <span>{item}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Side-by-Side Compare & Winner Tag */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/50 border border-white/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-16 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-[9px] font-mono text-center text-[#9AA0AE]">
                          Reference
                        </div>
                        <span className="text-white font-mono text-sm">&rarr;</span>
                        <div className="w-12 h-16 rounded-md bg-[#4B2BFF]/20 border border-[#4B2BFF]/50 flex items-center justify-center text-[9px] font-mono text-center text-white">
                          Your Result
                        </div>
                      </div>

                      <div className="space-y-1 text-right">
                        <Pill variant="winner" size="sm">
                          Winner Saved
                        </Pill>
                        <p className="text-[10px] font-mono text-[#9AA0AE]">
                          Zero-Cost Reuse Ready
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stage Bottom Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#9AA0AE]">
                <span>No API tokens spent on template reuse.</span>
                <span className="text-white font-bold">Step {activeStep + 1} of 4</span>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
