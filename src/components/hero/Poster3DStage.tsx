'use client';

import React, { useRef, useEffect } from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, Eye, Lock, CheckCircle2, Zap } from 'lucide-react';
import gsap from 'gsap';

interface Poster3DStageProps {
  progress: number;
  activeLayer: string | null;
  brandName?: string;
  brandSlogan?: string;
  brandColor?: string;
}

export function Poster3DStage({
  progress,
  activeLayer,
  brandName = 'VELOCE STUDIO',
  brandSlogan = 'Engineered Beyond Horizons',
  brandColor = '#4B2BFF',
}: Poster3DStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardGroupRef = useRef<HTMLDivElement>(null);

  // Mouse tilt tracking
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 18; // Max tilt degrees
      mouseY = -y * 18;
    };

    const handleMouseLeave = () => {
      mouseX = 0;
      mouseY = 0;
    };

    stage.addEventListener('mousemove', handleMouseMove);
    stage.addEventListener('mouseleave', handleMouseLeave);

    const updateTilt = () => {
      currentTiltX += (mouseY - currentTiltX) * 0.08;
      currentTiltY += (mouseX - currentTiltY) * 0.08;

      if (cardGroupRef.current) {
        gsap.set(cardGroupRef.current, {
          '--mouse-tilt-x': `${currentTiltX}deg`,
          '--mouse-tilt-y': `${currentTiltY}deg`,
        });
      }
      animationFrameId = requestAnimationFrame(updateTilt);
    };

    animationFrameId = requestAnimationFrame(updateTilt);

    return () => {
      stage.removeEventListener('mousemove', handleMouseMove);
      stage.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Compute opacity for layer isolation
  const getLayerOpacity = (layerId: string) => {
    if (!activeLayer || activeLayer === 'all') return 1;
    return activeLayer === layerId ? 1 : 0.15;
  };

  return (
    <div
      ref={stageRef}
      className="relative w-full h-[580px] sm:h-[680px] lg:h-[720px] flex items-center justify-center select-none"
      style={{ perspective: '1600px' }}
      aria-label="3D Poster Deconstruction Interactive Stage"
    >
      {/* Dynamic Background Ambient Light Portal */}
      <div
        className="pointer-events-none absolute w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full blur-[120px] opacity-40 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${brandColor} 0%, #0F1020 70%, transparent 100%)`,
        }}
      />

      {/* Floating Spatial Depth Axis Indicators */}
      <div className="absolute top-6 left-6 font-mono text-[10px] text-cyan-400/60 hidden sm:flex flex-col space-y-1">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>STAGE_VIEWPORT: 1400PX_Z</span>
        </div>
        <div>CALIBRATION: OKLCH_STABLE</div>
        <div>RENDER_PASS: EXPLODED_ISOMETRIC</div>
      </div>

      <div className="absolute top-6 right-6 font-mono text-[10px] text-slate-400/60 hidden sm:flex flex-col text-right space-y-1">
        <div>ASPECT: 4:5 POSTER</div>
        <div className="text-amber-400/80">GUARD: PRICE_LOCK_ENGAGED</div>
        <div>LATENCY: 16MS (60FPS)</div>
      </div>

      {/* Master 3D Rotational Rig */}
      <div
        ref={cardGroupRef}
        className="poster-rig relative w-[310px] sm:w-[390px] md:w-[420px] h-[440px] sm:h-[530px] md:h-[570px] transition-transform duration-100 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(calc(var(--scrub-rot-x, 0deg) + var(--mouse-tilt-x, 0deg))) rotateY(calc(var(--scrub-rot-y, 0deg) + var(--mouse-tilt-y, 0deg))) rotateZ(var(--scrub-rot-z, 0deg)) scale(var(--scrub-scale, 1))`,
        }}
      >
        {/* ========================================================
            LAYER 0: BASE MONOLITHIC CHASSIS (Deep Obsidian Foundation)
            ======================================================== */}
        <div
          className="layer-base absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.85)] overflow-hidden"
          style={{
            transform: 'translateZ(0px)',
            transition: 'opacity 0.4s ease',
          }}
        >
          {/* Subtle micro-grid pattern */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          />

          {/* Corner fiducial calibration marks */}
          <div className="absolute top-4 left-4 font-mono text-[9px] text-white/40 tracking-wider">
            + 00.1A // ANYREF
          </div>
          <div className="absolute top-4 right-4 font-mono text-[9px] text-white/40 tracking-wider">
            REF #9042 //
          </div>
          <div className="absolute bottom-4 left-4 font-mono text-[9px] text-white/40">
            [SYS_ORIGIN: 0,0]
          </div>
          <div className="absolute bottom-4 right-4 font-mono text-[9px] text-cyan-400/50">
            PROMPT_ID: 8D0BCC
          </div>

          {/* Luxury Poster Graphic: Center Luxury Watch / Spatial Object Silhouette */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full border border-white/15 flex items-center justify-center shadow-inner">
              {/* Internal watch dial mechanics */}
              <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/20" />
              <div className="absolute inset-6 rounded-full border border-white/10 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-primary/40 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
                </div>
              </div>
              {/* Dial tick marks */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-full h-1 flex justify-between px-2"
                  style={{ transform: `rotate(${deg}deg)` }}
                >
                  <div className="w-1.5 h-0.5 bg-white/30" />
                  <div className="w-1.5 h-0.5 bg-white/30" />
                </div>
              ))}
            </div>
          </div>

          {/* Monolithic Typographic Elements on Base Poster */}
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between pointer-events-none">
            {/* Top Bar */}
            <div className="flex justify-between items-start pt-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                  HAUTE HORLOGERIE // VOL. 04
                </span>
                <h3 className="poster-headline text-2xl sm:text-3xl font-tight font-extrabold text-white tracking-tight leading-none mt-1">
                  CHRONO OBSIDIAN
                </h3>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/10 text-white/80 border border-white/15">
                  EDITION 42MM
                </span>
              </div>
            </div>

            {/* Bottom Section: Slogan, Price, Guard Badge */}
            <div className="space-y-4 pb-2">
              <div className="border-t border-white/10 pt-3 flex justify-between items-end">
                <div>
                  <div className="poster-slogan text-xs sm:text-sm text-slate-300 font-sans tracking-wide">
                    Architectural Precision in Motion
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    TITANIUM CHASSIS // CERAMIC BEZEL
                  </div>
                </div>
                <div className="text-right">
                  <div className="poster-price text-sm sm:text-base font-mono font-bold text-amber-300">
                    $1,850 USD
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">RETAIL LAUNCH</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                <span>VERIFIED PROMPT BLUEPRINT</span>
                <span>ANYREF ARCHIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            LAYER 1: GEOMETRY & COMPOSITION WIREFRAME (Z: 70px)
            ======================================================== */}
        <div
          className="layer-geometry absolute inset-0 rounded-3xl border-2 border-cyan-400/40 bg-cyan-950/10 pointer-events-none overflow-hidden"
          style={{
            transform: 'translateZ(var(--z-layer-1, 0px))',
            opacity: getLayerOpacity('geometry'),
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.15)',
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Rule of Thirds Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            <div className="border-r border-b border-cyan-400/20" />
            <div className="border-r border-b border-cyan-400/20" />
            <div className="border-b border-cyan-400/20" />
            <div className="border-r border-b border-cyan-400/20" />
            <div className="border-r border-b border-cyan-400/30 bg-cyan-400/5 relative">
              {/* Center intersection crosshair */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
            </div>
            <div className="border-b border-cyan-400/20" />
            <div className="border-r border-cyan-400/20" />
            <div className="border-r border-cyan-400/20" />
            <div />
          </div>

          {/* Caliper Bounding Box Callouts */}
          <div className="absolute top-2 left-2 bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm">
            [BOUNDING_BOX: 420x570]
          </div>
          <div className="absolute bottom-2 right-2 bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm">
            [FOCAL_CENTER: 50% 52%]
          </div>

          {/* Golden Ratio Arc Simulation */}
          <svg className="absolute inset-0 w-full h-full opacity-40 stroke-cyan-400" fill="none">
            <path
              d="M 20 40 Q 380 40 380 300 T 150 500"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>
        </div>

        {/* ========================================================
            LAYER 2: ATMOSPHERIC LIGHTING & CHROMATIC MAP (Z: 140px)
            ======================================================== */}
        <div
          className="layer-lighting absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"
          style={{
            transform: 'translateZ(var(--z-layer-2, 0px))',
            opacity: getLayerOpacity('lighting'),
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Volumetric Key Light Cone (45 deg angle) */}
          <div
            className="absolute -top-20 -left-20 w-[140%] h-[140%] opacity-50 mix-blend-screen"
            style={{
              background:
                'conic-gradient(from 135deg at 20% 20%, rgba(255,138,61,0.5) 0deg, rgba(75,43,255,0.4) 60deg, transparent 120deg)',
            }}
          />

          {/* Rim light shimmer border */}
          <div className="absolute inset-0 rounded-3xl border-2 border-primary/60 shadow-[inset_0_0_35px_rgba(75,43,255,0.4)]" />

          {/* Vector Lighting Direction Arrows & Tags */}
          <div className="absolute top-12 left-10 flex items-center space-x-2 bg-slate-950/80 border border-accent/60 px-2 py-0.5 rounded text-[9px] font-mono text-accent">
            <Zap className="w-3 h-3 text-accent animate-pulse" />
            <span>KEY_LIGHT: 5600K [WARM AMBER]</span>
          </div>

          <div className="absolute bottom-24 right-6 flex items-center space-x-2 bg-slate-950/80 border border-primary/60 px-2 py-0.5 rounded text-[9px] font-mono text-primary-fg">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>RIM_LIGHT: 7200K [ELECTRIC VIOLET]</span>
          </div>
        </div>

        {/* ========================================================
            LAYER 3: TYPOGRAPHIC SLOTS & EXTRACTION MESH (Z: 210px)
            ======================================================== */}
        <div
          className="layer-slots absolute inset-0 rounded-3xl pointer-events-none p-6 sm:p-8 flex flex-col justify-between"
          style={{
            transform: 'translateZ(var(--z-layer-3, 0px))',
            opacity: getLayerOpacity('slots'),
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Headline Slot Overlay */}
          <div className="relative pt-4">
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-primary/90 text-white font-mono text-[9px] font-bold shadow-md -translate-y-2">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>SLOT: &#123;&#123;brand.headline&#125;&#125;</span>
            </div>
            <div className="border border-dashed border-primary/80 rounded-xl p-2 bg-primary/10 backdrop-blur-xs">
              <div className="slot-morph-headline text-2xl sm:text-3xl font-tight font-extrabold text-white tracking-tight drop-shadow-md">
                {progress > 0.5 ? brandName : 'CHRONO OBSIDIAN'}
              </div>
            </div>
          </div>

          {/* Slogan Slot Overlay */}
          <div className="relative pb-10">
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-cyan-600/90 text-white font-mono text-[9px] font-bold shadow-md -translate-y-2">
              <span>SLOT: &#123;&#123;brand.slogan&#125;&#125;</span>
            </div>
            <div className="border border-dashed border-cyan-400/80 rounded-xl p-2 bg-cyan-950/20 backdrop-blur-xs">
              <div className="slot-morph-slogan text-xs sm:text-sm text-cyan-200 font-sans tracking-wide">
                {progress > 0.5 ? brandSlogan : 'Architectural Precision in Motion'}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            LAYER 4: BRAND DNA INJECTION CONDUITS (Z: 280px)
            ======================================================== */}
        <div
          className="layer-brand absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            transform: 'translateZ(var(--z-layer-4, 0px))',
            opacity: getLayerOpacity('brand'),
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Floating Brand Token Dock (Right flank) */}
          <div className="absolute -right-12 sm:-right-20 top-20 flex flex-col space-y-2 pointer-events-auto">
            {/* Token 1: Wordmark */}
            <div className="bg-slate-900/95 border border-primary/60 rounded-xl p-2.5 shadow-xl text-left font-mono text-[10px] w-36 sm:w-44 backdrop-blur-md hover:border-primary transition-all">
              <div className="text-[8px] text-primary-fg/70 uppercase">Brand DNA // 01</div>
              <div className="text-white font-bold text-xs font-tight mt-0.5">{brandName}</div>
              <div className="text-[9px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>SLOT_BOUND_OK</span>
              </div>
            </div>

            {/* Token 2: Color Palette */}
            <div className="bg-slate-900/95 border border-white/20 rounded-xl p-2.5 shadow-xl text-left font-mono text-[10px] w-36 sm:w-44 backdrop-blur-md">
              <div className="text-[8px] text-slate-400 uppercase">Palette Injection</div>
              <div className="flex items-center space-x-2 mt-1">
                <div
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                  style={{ backgroundColor: brandColor }}
                />
                <span className="text-white text-[10px]">OKLCH_PRIMARY</span>
              </div>
            </div>

            {/* Token 3: Product Shape Match */}
            <div className="bg-slate-900/95 border border-cyan-400/50 rounded-xl p-2.5 shadow-xl text-left font-mono text-[10px] w-36 sm:w-44 backdrop-blur-md">
              <div className="text-[8px] text-cyan-400 uppercase">Fit Ratio Guard</div>
              <div className="text-white font-semibold text-[11px] mt-0.5">TALL (9:16) ➔ 4:5</div>
              <div className="text-[8px] text-slate-400">NO CROP DISTORTION</div>
            </div>
          </div>

          {/* SVG Glowing Data Conduits connecting Tokens to Slots */}
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            <path
              d="M 390 100 Q 340 70 280 80"
              stroke="#4B2BFF"
              strokeWidth="2"
              fill="none"
              strokeDasharray="6 3"
              className="animate-pulse"
            />
            <path
              d="M 390 180 Q 320 220 240 240"
              stroke="#22D3EE"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 4"
            />
          </svg>
        </div>

        {/* ========================================================
            LAYER 5: NEVER-INVENT HALLUCINATION SHIELD (Z: 350px)
            ======================================================== */}
        <div
          className="layer-shield absolute bottom-12 right-4 sm:right-6 pointer-events-none"
          style={{
            transform: 'translateZ(var(--z-layer-5, 0px))',
            opacity: getLayerOpacity('shield'),
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Amber Security Shield Laser Mesh */}
          <div className="relative bg-amber-950/90 border-2 border-amber-400 rounded-2xl p-3 shadow-[0_0_30px_rgba(251,191,36,0.4)] backdrop-blur-md text-left font-mono max-w-[200px] sm:max-w-[240px]">
            <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-[10px]">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>NEVER-INVENT GUARD</span>
            </div>

            <p className="text-[9px] text-amber-100/90 leading-tight mt-1">
              Price, discount &amp; date values are locked. AI is programmatically prohibited from hallucinating financial terms.
            </p>

            <div className="mt-2 pt-2 border-t border-amber-400/30 flex items-center justify-between text-[8px] text-amber-300">
              <span>STATUS: ARMED</span>
              <span className="text-emerald-300 font-bold">100% BLOCKED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
