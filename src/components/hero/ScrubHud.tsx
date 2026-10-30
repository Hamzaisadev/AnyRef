'use client';

import React from 'react';
import { Layers, ShieldCheck, Sparkles, Cpu, Eye, ArrowDown } from 'lucide-react';

interface ScrubHudProps {
  progress: number; // 0 to 1
  activeStage: number; // 0 to 3
  activeLayer: string | null;
  onSelectStage: (stageIndex: number) => void;
  onToggleLayer: (layerId: string) => void;
}

export function ScrubHud({
  progress,
  activeStage,
  activeLayer,
  onSelectStage,
  onToggleLayer,
}: ScrubHudProps) {
  const stages = [
    { id: 0, label: '01 RAW POSTER', desc: 'Reference Ingestion' },
    { id: 1, label: '02 3D EXPLODE', desc: 'Layer Separation' },
    { id: 2, label: '03 DNA INJECT', desc: 'Brand Token Slotting' },
    { id: 3, label: '04 COMPILED', desc: 'Production Prompt' },
  ];

  const layerFilters = [
    { id: 'all', label: 'All Layers' },
    { id: 'geometry', label: '01 Geometry' },
    { id: 'lighting', label: '02 Lighting' },
    { id: 'slots', label: '03 Slots' },
    { id: 'brand', label: '04 Brand DNA' },
    { id: 'shield', label: '05 Shield' },
  ];

  const percent = Math.round(progress * 100);

  return (
    <div
      className="pointer-events-auto flex flex-col gap-3 w-full max-w-5xl mx-auto px-4 text-xs font-mono select-none"
      role="region"
      aria-label="Deconstruction Telemetry HUD"
    >
      {/* Top telemetry status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 sm:px-4 rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur-md shadow-2xl text-slate-300">
        {/* Left: System status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-bold text-white tracking-wider text-[11px]">DECONSTRUCT // ENGINE</span>
          </div>
          <span className="hidden sm:inline text-white/20">|</span>
          <div className="hidden sm:flex items-center space-x-2 text-[10px] text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI VISION 1.5 PRO</span>
          </div>
        </div>

        {/* Center: Stage buttons */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 sm:py-0">
          {stages.map((stage) => {
            const isActive = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] transition-all duration-200 border flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-primary/25 border-primary text-white shadow-[0_0_12px_rgba(75,43,255,0.4)]'
                    : 'border-white/5 text-slate-400 hover:text-white hover:border-white/20 bg-white/5'
                }`}
                title={stage.desc}
                aria-pressed={isActive}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-slate-600'}`} />
                <span>{stage.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Scrub percentage gauge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-400">SCRUB:</span>
            <span className="text-cyan-400 font-bold min-w-[34px] text-right">{percent}%</span>
          </div>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-primary to-accent transition-all duration-75"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Secondary HUD bar: Layer Filter Controls & Safety Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
        {/* Layer isolation chips */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden md:inline">Layers:</span>
          {layerFilters.map((lf) => {
            const isSelected = activeLayer === lf.id || (lf.id === 'all' && !activeLayer);
            return (
              <button
                key={lf.id}
                onClick={() => onToggleLayer(lf.id)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors border ${
                  isSelected
                    ? 'border-cyan-400/60 bg-cyan-950/40 text-cyan-300 font-semibold'
                    : 'border-white/5 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lf.label}
              </button>
            );
          })}
        </div>

        {/* Telemetry badges */}
        <div className="flex items-center space-x-2 text-[10px]">
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>NEVER-INVENT: ARMED</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>REUSE COST: $0.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
