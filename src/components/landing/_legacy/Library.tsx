'use client';

import React, { useState, useRef } from 'react';
import { SectionShell } from './shared/SectionShell';
import { Pill } from './shared/Pill';
import { Chip } from './shared/Chip';
import { PosterArt } from './shared/PosterArt';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { Sliders, RefreshCw, CheckCircle, AlertCircle, XCircle, ArrowRight } from 'lucide-react';

export function Library() {
  const { library } = LANDING_CONTENT;

  // Split comparison slider position (0% to 100%)
  const [sliderPos, setSliderPos] = useState(50);
  const isDragging = useRef(false);

  // Active status of current compare item
  const [currentStatus, setCurrentStatus] = useState<'winner' | 'needsTweak' | 'failed'>('winner');
  const [noteText, setNoteText] = useState('Sharp typography, high contrast, perfect prompt binding.');

  // Filter state for library thumbnails
  const [statusFilter, setStatusFilter] = useState<'all' | 'winner' | 'needsTweak' | 'failed'>('all');
  const [selectedReuseItem, setSelectedReuseItem] = useState<number | null>(null);

  // 6 Library Cards thumbnails (drawn with CSS/SVG posters)
  const libraryEntries = [
    {
      id: 1,
      title: 'Aura Studio 360',
      brand: 'Aura Acoustics',
      status: 'winner' as const,
      headline: 'SPATIAL AUDIO',
      palette: { primary: '#4B2BFF', secondary: '#2B7BFF', accent: '#FF8A3D', bg: '#0B0C18' },
    },
    {
      id: 2,
      title: 'Solaris Horizon Cell',
      brand: 'Solaris Kinetics',
      status: 'winner' as const,
      headline: 'CLEAN KINETIC',
      palette: { primary: '#00D18F', secondary: '#38BDF8', accent: '#F59E0B', bg: '#06131A' },
    },
    {
      id: 3,
      title: 'Fajar Terracotta Edition',
      brand: 'Fajar Candles',
      status: 'winner' as const,
      headline: 'SOY BOTANICAL',
      palette: { primary: '#D48152', secondary: '#F4EDE4', accent: '#2B3A2C', bg: '#1C1510' },
    },
    {
      id: 4,
      title: 'Aura Minimal Headset',
      brand: 'Aura Acoustics',
      status: 'needsTweak' as const,
      headline: 'STUDIO OVEREAR',
      palette: { primary: '#6366F1', secondary: '#818CF8', accent: '#F43F5E', bg: '#0F1020' },
    },
    {
      id: 5,
      title: 'Solaris Mini Inverter',
      brand: 'Solaris Kinetics',
      status: 'needsTweak' as const,
      headline: 'PORTABLE 500W',
      palette: { primary: '#10B981', secondary: '#06B6D4', accent: '#EAB308', bg: '#09161B' },
    },
    {
      id: 6,
      title: 'Fajar Incense Trial',
      brand: 'Fajar Candles',
      status: 'failed' as const,
      headline: 'RAW RESIN',
      palette: { primary: '#9A3412', secondary: '#C2410C', accent: '#EA580C', bg: '#18110D' },
    },
  ];

  const filteredEntries = libraryEntries.filter((entry) => {
    if (statusFilter === 'all') return true;
    return entry.status === statusFilter;
  });

  function handleSliderMove(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const offset = clientX - rect.left;
    const pct = Math.max(10, Math.min(90, (offset / rect.width) * 100));
    setSliderPos(pct);
  }

  return (
    <SectionShell
      id="library"
      theme="paper"
      eyebrow={library.eyebrow}
      h2={library.h2}
      intro={library.intro}
    >
      {/* 3 Copy Callouts Header */}
      <div className="hidden sm:flex items-center justify-around mb-8 text-xs font-mono text-[#5A6070]">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4B2BFF]" />
          <span>{library.callouts.judge}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E9E6A]" />
          <span>{library.callouts.filter}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A3D]" />
          <span>{library.callouts.reuse}</span>
        </div>
      </div>

      {/* Browser-Style Compare Screen Frame */}
      <div className="w-full rounded-3xl bg-[#0F1020] text-white p-4 sm:p-8 shadow-2xl border border-white/10 mb-12">
        {/* Browser Top Chrome */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs font-mono text-[#9AA0AE]">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 hidden sm:inline text-white/60">
              anyref.app/entries/compare
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Pill variant={currentStatus} size="sm">
              Status: {currentStatus === 'winner' ? 'Winner' : currentStatus === 'needsTweak' ? 'Needs tweak' : 'Failed'}
            </Pill>
          </div>
        </div>

        {/* Draggable Divider Compare Stage */}
        <div
          className="relative w-full h-[360px] sm:h-[440px] rounded-2xl overflow-hidden cursor-ew-resize select-none my-6 border border-white/10"
          onMouseMove={(e) => isDragging.current && handleSliderMove(e)}
          onMouseDown={() => (isDragging.current = true)}
          onMouseUp={() => (isDragging.current = false)}
          onMouseLeave={() => (isDragging.current = false)}
          onTouchMove={handleSliderMove}
        >
          {/* Left Layer: Reference Poster (clipped to sliderPos) */}
          <div
            className="absolute inset-0 bg-[#0B0C18] flex items-center justify-center overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <div className="scale-90 sm:scale-100">
              <PosterArt
                brandName="REFERENCE"
                headline="ORIGINAL POSTER"
                offer="TARGET COMPOSITION"
                cta="INSPIRATION"
                palette={{ primary: '#818CF8', secondary: '#4338CA', accent: '#F43F5E', bg: '#101222' }}
              />
            </div>
            <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/70 border border-white/20 font-mono text-[11px] text-white">
              Reference (Left)
            </span>
          </div>

          {/* Right Layer: Result Poster */}
          <div
            className="absolute inset-0 bg-[#06131A] flex items-center justify-center overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
          >
            <div className="scale-90 sm:scale-100">
              <PosterArt
                brandName="AURA ACOUSTICS"
                headline="SPATIAL SOUND 360°"
                offer="YOUR BRAND RESULT"
                cta="RESERVE BATCH"
                palette={{ primary: '#4B2BFF', secondary: '#2B7BFF', accent: '#FF8A3D', bg: '#0B0C18' }}
              />
            </div>
            <span className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-black/70 border border-white/20 font-mono text-[11px] text-[#1E9E6A]">
              Result (Right)
            </span>
          </div>

          {/* Draggable Divider Line & Knob */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shadow-lg">
              ↔
            </div>
          </div>
        </div>

        {/* Compare Screen Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Status Switcher Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-[#9AA0AE] uppercase block">
              Mark generation outcome:
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCurrentStatus('winner')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                  currentStatus === 'winner'
                    ? 'bg-[#1E9E6A] text-white border-[#1E9E6A]'
                    : 'bg-white/5 border-white/10 text-[#9AA0AE] hover:text-white'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Winner</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStatus('needsTweak')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                  currentStatus === 'needsTweak'
                    ? 'bg-[#FF8A3D] text-white border-[#FF8A3D]'
                    : 'bg-white/5 border-white/10 text-[#9AA0AE] hover:text-white'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Needs tweak</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStatus('failed')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                  currentStatus === 'failed'
                    ? 'bg-[#D64545] text-white border-[#D64545]'
                    : 'bg-white/5 border-white/10 text-[#9AA0AE] hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Failed</span>
              </button>
            </div>
          </div>

          {/* Notes Input Field */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-[#9AA0AE] uppercase block">
              Prompt notes &amp; adjustments:
            </span>
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#4B2BFF]"
            />
          </div>
        </div>
      </div>

      {/* Row of Library Cards with Filter Pills */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-[#0F1020] uppercase mr-2">
              Filter:
            </span>
            <Pill
              variant="neutral"
              isActive={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            >
              All (6)
            </Pill>
            <Pill
              variant="winner"
              isActive={statusFilter === 'winner'}
              onClick={() => setStatusFilter('winner')}
            >
              Winners (3)
            </Pill>
            <Pill
              variant="needsTweak"
              isActive={statusFilter === 'needsTweak'}
              onClick={() => setStatusFilter('needsTweak')}
            >
              Needs tweak (2)
            </Pill>
            <Pill
              variant="failed"
              isActive={statusFilter === 'failed'}
              onClick={() => setStatusFilter('failed')}
            >
              Failed (1)
            </Pill>
          </div>

          <span className="text-xs font-mono text-[#5A6070]">
            Click any Winner card to inspect reuse
          </span>
        </div>

        {/* 6 Thumbnail Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredEntries.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedReuseItem(item.id)}
              className={`p-3 rounded-2xl bg-white border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                selectedReuseItem === item.id
                  ? 'border-[#4B2BFF] ring-2 ring-[#4B2BFF]/30'
                  : 'border-[#0F1020]/10'
              }`}
            >
              {/* Mini vector artwork */}
              <div
                className="w-full aspect-[4/5] rounded-xl mb-3 flex flex-col justify-between p-2 border border-black/10 relative overflow-hidden"
                style={{ backgroundColor: item.palette.bg }}
              >
                <span
                  className="text-[8px] font-mono font-bold uppercase truncate"
                  style={{ color: item.palette.accent }}
                >
                  {item.brand}
                </span>
                <span className="text-[10px] font-tight font-black text-white leading-tight uppercase line-clamp-2">
                  {item.headline}
                </span>
                <div
                  className="w-full h-1 rounded-full"
                  style={{ backgroundColor: item.palette.primary }}
                />
              </div>

              <div className="space-y-1 text-left">
                <span className="font-tight font-bold text-xs text-[#0F1020] block truncate">
                  {item.title}
                </span>
                <Pill variant={item.status} size="sm">
                  {item.status === 'winner' ? 'Winner' : item.status === 'needsTweak' ? 'Tweak' : 'Failed'}
                </Pill>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Reuse Panel Modal / Drawer when Winner is Selected */}
        {selectedReuseItem && (
          <div className="p-6 rounded-2xl bg-[#0F1020] text-white border border-[#4B2BFF] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in duration-300">
            <div className="space-y-2 text-left">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-[#1E9E6A]/20 text-[#1E9E6A] font-mono text-[10px] font-bold uppercase">
                  TEMPLATE WINNER ACTIVE
                </span>
                <span className="text-xs font-mono text-[#9AA0AE]">
                  Slot values preserved from previous run
                </span>
              </div>
              <h3 className="font-tight font-bold text-lg text-white">
                Fill with new product details in seconds
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                <Chip type="brand" tag="brand">Aura Acoustics</Chip>
                <Chip type="campaign" tag="headline">Over-Ear Studio Pro</Chip>
                <Chip type="campaign" tag="price">$299.00</Chip>
              </div>
            </div>

            <div className="flex items-center space-x-4 shrink-0">
              <span className="font-mono text-xs text-[#1E9E6A] font-bold">
                {library.noAiCallNotice}
              </span>
              <button
                type="button"
                onClick={() => setSelectedReuseItem(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-mono text-xs text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Closing Line */}
        <div className="text-center pt-4">
          <p className="font-sans text-sm font-medium text-[#5A6070] italic">
            {library.closingLine}
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
