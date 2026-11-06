'use client';

import React, { useRef } from 'react';
import { SectionShell } from './shared/SectionShell';
import { Chip } from './shared/Chip';
import { useProblemTimeline } from './hooks/useProblemTimeline';
import { LANDING_CONTENT } from '@/lib/landing/content';

export function Problem() {
  const { problem } = LANDING_CONTENT;
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);
  const mergedCardRef = useRef<HTMLDivElement | null>(null);
  const painItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useProblemTimeline({
    sectionRef,
    cardsContainerRef,
    mergedCardRef,
    painItemRefs,
  });

  // 12 chaotic note snippets (fictional, generic)
  const chaoticNotes = [
    { title: 'poster v3 FINAL', snippet: 'Midjourney --ar 4:5 modern watch neon blue typography...' },
    { title: 'watch sale, blue', snippet: 'clean geometric background with floating elements...' },
    { title: 'use this one??', snippet: 'bold sans headline with discount tag 20% off??' },
    { title: 'perfume prompt backup', snippet: 'glass bottle reflection amber tone editorial studio...' },
    { title: 'flux prompt test 2', snippet: 'commercial product photography cinematic lighting...' },
    { title: 'summer promo copy', snippet: 'headline: FLASH SALE? wait check dates with team' },
    { title: 'v2 do not delete', snippet: 'retro grid poster style typography on left corner...' },
    { title: 'shoe ad layout 4', snippet: 'sneaker floating high speed dynamic motion blur...' },
    { title: 'notes oct 14', snippet: 'what was that prompt with the circular badge again?' },
    { title: 'coffee campaign draft', snippet: 'warm earthy palette ceramic mug steam rising...' },
    { title: 'hero prompt working', snippet: 'keep wordmark on top right, no fake logo please' },
    { title: 'untitled note 42', snippet: 'copy from slack message: 15% discount code SAVE15' },
  ];

  return (
    <div ref={sectionRef} className="w-full">
      <SectionShell
        id="problem"
        theme="paper"
        eyebrow={problem.eyebrow}
        h2={problem.h2}
        intro={problem.intro}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column (5/12): Stacked Pain Points List */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              {problem.painPoints.map((item, idx) => (
                <div
                  key={item.id}
                  ref={(el) => {
                    painItemRefs.current[idx] = el;
                  }}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-[#0F1020]/10 shadow-sm transition-all duration-300"
                >
                  <div className="flex items-start space-x-3.5">
                    {/* Small Inline SVG Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[#4B2BFF]/10 border border-[#4B2BFF]/20 flex items-center justify-center text-[#4B2BFF] shrink-0 mt-0.5">
                      {idx === 0 && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      )}
                      {idx === 1 && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                      )}
                      {idx === 2 && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      )}
                    </div>

                    <div className="space-y-1 text-left">
                      <h3 className="font-tight font-bold text-base sm:text-lg text-[#0F1020]">
                        {item.title}
                      </h3>
                      <p className="text-sm font-sans text-[#5A6070] leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <span className="text-xs font-mono font-semibold tracking-wider text-[#4B2BFF] uppercase">
                &bull; 100% PROGRAMMATIC PRESERVATION
              </span>
            </div>
          </div>

          {/* Right Column (7/12): Chaotic Notes Stack to One Library Card */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[420px] sm:min-h-[480px]">
            {/* Chaotic Stack Container */}
            <div
              ref={cardsContainerRef}
              className="relative w-full max-w-[500px] h-[360px] flex items-center justify-center"
              aria-hidden="true"
            >
              {chaoticNotes.map((note, i) => (
                <div
                  key={i}
                  className="chaotic-note-card absolute w-60 sm:w-64 p-4 rounded-xl bg-white border border-[#0F1020]/15 shadow-md font-mono text-xs select-none pointer-events-none"
                  style={{
                    zIndex: i + 1,
                    top: `${18 + (i % 4) * 12}%`,
                    left: `${15 + (i % 5) * 10}%`,
                  }}
                >
                  {/* CSS Tape strip on some cards */}
                  {i % 3 === 0 && (
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-amber-100/80 border border-amber-300/40 rotate-[-4deg] opacity-75"
                      style={{ backdropFilter: 'blur(1px)' }}
                    />
                  )}

                  {/* Faint coffee ring on card #4 */}
                  {i === 4 && (
                    <div className="absolute top-2 right-2 w-12 h-12 rounded-full border-2 border-amber-800/15 pointer-events-none" />
                  )}

                  <div className="flex items-center justify-between pb-1.5 border-b border-[#0F1020]/10 text-[10px] text-[#5A6070] font-bold">
                    <span>{note.title}</span>
                    <span className="opacity-50">.txt</span>
                  </div>
                  <p className="mt-2 text-[11px] text-[#2D3139] leading-snug line-clamp-2">
                    {note.snippet}
                  </p>
                </div>
              ))}
            </div>

            {/* Organized Unified State Card: "One library" */}
            <div
              ref={mergedCardRef}
              className="absolute inset-0 max-w-[460px] mx-auto p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#4B2BFF] shadow-[0_15px_40px_rgba(75,43,255,0.18)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#0F1020]/10">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#1E9E6A]" />
                  <span className="font-tight font-bold text-lg text-[#0F1020]">
                    {problem.organizedTitle}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#4B2BFF]/10 text-[#4B2BFF] border border-[#4B2BFF]/20 uppercase">
                  UNIFIED
                </span>
              </div>

              <div className="py-4 space-y-3">
                <p className="text-xs font-mono text-[#5A6070]">
                  {problem.organizedSubtitle}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Chip type="brand" tag="wordmark">Aura Acoustics</Chip>
                  <Chip type="campaign" tag="offer">Save 25%</Chip>
                  <Chip type="layout" tag="ar">4:5 Poster</Chip>
                  <Chip type="brand" tag="palette">Earthy Sand</Chip>
                </div>
              </div>

              <div className="pt-3 border-t border-[#0F1020]/10 flex items-center justify-between text-xs font-mono text-[#5A6070]">
                <span>No lost prompts.</span>
                <span className="text-[#1E9E6A] font-bold">&check; Reusable forever</span>
              </div>
            </div>

            {/* Closing Line Under Visual */}
            <p className="mt-8 text-sm font-sans font-medium text-[#5A6070] italic">
              {problem.closingLine}
            </p>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
