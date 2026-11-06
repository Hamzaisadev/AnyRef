'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SectionShell } from './shared/SectionShell';
import { Chip } from './shared/Chip';
import { PosterArt } from './shared/PosterArt';
import { PromptBlock } from './shared/PromptBlock';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { Sparkles, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function Brands() {
  const { brands } = LANDING_CONTENT;
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const draftContainerRef = useRef<HTMLDivElement | null>(null);

  // Left Demo: Describe-it state
  const [draftRevealed, setDraftRevealed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState(brands.describeDemo.inputSample);

  // Right Demo: Brand Switcher state
  const [selectedBrand, setSelectedBrand] = useState<'brandA' | 'brandB'>('brandA');

  const brandConfigs = {
    brandA: {
      name: 'Aura Acoustics',
      tag: 'Example brand A',
      wordmark: 'AURA',
      palette: {
        primary: '#4B2BFF',
        secondary: '#2B7BFF',
        accent: '#FF8A3D',
        bg: '#0B0C18',
      },
      headline: 'SPATIAL SOUND 360°',
      offer: 'PRE-ORDER SAVE 25%',
      footer: 'PROUDLY ENGINEERED IN STOCKHOLM',
      promptHeadline: 'spatial acoustic studio monitor with diffuse floating soundwaves',
    },
    brandB: {
      name: 'Solaris Kinetics',
      tag: 'Example brand B',
      wordmark: 'SOLARIS',
      palette: {
        primary: '#00D18F',
        secondary: '#38BDF8',
        accent: '#F59E0B',
        bg: '#06131A',
      },
      headline: 'CLEAN KINETIC ENERGY',
      offer: 'LAUNCH EDITION RESERVE',
      footer: 'NEXT-GENERATION RENEWABLE ARCHITECTURE',
      promptHeadline: 'aerodynamic kinetic solar cell generator glowing with emerald aurora',
    },
  };

  const activeBrandData = brandConfigs[selectedBrand];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        setDraftRevealed(true);
        return;
      }

      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        once: true,
        onEnter: () => {
          setDraftRevealed(true);
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  function handleTriggerDraft() {
    setDraftRevealed(false);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setDraftRevealed(true);
    }, 400);
  }

  return (
    <div ref={sectionRef} className="w-full">
      <SectionShell
        id="brands"
        theme="ink"
        eyebrow={brands.eyebrow}
        h2={brands.h2}
        intro={brands.intro}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column (6/12): Describe-it Demo */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#121324] border border-white/10 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-[#FF8A3D] uppercase font-bold">
                  DESCRIBE-IT STUDIO (ENGLISH / ROMAN URDU)
                </span>
                <span className="text-[10px] font-mono text-white/50">Example brand</span>
              </div>

              {/* Textarea Input Simulation */}
              <div className="relative">
                <textarea
                  readOnly
                  rows={3}
                  value={typedText}
                  className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs sm:text-sm text-white resize-none focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTriggerDraft}
                  className="mt-2 w-full py-2 px-4 rounded-xl bg-[#4B2BFF]/20 hover:bg-[#4B2BFF]/30 border border-[#4B2BFF]/40 text-xs font-mono font-bold text-white flex items-center justify-center space-x-2 transition-all active:scale-98"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTyping ? 'animate-spin' : ''}`} />
                  <span>Create brand draft</span>
                </button>
              </div>
            </div>

            {/* Extracted Fields with Source Badges */}
            <div
              ref={draftContainerRef}
              className={`space-y-2.5 transition-opacity duration-500 ${
                draftRevealed ? 'opacity-100' : 'opacity-20 pointer-events-none'
              }`}
            >
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-[#9AA0AE]">Brand Name</span>
                <span className="font-bold text-white">Fajar Candles</span>
                <Chip type="brand" source="You said">You said</Chip>
              </div>

              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-[#9AA0AE]">Category</span>
                <span className="font-bold text-white">Organic Soy Candles</span>
                <Chip type="brand" source="Inferred">Inferred</Chip>
              </div>

              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-[#9AA0AE]">Tone &amp; Mood</span>
                <span className="font-bold text-white">Warm, Earthy, Meditative</span>
                <Chip type="brand" source="Suggested">Suggested</Chip>
              </div>

              {/* Color Swatches */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-[#9AA0AE]">Hex Palette</span>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#C87D55] border border-white/20" title="#C87D55 Terracotta" />
                  <span className="w-5 h-5 rounded-full bg-[#EADCC9] border border-white/20" title="#EADCC9 Warm Sand" />
                  <span className="w-5 h-5 rounded-full bg-[#26382B] border border-white/20" title="#26382B Forest Moss" />
                </div>
                <Chip type="brand" source="Suggested">Suggested</Chip>
              </div>

              {/* Honest Needs You Field */}
              <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20 flex items-center justify-between text-xs font-mono">
                <span className="text-[#9AA0AE]">Contact &amp; Store Address</span>
                <span className="text-amber-300 font-bold">[NOT PROVIDED]</span>
                <Chip type="campaign" source="Needs you" isLocked={true}>Needs you</Chip>
              </div>
            </div>

            <p className="text-xs font-mono text-[#9AA0AE] pt-2 border-t border-white/10">
              &bull; {brands.describeDemo.caption}
            </p>
          </div>

          {/* Right Column (6/12): Multi-Brand Switcher & Re-Theming Demo */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#121324] border border-white/10 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-[#2B7BFF] uppercase font-bold">
                  MULTI-BRAND RE-THEMING
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white">
                  {brands.brandSwitcher.demoLabel}
                </span>
              </div>

              {/* Brand Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedBrand('brandA')}
                  className={`py-2 px-3 rounded-lg font-mono text-xs transition-all ${
                    selectedBrand === 'brandA'
                      ? 'bg-[#4B2BFF] text-white font-bold shadow-md'
                      : 'text-[#9AA0AE] hover:text-white'
                  }`}
                >
                  Example brand A: Aura
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBrand('brandB')}
                  className={`py-2 px-3 rounded-lg font-mono text-xs transition-all ${
                    selectedBrand === 'brandB'
                      ? 'bg-[#00D18F] text-[#0F1020] font-bold shadow-md'
                      : 'text-[#9AA0AE] hover:text-white'
                  }`}
                >
                  Example brand B: Solaris
                </button>
              </div>
            </div>

            {/* Poster Stage Preview for Active Brand */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <PosterArt
                brandName={activeBrandData.wordmark}
                headline={activeBrandData.headline}
                offer={activeBrandData.offer}
                cta="RESERVE NOW"
                palette={activeBrandData.palette}
                productShape={selectedBrand === 'brandA' ? 'square' : 'wide'}
              />

              <div className="space-y-3 text-left max-w-xs font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#9AA0AE] uppercase">Active Palette</span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-white/30"
                      style={{ backgroundColor: activeBrandData.palette.primary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white/30"
                      style={{ backgroundColor: activeBrandData.palette.secondary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white/30"
                      style={{ backgroundColor: activeBrandData.palette.accent }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#9AA0AE] uppercase">Footer Line</span>
                  <p className="text-[11px] text-white truncate">{activeBrandData.footer}</p>
                </div>
              </div>
            </div>

            {/* Filled Prompt with Text Roll */}
            <div className="text-left">
              <PromptBlock
                text={`Commercial poster for {{brand}}, ${activeBrandData.promptHeadline}, clean typographic layout, high fidelity.`}
                slotMap={{
                  brand: { value: activeBrandData.name, type: 'brand' },
                }}
                allowCopy={true}
              />
            </div>

            {/* Supporting Line */}
            <p className="text-xs font-mono text-[#9AA0AE] pt-2 border-t border-white/10">
              {brands.brandSwitcher.supportingLine}
            </p>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
