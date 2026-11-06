'use client';

import React, { useState, useRef } from 'react';
import { SectionShell } from './shared/SectionShell';
import { Chip } from './shared/Chip';
import { PromptBlock } from './shared/PromptBlock';
import { Pill } from './shared/Pill';
import { useReveal } from './hooks/useReveal';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { Lock, AlertTriangle, Check, ShieldCheck, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

export function Guardrails() {
  const { guardrails } = LANDING_CONTENT;
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useReveal({
    triggerRef: sectionRef,
    targetsSelector: '.bento-tile',
    stagger: 0.1,
  });

  // Tile A: Live slot counter & input
  const [headlineVal, setHeadlineVal] = useState('SOLARIS HORIZON');
  const headlineMax = 18;

  // Tile B: Autofill toggle & Never-invent lock
  const [autofillActive, setAutofillActive] = useState(false);

  // Tile C: Silhouette fit selector (wide vs tall vs square)
  const [selectedProduct, setSelectedProduct] = useState<'wide' | 'tall' | 'square'>('tall');

  // Tile D: Attach in order checklist
  const [tickedImages, setTickedImages] = useState<Record<number, boolean>>({
    0: true,
    1: false,
  });

  return (
    <div ref={sectionRef} className="w-full">
      <SectionShell
        id="guardrails"
        theme="paper"
        eyebrow={guardrails.eyebrow}
        h2={guardrails.h2}
        intro={guardrails.intro}
      >
        {/* Bento Grid: Row 1 (7/12 + 5/12), Row 2 (5/12 + 7/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tile A (Large, 7/12): A form that writes itself */}
          <div className="bento-tile lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white border border-[#0F1020]/10 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-[#4B2BFF] uppercase font-bold">
                TYPED BOUNDARIES // STRICT FIT
              </span>
              <h3 className="font-tight font-bold text-xl sm:text-2xl text-[#0F1020]">
                {guardrails.tiles.formWritesItself.title}
              </h3>
              <p className="text-xs sm:text-sm font-sans text-[#5A6070] leading-relaxed">
                {guardrails.tiles.formWritesItself.description}
              </p>
            </div>

            {/* Interactive Mini Form with 5 Mixed Slot Types */}
            <div className="my-5 p-4 sm:p-5 rounded-2xl bg-[#F7F6F2] border border-[#0F1020]/10 space-y-3">
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="font-semibold text-[#0F1020]">Headline slot (short text)</span>
                  <span
                    className={`font-bold transition-colors ${
                      headlineVal.length > headlineMax ? 'text-[#FF8A3D]' : 'text-[#5A6070]'
                    }`}
                  >
                    {headlineVal.length}/{headlineMax} chars
                    {headlineVal.length > headlineMax && ' (Layout fit warning)'}
                  </span>
                </div>
                <input
                  type="text"
                  value={headlineVal}
                  onChange={(e) => setHeadlineVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#0F1020]/15 text-[#0F1020] font-mono text-xs focus:outline-none focus:border-[#4B2BFF]"
                  placeholder="Enter headline..."
                />
              </div>

              {/* Other mixed slots */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded-lg bg-white border border-[#0F1020]/10">
                  <span className="text-[10px] text-[#5A6070] block">Price slot</span>
                  <span className="font-bold text-[#0F1020]">$149.00</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#0F1020]/10">
                  <span className="text-[10px] text-[#5A6070] block">Date slot</span>
                  <span className="font-bold text-[#0F1020]">NOV 12</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#0F1020]/10">
                  <span className="text-[10px] text-[#5A6070] block">Color slot</span>
                  <span className="font-bold text-[#2B7BFF]">Sapphire</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#0F1020]/10">
                  <span className="text-[10px] text-[#5A6070] block">Attachment</span>
                  <span className="font-bold text-[#1E9E6A]">photo.png</span>
                </div>
              </div>
            </div>

            {/* Prompt preview */}
            <div className="text-left">
              <span className="text-[10px] font-mono text-[#5A6070] uppercase block mb-1">
                Live Prompt Binding:
              </span>
              <div className="p-3 rounded-xl bg-white border border-[#0F1020]/10 font-mono text-xs text-[#0F1020]">
                Commercial poster with headline &quot;
                <span className="font-bold text-[#4B2BFF]">{headlineVal}</span>&quot;
                at price $149.00, sapphire accents.
              </div>
            </div>
          </div>

          {/* Tile B (5/12): Never invented */}
          <div className="bento-tile lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border border-[#0F1020]/10 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-[#FF8A3D] uppercase font-bold">
                ANTI-HALLUCINATION GUARD
              </span>
              <h3 className="font-tight font-bold text-xl sm:text-2xl text-[#0F1020]">
                {guardrails.tiles.neverInvented.title}
              </h3>
              <p className="text-xs sm:text-sm font-sans text-[#5A6070] leading-relaxed">
                {guardrails.tiles.neverInvented.description}
              </p>
            </div>

            {/* Interactive Toggle */}
            <div className="my-5 p-4 rounded-2xl bg-[#F7F6F2] border border-[#0F1020]/10 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#0F1020]">
                  Autofill from product photo
                </span>
                <button
                  type="button"
                  onClick={() => setAutofillActive(!autofillActive)}
                  className="flex items-center space-x-1.5 focus:outline-none"
                  aria-label="Toggle autofill from product photo"
                >
                  {autofillActive ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#1E9E6A] text-white">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-300 text-slate-700">
                      OFF
                    </span>
                  )}
                </button>
              </div>

              {/* Slot results */}
              <div className="space-y-2 pt-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#0F1020]/10">
                  <span className="text-[#5A6070]">Headline:</span>
                  <span className="font-bold text-[#0F1020]">
                    {autofillActive ? 'Organic Honeycomb Soap' : '—'}
                  </span>
                  {autofillActive && <Chip type="campaign" source="Inferred">Photo</Chip>}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#0F1020]/10">
                  <span className="text-[#5A6070]">Price:</span>
                  <span className="font-bold text-[#0F1020]">[EMPTY]</span>
                  <Chip type="campaign" source="Needs you" isLocked={true}>
                    Never invented
                  </Chip>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#0F1020]/10">
                  <span className="text-[#5A6070]">Discount:</span>
                  <span className="font-bold text-[#0F1020]">[EMPTY]</span>
                  <Chip type="campaign" source="Needs you" isLocked={true}>
                    Never invented
                  </Chip>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-mono text-[#5A6070]">
              <Lock className="w-3.5 h-3.5 text-[#FF8A3D]" />
              <span>Programmatic verification halts hallucination.</span>
            </div>
          </div>

          {/* Tile C (5/12): Layout-fit warning */}
          <div className="bento-tile lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border border-[#0F1020]/10 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-[#2B7BFF] uppercase font-bold">
                ASPECT RATIO PROTECTION
              </span>
              <h3 className="font-tight font-bold text-xl sm:text-2xl text-[#0F1020]">
                {guardrails.tiles.layoutFitWarning.title}
              </h3>
              <p className="text-xs sm:text-sm font-sans text-[#5A6070] leading-relaxed">
                {guardrails.tiles.layoutFitWarning.description}
              </p>
            </div>

            {/* Silhouette Selector */}
            <div className="my-5 p-4 rounded-2xl bg-[#F7F6F2] border border-[#0F1020]/10 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#5A6070]">Template target:</span>
                <span className="font-bold text-[#0F1020]">WIDE HORIZONTAL (16:9)</span>
              </div>

              {/* Product buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { shape: 'wide', label: 'Wide Watch', aspect: '16:9', fits: true },
                  { shape: 'tall', label: 'Tall Bottle', aspect: '9:16', fits: false },
                  { shape: 'square', label: 'Square Box', aspect: '1:1', fits: false },
                ].map((item) => (
                  <button
                    key={item.shape}
                    type="button"
                    onClick={() => setSelectedProduct(item.shape as any)}
                    className={`p-2.5 rounded-xl border text-center font-mono text-xs transition-all ${
                      selectedProduct === item.shape
                        ? 'bg-white border-[#4B2BFF] shadow-sm font-bold text-[#4B2BFF]'
                        : 'bg-white/60 border-transparent text-[#5A6070] hover:bg-white'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75">{item.aspect}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Warning Alert Chip */}
              {selectedProduct !== 'wide' ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2 text-xs font-mono text-amber-700 animate-in fade-in duration-300">
                  <AlertTriangle className="w-4 h-4 text-[#FF8A3D] shrink-0" />
                  <span>
                    Aspect mismatch: product shape will clip in 16:9 template.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-xs font-mono text-emerald-700">
                  <Check className="w-4 h-4 text-[#1E9E6A] shrink-0" />
                  <span>Perfect layout match. Zero crop distortion.</span>
                </div>
              )}
            </div>

            <div className="text-[11px] font-mono text-[#5A6070]">
              Detects layout distortion before you spend generation credits.
            </div>
          </div>

          {/* Tile D (Large, 7/12): Attach in order */}
          <div className="bento-tile lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white border border-[#0F1020]/10 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-[#1E9E6A] uppercase font-bold">
                MULTI-ASSET CHECKLIST
              </span>
              <h3 className="font-tight font-bold text-xl sm:text-2xl text-[#0F1020]">
                {guardrails.tiles.attachInOrder.title}
              </h3>
              <p className="text-xs sm:text-sm font-sans text-[#5A6070] leading-relaxed">
                {guardrails.tiles.attachInOrder.description}
              </p>
            </div>

            {/* Interactive Checklist with Connector Line */}
            <div className="my-5 p-4 sm:p-5 rounded-2xl bg-[#F7F6F2] border border-[#0F1020]/10 space-y-4">
              <div className="space-y-2.5">
                {[
                  {
                    idx: 0,
                    num: '1st',
                    label: 'reference_layout.png (Target framing & typography)',
                    targetText: 'first image reference_layout.png',
                  },
                  {
                    idx: 1,
                    num: '2nd',
                    label: 'product_cutout.png (Isolated product on transparent bg)',
                    targetText: 'second image product_cutout.png',
                  },
                ].map((item) => (
                  <button
                    key={item.idx}
                    type="button"
                    onClick={() =>
                      setTickedImages((prev) => ({ ...prev, [item.idx]: !prev[item.idx] }))
                    }
                    className={`w-full p-3 rounded-xl border text-left font-mono text-xs flex items-center justify-between transition-all ${
                      tickedImages[item.idx]
                        ? 'bg-white border-[#1E9E6A] text-[#0F1020] shadow-sm'
                        : 'bg-white/60 border-black/5 text-[#5A6070]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          tickedImages[item.idx]
                            ? 'bg-[#1E9E6A] text-white'
                            : 'border border-black/20 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span>
                        <strong className="text-[#4B2BFF]">{item.num} slot:</strong> {item.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#5A6070]">
                      {tickedImages[item.idx] ? 'Attached' : 'Click to attach'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Connecting prompt snippet */}
              <div className="p-3 rounded-xl bg-white border border-[#0F1020]/10 font-mono text-xs text-[#0F1020]">
                Prompt snippet: &quot;Maintain composition from{' '}
                <span className="bg-[#2B7BFF]/15 text-[#2B7BFF] px-1.5 py-0.5 rounded font-bold">
                  [1st image: layout]
                </span>{' '}
                and insert asset from{' '}
                <span className="bg-[#FF8A3D]/15 text-[#FF8A3D] px-1.5 py-0.5 rounded font-bold">
                  [2nd image: product]
                </span>
                ...&quot;
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#5A6070]">
              Engineered for Google Flow, Midjourney v6, and FLUX.1 multi-image prompting.
            </div>
          </div>
        </div>

        {/* Footer Note Under Grid */}
        <div className="mt-8 text-center">
          <p className="text-xs sm:text-sm font-mono text-[#5A6070]">
            &bull; {guardrails.footerNote}
          </p>
        </div>
      </SectionShell>
    </div>
  );
}
