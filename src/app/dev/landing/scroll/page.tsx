'use client';

import React, { useRef, useState } from 'react';
import { notFound } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ScrollProvider } from '@/components/landing/scroll/ScrollProvider';
import { useScroll } from '@/components/landing/scroll/useScroll';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  (window as any).ScrollTrigger = ScrollTrigger;
}

function ScrollDevContent() {
  const { scrollToId, scrollY, lenis } = useScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const pinSectionRef = useRef<HTMLDivElement>(null);
  const rotatingSquareRef = useRef<HTMLDivElement>(null);

  const [statusLog, setStatusLog] = useState<{
    scrollY: number;
    stCount: number;
    lenisStatus: string;
  }>({
    scrollY: 0,
    stCount: 0,
    lenisStatus: 'initializing',
  });

  // Progress bar scrubbed animation
  useGSAP(
    () => {
      if (!progressBarRef.current || !pageRef.current) return;

      gsap.to(progressBarRef.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: pageRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      });
    },
    { scope: pageRef }
  );

  // Pinned section with scrubbed rotating square
  useGSAP(
    () => {
      if (!pinSectionRef.current || !rotatingSquareRef.current) return;

      ScrollTrigger.create({
        trigger: pinSectionRef.current,
        start: 'top top',
        end: '+=100%',
        pin: true,
        scrub: true,
        animation: gsap.to(rotatingSquareRef.current, {
          rotation: 360,
          ease: 'none',
        }),
      });
    },
    { scope: pinSectionRef }
  );

  const handleUpdateStatus = () => {
    const currentScrollY = scrollY.current;
    const currentStCount = ScrollTrigger.getAll().length;
    const status = lenis ? 'active' : 'disabled (reduced-motion)';

    console.log(`[SCROLL STATUS] scrollY: ${currentScrollY}, ScrollTrigger count: ${currentStCount}, lenis: ${status}`);

    setStatusLog({
      scrollY: currentScrollY,
      stCount: currentStCount,
      lenisStatus: status,
    });
  };

  const blocks = [
    { id: 'block-1', label: '1', bg: 'bg-[#0F1020]', title: 'Block 1 - Intro' },
    { id: 'block-2', label: '2', bg: 'bg-[#171935]', title: 'Block 2 - Fluid Content' },
    { id: 'block-3', label: '3', bg: 'bg-[#1b1e42]', title: 'Block 3 - Pinned Section' },
    { id: 'block-4', label: '4', bg: 'bg-[#121429]', title: 'Block 4 - Anchor Target' },
    { id: 'block-5', label: '5', bg: 'bg-[#171935]', title: 'Block 5 - Inner Scroll' },
    { id: 'block-6', label: '6', bg: 'bg-[#0F1020]', title: 'Block 6 - Outro' },
  ];

  return (
    <div ref={pageRef} className="relative min-h-[600vh] bg-ink text-text-on-ink">
      <meta name="robots" content="noindex, nofollow" />

      {/* Fixed Top Nav Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[var(--nav-h)] bg-ink/90 backdrop-blur border-b border-border-subtle flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center space-x-2">
          <span className="font-display font-bold text-lg text-primary">Scroll Test</span>
        </div>

        {/* Anchor Links */}
        <nav className="flex items-center space-x-1 sm:space-x-3">
          {blocks.map((b) => (
            <a
              key={b.id}
              href={`#${b.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToId(b.id);
              }}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded hover:bg-surface border border-transparent hover:border-border-subtle transition-colors text-text-muted-on-ink hover:text-text-on-ink"
            >
              #{b.label}
            </a>
          ))}
        </nav>

        {/* Diagnostics & Log Trigger */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            id="status-toggle-btn"
            onClick={handleUpdateStatus}
            className="px-3 py-1 text-xs font-mono rounded bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Log Status
          </button>
          <div
            id="status-display"
            className="hidden md:inline-flex text-[11px] font-mono text-text-muted-on-ink gap-2"
          >
            <span>Y: {statusLog.scrollY}</span>
            <span>ST: {statusLog.stCount}</span>
          </div>
        </div>

        {/* Scroll Progress Bar */}
        <div
          ref={progressBarRef}
          id="scroll-progress-bar"
          className="absolute bottom-0 left-0 right-0 h-1 bg-accent origin-left scale-x-0"
        />
      </header>

      {/* Block 1 */}
      <section
        id="block-1"
        className="w-full min-h-screen pt-[var(--nav-h)] flex flex-col items-center justify-center p-8 bg-[#0F1020] border-b border-border-subtle"
      >
        <span className="font-mono text-xs text-accent uppercase tracking-widest mb-2">Block 01</span>
        <h2 className="text-display-xl font-display font-bold text-center">Block 1</h2>
        <p className="mt-4 text-text-muted-on-ink max-w-md text-center">
          First full-height section. Smooth wheel scroll moves smoothly without jump.
        </p>
      </section>

      {/* Block 2 */}
      <section
        id="block-2"
        className="w-full min-h-screen pt-[var(--nav-h)] flex flex-col items-center justify-center p-8 bg-[#171935] border-b border-border-subtle"
      >
        <span className="font-mono text-xs text-brand-blue uppercase tracking-widest mb-2">Block 02</span>
        <h2 className="text-display-xl font-display font-bold text-center">Block 2</h2>
        <p className="mt-4 text-text-muted-on-ink max-w-md text-center">
          Continuous scroll test block.
        </p>
      </section>

      {/* Block 3 - Pinned */}
      <section
        id="block-3"
        ref={pinSectionRef}
        className="w-full min-h-screen pt-[var(--nav-h)] flex flex-col items-center justify-center p-8 bg-[#1b1e42] border-b border-border-subtle"
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          <span className="font-mono text-xs text-success uppercase tracking-widest">Block 03 (Pinned)</span>
          <h2 className="text-h2 font-display font-bold text-center">Pinned for 100vh</h2>
          <p className="text-text-muted-on-ink max-w-md text-center text-sm">
            This section pins while the square below rotates 360 degrees on scrub.
          </p>
          <div
            ref={rotatingSquareRef}
            id="rotating-square"
            className="w-24 h-24 rounded-card bg-gradient-to-tr from-primary to-accent border border-white/20 shadow-lg flex items-center justify-center text-white font-mono text-xs font-bold"
          >
            ROTATING
          </div>
        </div>
      </section>

      {/* Block 4 - Target for anchor click test */}
      <section
        id="block-4"
        className="w-full min-h-screen pt-[var(--nav-h)] flex flex-col items-center justify-center p-8 bg-[#121429] border-b border-border-subtle"
      >
        <span className="font-mono text-xs text-accent uppercase tracking-widest mb-2">Block 04</span>
        <h2 className="text-display-xl font-display font-bold text-center">Block 4</h2>
        <p className="mt-4 text-text-muted-on-ink max-w-md text-center">
          Anchor target. Top aligns within 2px of var(--nav-h) below viewport top.
        </p>
      </section>

      {/* Block 5 - Inner scroll list */}
      <section
        id="block-5"
        className="w-full min-h-screen pt-[var(--nav-h)] flex flex-col items-center justify-center p-8 bg-[#171935] border-b border-border-subtle"
      >
        <span className="font-mono text-xs text-brand-blue uppercase tracking-widest mb-2">Block 05</span>
        <h2 className="text-h2 font-display font-bold text-center mb-4">Block 5 with Inner Scroll</h2>
        <p className="text-text-muted-on-ink max-w-md text-center text-sm mb-6">
          Contains an isolated inner scroll list marked with <code className="font-mono text-accent">data-lenis-prevent</code>.
        </p>

        {/* Inner Scroll Container */}
        <div
          id="inner-scroll-list"
          data-lenis-prevent="true"
          className="h-64 w-80 overflow-y-auto border border-border-subtle bg-surface/50 p-4 rounded-card"
        >
          <div className="font-mono text-xs text-accent sticky top-0 bg-[#171935] py-1 border-b border-border-subtle">
            Scrollable Inner Area
          </div>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="py-2.5 border-b border-border-subtle/40 text-xs font-mono text-text-muted-on-ink flex justify-between"
            >
              <span>Inner item {i + 1}</span>
              <span className="opacity-50">#{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Block 6 */}
      <section
        id="block-6"
        className="w-full min-h-screen pt-[var(--nav-h)] flex flex-col items-center justify-center p-8 bg-[#0F1020]"
      >
        <span className="font-mono text-xs text-layout-gray uppercase tracking-widest mb-2">Block 06</span>
        <h2 className="text-display-xl font-display font-bold text-center">Block 6</h2>
        <p className="mt-4 text-text-muted-on-ink max-w-md text-center">
          Final section of the scroll test page.
        </p>
      </section>
    </div>
  );
}

export default function ScrollDevPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <ScrollProvider>
      <ScrollDevContent />
    </ScrollProvider>
  );
}
