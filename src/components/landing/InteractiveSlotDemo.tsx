'use client';

import { useState } from 'react';
import { Copy, Check, Sparkles, ShieldAlert, Layers, Image as ImageIcon, Sliders } from 'lucide-react';

interface DemoTemplate {
  category: string;
  title: string;
  brand: {
    name: string;
    wordmark: string;
    colors: string;
    rules: string;
  };
  campaign: {
    product: string;
    headline: string;
    discountNeedsYou: string;
  };
  layoutText: {
    composition: string;
    lighting: string;
    framing: string;
  };
  attachList: string[];
}

export default function InteractiveSlotDemo() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const demos: DemoTemplate[] = [
    {
      category: 'Beverage & FMCG',
      title: 'Artisan Cold Brew Poster',
      brand: {
        name: 'Sol Roast Coffee Co.',
        wordmark: 'SOL ROAST',
        colors: 'terracotta #C85A32 and cream #FDFBF7',
        rules: 'clean editorial layout, no neon effects, matte paper texture',
      },
      campaign: {
        product: 'Single-Origin Nitro Cold Brew glass bottle with golden amber liquid and condensation droplets',
        headline: 'Steeped for 24 Hours in Single-Origin Radiance',
        discountNeedsYou: '20% OFF FIRST 6-PACK',
      },
      layoutText: {
        composition: 'Minimalist studio product poster, 4:5 aspect ratio, centered hero placement on elevated stone pedestal',
        lighting: 'Warm 45-degree directional morning sun casting crisp linear architectural shadows',
        framing: 'Eye-level macro framing, shallow depth of field, premium Japanese graphic design aesthetic',
      },
      attachList: ['1. High-res product bottle cutout (PNG)', '2. SOL ROAST vector wordmark (SVG)'],
    },
    {
      category: 'Footwear & Apparel',
      title: 'Minimalist Streetwear Drop',
      brand: {
        name: 'AETHER Lab',
        wordmark: 'AETHER / 01',
        colors: 'raw titanium #D1D5DB and cobalt #2563EB',
        rules: 'monochrome industrial aesthetic, sans-serif typography, brutalist grid',
      },
      campaign: {
        product: 'AETHER 01 raw canvas runner sneaker suspended mid-air at 30-degree forward tilt',
        headline: 'Engineered for Gravity Defiance',
        discountNeedsYou: 'LIMITED RUN OF 500 PAIRS',
      },
      layoutText: {
        composition: 'Swiss modernist promotional poster layout, dynamic diagonal tension, generous negative space',
        lighting: 'Diffused top softbox with subtle rim light highlighting textured vulcanized rubber sole',
        framing: 'Low-angle heroic 3/4 perspective, clean studio backdrop with micro-concrete grain',
      },
      attachList: ['1. Sneaker profile transparent cutout (PNG)', '2. AETHER vector glyph (SVG)'],
    },
    {
      category: 'Beauty & Skincare',
      title: 'Botanical Serum Editorial',
      brand: {
        name: 'Flora & Bark Botanicals',
        wordmark: 'FLORA & BARK',
        colors: 'forest sage #4A6B53 and warm travertine #EAE4D9',
        rules: 'organic luxury, muted earth tones, delicate serif typography',
      },
      campaign: {
        product: 'Frosted amber glass dropper bottle containing golden botanical seed oil',
        headline: 'Awaken Cellular Radiance with Wild Alpine Botanicals',
        discountNeedsYou: 'LAUNCHING NOVEMBER 12',
      },
      layoutText: {
        composition: 'Vogue-style cosmetic editorial poster, off-center golden ratio arrangement with organic wet stone props',
        lighting: 'Soft dappled sunlight filtering through lush monstera leaves, natural caustic water reflections',
        framing: 'Close-up tabletop flat-angle, delicate atmospheric mist, high dynamic range editorial grade',
      },
      attachList: ['1. Serum dropper bottle cutout (PNG)', '2. Brand logo emblem (SVG)', '3. Wet stone texture reference (JPG)'],
    },
  ];

  const current = (demos[activeTab] || demos[0])!;

  const handleCopy = () => {
    const rawPrompt = `${current.layoutText.composition}. ${current.layoutText.lighting}. ${current.layoutText.framing}. Featuring ${current.campaign.product}. Brand wordmark "${current.brand.wordmark}", brand palette of ${current.brand.colors}. Campaign headline: "${current.campaign.headline}". [Special Note: ${current.campaign.discountNeedsYou}]. Rules: ${current.brand.rules}. --ar 4:5 --v 6.1`;
    navigator.clipboard.writeText(rawPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section 
      aria-label="Interactive Slot Architecture Demo" 
      className="py-12 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full"
    >
      <div className="rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="border-b border-white/10 p-5 sm:p-6 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Live Architecture Preview</span>
            </div>
            <h3 className="font-tight font-bold text-xl sm:text-2xl text-white">
              Tri-Color Slot Encoding in Action
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              See how AnyRef separates Layout, Brand, and Campaign variables into bulletproof prompt templates.
            </p>
          </div>

          {/* Interactive Preset Buttons */}
          <div 
            role="tablist" 
            aria-label="Demo Templates" 
            className="flex flex-wrap gap-2 p-1.5 bg-black/60 rounded-2xl border border-white/10 self-start md:self-auto"
          >
            {demos.map((d, index) => (
              <button
                key={index}
                role="tab"
                aria-selected={activeTab === index}
                onClick={() => setActiveTab(index)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  activeTab === index
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {d.category}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-5 sm:px-6 py-3 border-b border-white/5 bg-slate-950 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400" aria-hidden="true" />
            <span className="text-slate-200">Brand Slots (Auto-locked)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" aria-hidden="true" />
            <span className="text-slate-200">Campaign Slots (Per-product)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-slate-400" aria-hidden="true" />
            <span className="text-slate-200">Layout Text (Poster reference)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
              Needs you
            </span>
            <span className="text-slate-200">Never-Invent Guard</span>
          </div>
        </div>

        {/* Live Prompt Container */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-slate-400 uppercase">
                Compiled Monospace Prompt:
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/15 hover:border-cyan-400/40 text-xs font-mono font-semibold text-white transition-colors shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px]"
                aria-label="Copy compiled prompt"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Pure Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Prompt Token Rendering */}
            <div className="font-mono text-xs sm:text-sm leading-relaxed p-5 sm:p-6 rounded-2xl bg-black/60 border border-white/10 overflow-x-auto selection:bg-primary/40 text-slate-300">
              {/* Layout Text 1 */}
              <span className="text-slate-400">{current.layoutText.composition}. </span>
              <span className="text-slate-400">{current.layoutText.lighting}. </span>
              <span className="text-slate-400">{current.layoutText.framing}. </span>

              {/* Campaign Product Slot */}
              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40 font-medium">
                {current.campaign.product}
              </span>
              <span className="text-slate-400">. </span>

              {/* Brand Wordmark Slot */}
              <span className="text-slate-400">Featuring brand wordmark </span>
              <span className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold">
                "{current.brand.wordmark}"
              </span>

              {/* Brand Palette Slot */}
              <span className="text-slate-400"> adhering strictly to palette </span>
              <span className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-medium">
                {current.brand.colors}
              </span>
              <span className="text-slate-400">. </span>

              {/* Campaign Headline Slot */}
              <span className="text-slate-400">Typography headline reads: </span>
              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40 font-semibold">
                "{current.campaign.headline}"
              </span>
              <span className="text-slate-400">. </span>

              {/* Never-Invent Slot */}
              <span className="text-slate-400">Subhead discount tag: </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40 font-bold">
                <ShieldAlert className="w-3 h-3 text-rose-300" />
                <span>{current.campaign.discountNeedsYou}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-rose-500/30 uppercase">Needs you</span>
              </span>
              <span className="text-slate-400">. </span>

              {/* Brand Negative Rules */}
              <span className="text-slate-400">Brand negative rules: </span>
              <span className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-medium">
                {current.brand.rules}
              </span>
              <span className="text-slate-400"> --ar 4:5 --style raw --v 6.1</span>
            </div>
          </div>

          {/* Attach in Flow Checklist */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center space-x-2 text-white font-mono font-semibold text-xs uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ordered Attach in Flow Guide (Upload to Midjourney / Flux in this sequence):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {current.attachList.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center space-x-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-200"
                >
                  <span className="w-4 h-4 rounded-full bg-cyan-400/20 text-cyan-300 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
