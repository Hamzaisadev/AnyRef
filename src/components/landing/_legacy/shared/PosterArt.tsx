import React from 'react';

export interface PosterArtProps {
  brandName?: string;
  headline?: string;
  offer?: string;
  cta?: string;
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
  productShape?: 'tall' | 'wide' | 'square';
  showAnnotations?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function PosterArt({
  brandName = 'AURA ACOUSTICS',
  headline = 'SPATIAL SOUND 360°',
  offer = 'PRE-ORDER SAVE 25%',
  cta = 'RESERVE BATCH 01',
  palette = {
    primary: '#4B2BFF',
    secondary: '#2B7BFF',
    accent: '#FF8A3D',
    bg: '#0B0C18',
  },
  productShape = 'square',
  showAnnotations = false,
  className = '',
  style,
}: PosterArtProps) {
  return (
    <div
      style={{
        backgroundColor: palette.bg,
        ...style,
      }}
      className={`relative w-full aspect-[4/5] max-w-[380px] rounded-2xl overflow-hidden border border-white/15 shadow-2xl p-6 flex flex-col justify-between select-none ${className}`}
      aria-label={`Poster artwork for ${brandName}`}
    >
      {/* Dynamic Background Geometry with SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 380 475"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="meshGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="0.45" />
            <stop offset="50%" stopColor={palette.secondary} stopOpacity="0.2" />
            <stop offset="100%" stopColor={palette.bg} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={palette.primary} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="190" cy="210" r="160" fill="url(#meshGlow)" />

        {/* Editorial Grid Lines */}
        <line x1="32" y1="20" x2="32" y2="455" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="348" y1="20" x2="348" y2="455" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="20" y1="80" x2="360" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="20" y1="390" x2="360" y2="390" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* Geometric Accent Circles */}
        <circle
          cx="190"
          cy="220"
          r="90"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <circle
          cx="190"
          cy="220"
          r="120"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      </svg>

      {/* Top Header: Wordmark & Category */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <span
          className="font-tight font-black tracking-widest text-xs uppercase"
          style={{ color: palette.accent }}
        >
          {brandName}
        </span>
        <span className="font-mono text-[9px] text-white/50 tracking-widest">
          SERIES // 2026
        </span>
      </div>

      {/* Middle Stage: Product Silhouette & Headline */}
      <div className="relative z-10 my-auto text-center flex flex-col items-center">
        {/* Product Representation (CSS & SVG Silhouette) */}
        <div className="relative mb-5 flex items-center justify-center">
          {productShape === 'tall' ? (
            <div
              className="w-16 h-36 rounded-full border-2 border-white/30 backdrop-blur-md shadow-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${palette.primary}40, ${palette.secondary}20)`,
              }}
            >
              <div className="w-8 h-20 rounded-full bg-white/20 blur-[6px]" />
            </div>
          ) : productShape === 'wide' ? (
            <div
              className="w-44 h-20 rounded-2xl border-2 border-white/30 backdrop-blur-md shadow-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${palette.primary}40, ${palette.secondary}20)`,
              }}
            >
              <div className="w-24 h-10 rounded-full bg-white/20 blur-[8px]" />
            </div>
          ) : (
            <div
              className="w-28 h-28 rounded-2xl border-2 border-white/30 backdrop-blur-md shadow-xl flex items-center justify-center relative overflow-hidden rotate-6 hover:rotate-0 transition-transform duration-500"
              style={{
                background: `linear-gradient(135deg, ${palette.primary}50, ${palette.secondary}30)`,
              }}
            >
              <div className="w-14 h-14 rounded-full bg-white/25 blur-[10px]" />
              <div className="w-6 h-6 rounded-md border border-white/40" />
            </div>
          )}

          {/* Annotation Overlay if active */}
          {showAnnotations && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-3 -right-6 px-1.5 py-0.5 rounded bg-[#FF8A3D] text-[#0F1020] text-[9px] font-mono font-bold">
                {'{{product}}'}
              </div>
              <div className="absolute inset-0 border border-dashed border-[#FF8A3D] rounded-xl" />
            </div>
          )}
        </div>

        {/* Poster Headline */}
        <div className="relative">
          <h3 className="font-tight font-black text-xl sm:text-2xl text-white tracking-tight leading-tight uppercase max-w-[260px]">
            {headline}
          </h3>
          {showAnnotations && (
            <span className="absolute -top-2 -left-8 px-1 py-0.2 rounded bg-[#2B7BFF] text-white text-[8px] font-mono">
              {'{{headline}}'}
            </span>
          )}
        </div>

        {/* Poster Offer / Tagline */}
        <div className="relative mt-2">
          <p className="font-mono text-xs font-bold text-white/80 tracking-wider">
            {offer}
          </p>
          {showAnnotations && (
            <span className="absolute -bottom-3 right-0 px-1 py-0.2 rounded bg-[#FF8A3D] text-[#0F1020] text-[8px] font-mono">
              {'{{offer}}'}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Button CTA & Tech Specs */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-white border border-white/20"
          style={{ backgroundColor: palette.primary }}
        >
          {cta}
        </div>
        <span className="font-mono text-[9px] text-white/40">
          EDITION 01/50
        </span>
      </div>
    </div>
  );
}
