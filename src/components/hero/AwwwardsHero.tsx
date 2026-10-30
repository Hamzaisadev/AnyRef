'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  Sparkles,
  Layers,
  Copy,
  Check,
  Cpu,
  ChevronDown,
  Palette,
  Terminal,
  ShieldCheck,
  Repeat,
} from 'lucide-react';
import { Poster3DStage } from './Poster3DStage';
import { ScrubHud } from './ScrubHud';
import { MagneticButton } from './MagneticButton';

// Register GSAP plugins safely on client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function AwwwardsHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollTriggerInstanceRef = useRef<ScrollTrigger | null>(null);

  // Reactive state for HUD and 3D stage
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  // Interactive Live Brand DNA Sandbox state
  const [brandName, setBrandName] = useState('VELOCE STUDIO');
  const [brandSlogan, setBrandSlogan] = useState('Engineered Beyond Horizons');
  const [brandColor, setBrandColor] = useState('#4B2BFF');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Preset brands for live hot-swapping
  const brandPresets = [
    { name: 'VELOCE STUDIO', slogan: 'Engineered Beyond Horizons', color: '#4B2BFF' },
    { name: 'LUMINA ARCHIVE', slogan: 'Prismatic Light & Spatial Form', color: '#06B6D4' },
    { name: 'KINETIC LABS', slogan: 'Continuous Aerodynamic Motion', color: '#FF8A3D' },
  ];

  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: '(min-width: 1024px)',
          isTablet: '(min-width: 641px) and (max-width: 1023px)',
          isMobile: '(max-width: 640px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isMobile, reduceMotion } = context.conditions!;

          if (reduceMotion) {
            // Accessible fallback for users with vestibular motion sensitivity
            gsap.set('.poster-rig', {
              '--scrub-rot-x': '0deg',
              '--scrub-rot-y': '0deg',
              '--scrub-rot-z': '0deg',
              '--scrub-scale': 1,
              '--z-layer-1': '20px',
              '--z-layer-2': '40px',
              '--z-layer-3': '60px',
              '--z-layer-4': '80px',
              '--z-layer-5': '100px',
            });
            return;
          }

          // Desktop & Responsive 3D Scrub Timeline
          const maxRotX = isMobile ? '16deg' : '24deg';
          const maxRotY = isMobile ? '-12deg' : '-18deg';
          const maxRotZ = isMobile ? '3deg' : '4deg';
          const maxScale = isMobile ? 0.88 : 0.94;

          const z1 = isMobile ? '45px' : '75px';
          const z2 = isMobile ? '90px' : '150px';
          const z3 = isMobile ? '135px' : '225px';
          const z4 = isMobile ? '180px' : '300px';
          const z5 = isMobile ? '225px' : '370px';

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: '+=2400',
              scrub: 1.2,
              pin: true,
              anticipatePin: 1,
              onUpdate: (self) => {
                const p = self.progress;
                setProgress(p);

                // Compute active stage
                if (p < 0.28) {
                  setActiveStage(0);
                } else if (p < 0.6) {
                  setActiveStage(1);
                } else if (p < 0.85) {
                  setActiveStage(2);
                } else {
                  setActiveStage(3);
                }
              },
            },
          });

          // Save trigger instance for stage button jumping
          scrollTriggerInstanceRef.current = tl.scrollTrigger || null;

          // Stage 0 -> 1: Perspective Tilt & Lift
          tl.to(
            '.poster-rig',
            {
              '--scrub-rot-x': maxRotX,
              '--scrub-rot-y': maxRotY,
              '--scrub-rot-z': maxRotZ,
              '--scrub-scale': maxScale,
              duration: 2,
              ease: 'power2.inOut',
            },
            0
          );

          tl.to(
            '.hero-intro-text',
            {
              opacity: 0.2,
              y: -30,
              duration: 1.5,
              ease: 'power2.out',
            },
            0
          );

          // Stage 1 -> 2: Holographic Explosive Layer Separation
          tl.to(
            '.poster-rig',
            {
              '--z-layer-1': z1,
              '--z-layer-2': z2,
              '--z-layer-3': z3,
              '--z-layer-4': z4,
              '--z-layer-5': z5,
              duration: 3,
              ease: 'power1.inOut',
            },
            1.5
          );

          // Stage 2 -> 3: DNA Injection & Morphing
          tl.to(
            '.layer-brand',
            {
              opacity: 1,
              scale: 1.05,
              duration: 1.5,
              ease: 'back.out(1.4)',
            },
            3
          );

          // Stage 3 -> 4: Prompt Terminal & Synthesis Reveal
          tl.fromTo(
            '.prompt-synthesis-card',
            {
              opacity: 0,
              y: 80,
              scale: 0.95,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 2,
              ease: 'power3.out',
            },
            4.2
          );
        }
      );
    },
    { scope: heroRef }
  );

  // Jump smoothly to a specific stage
  const handleSelectStage = (stageIndex: number) => {
    const st = scrollTriggerInstanceRef.current;
    if (!st) return;

    const stageProgressMap = [0.05, 0.42, 0.72, 0.96];
    const targetProgress = stageProgressMap[stageIndex] ?? 0;
    const scrollPos = st.start + targetProgress * (st.end - st.start);

    window.scrollTo({
      top: scrollPos,
      behavior: 'smooth',
    });
  };

  const copyPromptText = () => {
    const prompt = `/imagine prompt: Studio product poster for ${brandName}, architectural composition inspired by Haute Horlogerie reference, key light 5600K amber, electric rim illumination, titanium chassis, sleek minimalist layout, typography rules preserved --ar 4:5 --stylize 250 --v 6.1`;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <section
      ref={heroRef}
      className="relative w-full min-h-screen bg-[#090A10] text-slate-100 flex flex-col justify-between overflow-hidden"
      aria-label="Awwwards Hero Interactive Experience"
    >
      {/* Background Cyber-Editorial Ambient Grid & Glows */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-cyan-500/15 rounded-full blur-[120px]" />
      </div>

      {/* Top Editorial Bar */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        {/* Brand Wordmark & Mode Badge */}
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-[0_0_20px_rgba(75,43,255,0.4)] group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <rect x="6" y="6" width="52" height="52" rx="12" stroke="currentColor" strokeWidth="4" />
                <path
                  d="M24 20h-6v24h6M40 20h6v24h-6"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="32" cy="32" r="4" fill="#FF8A3D" />
              </svg>
            </div>
            <span className="font-tight font-extrabold text-2xl tracking-tighter text-white">
              anyref
            </span>
          </Link>

          <span className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-cyan-400">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>DECONSTRUCTION ENGINE V2</span>
          </span>
        </div>

        {/* Live Brand DNA Hot-Swap Toolbar (User Interactive Preset Switcher) */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-950/80 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-mono">
          <Palette className="w-3.5 h-3.5 text-accent" />
          <span className="text-slate-400 text-[11px]">BRAND DNA:</span>
          {brandPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setBrandName(preset.name);
                setBrandSlogan(preset.slogan);
                setBrandColor(preset.color);
              }}
              className={`px-2 py-0.5 rounded-full text-[10px] transition-all ${
                brandName === preset.name
                  ? 'bg-primary text-white font-bold shadow-[0_0_10px_rgba(75,43,255,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {preset.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Navigation CTAs */}
        <div className="flex items-center space-x-3">
          <Link
            href="/library"
            className="hidden sm:inline-flex text-xs font-mono text-slate-300 hover:text-white px-3 py-2 transition-colors"
          >
            WINNER VAULT
          </Link>
          <Link
            href="/workspace/generate"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-mono tracking-wide transition-all shadow-sm active:scale-95"
          >
            <span>LAUNCH APP</span>
            <ArrowRight className="w-3.5 h-3.5 text-accent" />
          </Link>
        </div>
      </header>

      {/* Main Center Stage: Split Screen Hero & 3D Interactive Canvas */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 pb-2">
        {/* Left Column: Kinetic Editorial Typography & Magnetic Action Suite */}
        <div className="lg:col-span-5 text-left space-y-6 hero-intro-text">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono tracking-wider bg-primary/20 border border-primary/30 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-spin-slow" />
            <span>AWWWARDS SHOWCASE // GSAP 3.15</span>
          </div>

          <h1 className="font-tight font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.05]">
            Any reference. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-accent">
              Your brand.
            </span>{' '}
            <br />
            Ready to prompt.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base font-sans leading-relaxed max-w-lg">
            Deconstruct campaign posters into reusable, fill-in-the-blank image prompts.
            Isolate typography, lighting, and composition slots with{' '}
            <span className="text-amber-400 font-mono font-medium">zero price hallucinations</span>{' '}
            and zero model drift.
          </p>

          {/* Magnetic CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/workspace/generate">
              <MagneticButton
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white font-mono text-xs font-bold tracking-wider shadow-[0_10px_30px_rgba(75,43,255,0.4)] hover:shadow-[0_15px_40px_rgba(75,43,255,0.6)] min-h-[48px]"
                glowColor="rgba(255, 138, 61, 0.5)"
              >
                <span>DECONSTRUCT A POSTER</span>
                <ArrowRight className="w-4 h-4 text-accent" />
              </MagneticButton>
            </Link>

            <Link href="/library">
              <MagneticButton
                className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-mono text-xs font-semibold tracking-wider backdrop-blur-md min-h-[48px]"
                glowColor="rgba(34, 211, 238, 0.4)"
              >
                <span>BROWSE WINNERS</span>
              </MagneticButton>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-left font-mono">
            <div>
              <div className="text-lg sm:text-xl font-bold text-white">0%</div>
              <div className="text-[10px] text-slate-400 uppercase">Hallucinated Prices</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-cyan-400">$0.00</div>
              <div className="text-[10px] text-slate-400 uppercase">Reuse API Cost</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-accent">100%</div>
              <div className="text-[10px] text-slate-400 uppercase">Brand Slot Fidelity</div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Exploded Poster Canvas */}
        <div className="lg:col-span-7 relative flex items-center justify-center">
          <Poster3DStage
            progress={progress}
            activeLayer={activeLayer}
            brandName={brandName}
            brandSlogan={brandSlogan}
            brandColor={brandColor}
          />

          {/* Floating Prompt Synthesis Card (Slides into view on Stage 4) */}
          <div className="prompt-synthesis-card absolute -bottom-4 lg:bottom-4 w-full max-w-lg p-4 rounded-2xl bg-slate-950/90 border border-cyan-400/40 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl pointer-events-auto font-mono text-xs z-30">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-slate-400">
              <div className="flex items-center space-x-1.5 text-cyan-300">
                <Terminal className="w-3.5 h-3.5" />
                <span className="font-bold">COMPILED_PROMPT // MIDJOURNEY_V6</span>
              </div>
              <button
                onClick={copyPromptText}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Copy prompt"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>COPY PROMPT</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-2.5 p-2 rounded-xl bg-black/60 border border-white/5 text-[11px] text-slate-300 font-mono leading-relaxed break-words select-all">
              <span className="text-primary-fg font-bold">/imagine prompt:</span> Studio poster for{' '}
              <span className="text-cyan-300 font-bold">&#123;&#123;{brandName}&#125;&#125;</span>,
              architectural composition, key light 5600K amber, rim light violet, titanium chassis,
              minimalist typography --ar 4:5 --stylize 250
            </div>

            <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> 3 ATTACHMENTS ORDERED
              </span>
              <span>READY FOR FLUX &amp; MIDJOURNEY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Telemetry HUD with Stage Selectors */}
      <footer className="relative z-30 w-full pb-4 pt-2">
        <ScrubHud
          progress={progress}
          activeStage={activeStage}
          activeLayer={activeLayer}
          onSelectStage={handleSelectStage}
          onToggleLayer={(layerId) => setActiveLayer(activeLayer === layerId ? null : layerId)}
        />

        {/* Scroll down prompt hint */}
        <div className="flex items-center justify-center space-x-2 text-[10px] font-mono text-slate-400/80 pt-3">
          <ChevronDown className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
          <span>SCROLL TO SCRUB THE 3D DECONSTRUCTION MATRIX</span>
        </div>
      </footer>
    </section>
  );
}
