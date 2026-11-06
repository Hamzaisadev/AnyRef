'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  UploadCloud,
  ImageIcon,
  Copy,
  Check,
  Zap,
  Bookmark,
  ArrowRight,
  Layers,
  Palette,
  Loader2,
  RefreshCw,
  X,
  Sliders,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useBrand } from '@/context/BrandContext';
import { renderStudioPrompt, TargetEngine } from '@/domain/studioPrompt';
import type { StudioGenerateOutput } from '@/ai/schemas';

interface PresetItem {
  id: string;
  name: string;
  category: string;
  refLabel: string;
  prodLabel: string;
  aspectRatio: string;
  drawRef: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  drawProd: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

const DEMO_PRESETS: PresetItem[] = [
  {
    id: 'cyberpunk-audio',
    name: 'Cyberpunk Audio',
    category: 'Consumer Tech',
    refLabel: 'Neon Chiaroscuro Poster',
    prodLabel: 'Wireless ANC Headphones',
    aspectRatio: '9:16',
    drawRef: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0a0a14');
      grad.addColorStop(0.5, '#1e1035');
      grad.addColorStop(1, '#050508');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Neon rim glow
      ctx.strokeStyle = '#4B2BFF';
      ctx.lineWidth = 14;
      ctx.strokeRect(20, 20, w - 40, h - 40);

      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FUTURE SOUND', w / 2, 100);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px sans-serif';
      ctx.fillText('IMMERSIVE ACOUSTICS · 2026', w / 2, 140);
    },
    drawProd: (ctx, w, h) => {
      ctx.fillStyle = '#121218';
      ctx.fillRect(0, 0, w, h);

      // Draw stylized matte black headphones
      ctx.strokeStyle = '#2B7BFF';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 20, 110, Math.PI, 0, false);
      ctx.stroke();

      ctx.fillStyle = '#1f1f2e';
      ctx.beginPath();
      ctx.ellipse(w / 2 - 110, h / 2 + 20, 35, 65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w / 2 + 110, h / 2 + 20, 35, 65, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4B2BFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NOISE-CANCELLING PRO', w / 2, h - 60);
    },
  },
  {
    id: 'luxury-skincare',
    name: 'Luxury Skincare',
    category: 'Beauty & Wellness',
    refLabel: 'Minimalist Editorial Poster',
    prodLabel: 'Botanical Face Serum',
    aspectRatio: '4:5',
    drawRef: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#F5F2EB');
      grad.addColorStop(1, '#E6DFD5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#1D1C1A';
      ctx.font = 'italic 34px serif';
      ctx.textAlign = 'center';
      ctx.fillText('L’ÉCLAT NATUREL', w / 2, 90);

      ctx.strokeStyle = '#C4A87C';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, w - 60, h - 60);
    },
    drawProd: (ctx, w, h) => {
      ctx.fillStyle = '#F8F6F0';
      ctx.fillRect(0, 0, w, h);

      // Serum dropper bottle
      ctx.fillStyle = '#2A3429';
      ctx.fillRect(w / 2 - 45, h / 2 - 40, 90, 160);

      ctx.fillStyle = '#111111';
      ctx.fillRect(w / 2 - 15, h / 2 - 90, 30, 50);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ORGANIC SERUM', w / 2, h / 2 + 40);
    },
  },
  {
    id: 'streetwear-fashion',
    name: 'Streetwear Launch',
    category: 'Apparel & Sneakers',
    refLabel: 'Brutalist Typographic Poster',
    prodLabel: 'Chunky Platform Sneaker',
    aspectRatio: '1:1',
    drawRef: (ctx, w, h) => {
      ctx.fillStyle = '#FF5500';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#000000';
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RAW DROP', w / 2, h / 2 - 40);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('LIMITED RUN // 001', w / 2, h / 2 + 20);
    },
    drawProd: (ctx, w, h) => {
      ctx.fillStyle = '#141416';
      ctx.fillRect(0, 0, w, h);

      // Sneaker silhouette
      ctx.fillStyle = '#E5E5E5';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 120, h / 2 + 40);
      ctx.lineTo(w / 2 + 120, h / 2 + 40);
      ctx.lineTo(w / 2 + 100, h / 2 - 20);
      ctx.lineTo(w / 2 - 20, h / 2 - 50);
      ctx.lineTo(w / 2 - 80, h / 2 - 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FF5500';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VELOCITY SOLE', w / 2, h - 50);
    },
  },
];

export default function StudioPage() {
  const { brands, activeBrandId } = useBrand();

  // Dual dropzone files & previews
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [prodFile, setProdFile] = useState<File | null>(null);
  const [prodPreview, setProdPreview] = useState<string | null>(null);

  // Settings
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [activeEngine, setActiveEngine] = useState<TargetEngine>('midjourney');
  const [hint, setHint] = useState<string>('');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Result & Live Editable Copy
  const [proposal, setProposal] = useState<StudioGenerateOutput | null>(null);
  const [copyFields, setCopyFields] = useState({
    headline: '',
    offer: '',
    cta: '',
    accentColor: '#4B2BFF',
    brandName: '',
  });

  // Saving & Copying feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Drag states
  const [refDragActive, setRefDragActive] = useState(false);
  const [prodDragActive, setProdDragActive] = useState(false);

  // Clean object URLs
  useEffect(() => {
    return () => {
      if (refPreview) URL.revokeObjectURL(refPreview);
      if (prodPreview) URL.revokeObjectURL(prodPreview);
    };
  }, [refPreview, prodPreview]);

  // Sync copy fields when proposal arrives
  useEffect(() => {
    if (proposal) {
      setCopyFields({
        headline: proposal.marketingCopy.headline,
        offer: proposal.marketingCopy.offer,
        cta: proposal.marketingCopy.cta,
        accentColor: proposal.marketingCopy.accentColor,
        brandName: proposal.marketingCopy.brandName,
      });
      if (proposal.visualAnalysis.suggestedAspectRatio) {
        setAspectRatio(proposal.visualAnalysis.suggestedAspectRatio);
      }
    }
  }, [proposal]);

  // Compute live rendered prompt reactively
  const liveRenderedPrompt = proposal
    ? renderStudioPrompt({
        template: proposal.promptTemplate,
        copy: {
          headline: copyFields.headline,
          offer: copyFields.offer,
          cta: copyFields.cta,
          accentColor: copyFields.accentColor,
          brandName: copyFields.brandName,
          productDescription: proposal.marketingCopy.productDescription,
        },
        engine: activeEngine,
        aspectRatio,
      })
    : '';

  function handleRefFile(file: File) {
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefFile(file);
    setRefPreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleProdFile(file: File) {
    if (prodPreview) URL.revokeObjectURL(prodPreview);
    setProdFile(file);
    setProdPreview(URL.createObjectURL(file));
    setError(null);
  }

  // Load a demo preset with authentic JPEG blobs
  async function loadPreset(preset: PresetItem) {
    setError(null);
    setAspectRatio(preset.aspectRatio);

    const canvasRef = document.createElement('canvas');
    canvasRef.width = 600;
    canvasRef.height = 800;
    const ctxRef = canvasRef.getContext('2d');
    if (ctxRef) {
      preset.drawRef(ctxRef, canvasRef.width, canvasRef.height);
      const blobRef = await new Promise<Blob | null>((res) =>
        canvasRef.toBlob(res, 'image/jpeg', 0.95)
      );
      if (blobRef) {
        const file = new File([blobRef], `${preset.id}-reference.jpg`, { type: 'image/jpeg' });
        handleRefFile(file);
      }
    }

    const canvasProd = document.createElement('canvas');
    canvasProd.width = 600;
    canvasProd.height = 600;
    const ctxProd = canvasProd.getContext('2d');
    if (ctxProd) {
      preset.drawProd(ctxProd, canvasProd.width, canvasProd.height);
      const blobProd = await new Promise<Blob | null>((res) =>
        canvasProd.toBlob(res, 'image/jpeg', 0.95)
      );
      if (blobProd) {
        const file = new File([blobProd], `${preset.id}-product.jpg`, { type: 'image/jpeg' });
        handleProdFile(file);
      }
    }
  }

  async function handleGenerate() {
    if (!refFile || !prodFile) {
      setError('Please provide both a Reference Poster and a Product Image.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Uploading images & initializing vision analysis...');
    setError(null);
    setSavedEntryId(null);

    try {
      const formData = new FormData();
      formData.append('reference', refFile);
      formData.append('product', prodFile);
      if (activeBrandId) {
        formData.append('brand_id', activeBrandId);
      }
      formData.append('aspect_ratio', aspectRatio);
      formData.append('target_engine', activeEngine);
      if (hint.trim()) {
        formData.append('hint', hint.trim());
      }

      setGenerationStep('AI deconstructing composition, lighting & commercial copy...');

      const response = await fetch('/api/studio/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Generation failed');
      }

      setProposal(data.proposal);
      setGenerationStep('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopyPrompt() {
    if (!liveRenderedPrompt) return;
    try {
      await navigator.clipboard.writeText(liveRenderedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // Fallback
    }
  }

  async function handleSaveToLibrary() {
    if (!proposal) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/studio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: activeBrandId || undefined,
          prompt_template: proposal.promptTemplate,
          headline: copyFields.headline,
          offer: copyFields.offer,
          cta: copyFields.cta,
          accent_color: copyFields.accentColor,
          brand_name: copyFields.brandName,
          engine: activeEngine,
          notes: `Dual-Drop Studio (${activeEngine}) - Product: ${proposal.marketingCopy.productDescription}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save entry');
      }

      setSavedEntryId(data.entry.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Zap className="w-3.5 h-3.5 fill-primary" />
              Dual-Drop Studio
            </span>
            <span className="text-xs text-layout-layer font-medium">Zero Mandatory Typing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight">
            Turn Any Poster Reference into Your Hero Ad
          </h1>
          <p className="text-sm text-layout-layer max-w-2xl mt-1">
            Drop a reference poster and your product photo. AI analyzes both in one call, writes high-converting copy, and generates ready-to-run prompts with instant live-tuning.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex flex-col items-start md:items-end">
          <span className="text-[11px] font-semibold text-layout-layer uppercase tracking-wider mb-2">
            1-Click Demo Presets
          </span>
          <div className="flex flex-wrap gap-2">
            {DEMO_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => loadPreset(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border-subtle hover:border-primary/40 bg-surface hover:bg-surface-hover text-ink transition-all shadow-2xs flex items-center space-x-1.5"
              >
                <Sparkles className="w-3 h-3 text-accent" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-danger hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Dual-Drop Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dropzone 1: Reference Poster */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Reference Poster</span>
            </label>
            <span className="text-xs text-layout-layer">Style, lighting & composition anchor</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setRefDragActive(true);
            }}
            onDragLeave={() => setRefDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setRefDragActive(false);
              if (e.dataTransfer.files?.[0]) handleRefFile(e.dataTransfer.files[0]);
            }}
            className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 flex flex-col items-center justify-center min-h-[260px] text-center ${
              refDragActive
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : refFile
                ? 'border-border bg-surface shadow-2xs'
                : 'border-border-subtle bg-surface/50 hover:border-primary/40 hover:bg-surface'
            }`}
          >
            {refPreview ? (
              <div className="relative w-full h-full flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={refPreview}
                  alt="Reference Poster Preview"
                  className="max-h-56 max-w-full rounded-xl object-contain shadow-sm"
                />
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-xs text-ink font-medium truncate max-w-[200px]">
                    {refFile?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRefFile(null);
                      setRefPreview(null);
                    }}
                    className="p-1 rounded-md text-layout-layer hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Remove reference"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-ink">Drop your reference poster here</p>
                <p className="text-xs text-layout-layer mt-1">or click to browse from device (PNG, JPG, WebP)</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleRefFile(e.target.files[0]);
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Dropzone 2: Hero Product */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Hero Product Photo</span>
            </label>
            <span className="text-xs text-layout-layer">Your product to feature unchanged</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setProdDragActive(true);
            }}
            onDragLeave={() => setProdDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setProdDragActive(false);
              if (e.dataTransfer.files?.[0]) handleProdFile(e.dataTransfer.files[0]);
            }}
            className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 flex flex-col items-center justify-center min-h-[260px] text-center ${
              prodDragActive
                ? 'border-accent bg-accent/5 scale-[1.01]'
                : prodFile
                ? 'border-border bg-surface shadow-2xs'
                : 'border-border-subtle bg-surface/50 hover:border-accent/40 hover:bg-surface'
            }`}
          >
            {prodPreview ? (
              <div className="relative w-full h-full flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prodPreview}
                  alt="Product Photo Preview"
                  className="max-h-56 max-w-full rounded-xl object-contain shadow-sm"
                />
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-xs text-ink font-medium truncate max-w-[200px]">
                    {prodFile?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProdFile(null);
                      setProdPreview(null);
                    }}
                    className="p-1 rounded-md text-layout-layer hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Remove product"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-ink">Drop your product image here</p>
                <p className="text-xs text-layout-layer mt-1">Packshot, cutout, or lifestyle photo</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleProdFile(e.target.files[0]);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Aspect Ratio, Target Engine, Hint, and Action */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Aspect Ratio */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-layout-layer uppercase tracking-wider">Format:</span>
            <div className="flex rounded-lg bg-surface-hover p-0.5 border border-border-subtle">
              {['9:16', '1:1', '16:9', '4:5', '3:4'].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    aspectRatio === ratio
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-layout-layer hover:text-ink'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Hint */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Optional creative hint (e.g. 'Warm golden hour rim light')"
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-subtle text-ink placeholder:text-layout-layer/60 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!refFile || !prodFile || isGenerating}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 shadow-sm ${
            !refFile || !prodFile || isGenerating
              ? 'bg-primary/40 text-white/70 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-hover active:scale-[0.98] text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{generationStep || 'Generating Prompt...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Poster Prompt</span>
            </>
          )}
        </button>
      </div>

      {/* Output Workbench */}
      {proposal && (
        <div className="space-y-6 animate-slide-up">
          {/* Engine Tabs & Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
              {(
                [
                  { id: 'midjourney', label: 'Midjourney v6.1' },
                  { id: 'flux', label: 'Flux.1' },
                  { id: 'ideogram', label: 'Ideogram' },
                  { id: 'universal', label: 'Universal' },
                ] as const
              ).map((eng) => (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => setActiveEngine(eng.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeEngine === eng.id
                      ? 'bg-primary/15 text-primary border border-primary/25 shadow-2xs'
                      : 'text-layout-layer hover:text-ink hover:bg-surface-hover'
                  }`}
                >
                  {eng.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center space-x-1.5 shadow-2xs"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveToLibrary}
                disabled={isSaving || !!savedEntryId}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                  savedEntryId
                    ? 'bg-success/15 border-success/30 text-success'
                    : 'border-border-subtle hover:border-primary/40 bg-surface hover:bg-surface-hover text-ink'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : savedEntryId ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                <span>{savedEntryId ? 'Saved to Library' : 'Save to Library'}</span>
              </button>
            </div>
          </div>

          {savedEntryId && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/25 text-success text-xs flex items-center justify-between">
              <span>Saved successfully to your entries library!</span>
              <Link
                href={`/entries/${savedEntryId}`}
                className="font-bold underline hover:opacity-80 flex items-center space-x-1"
              >
                <span>View Entry</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Workbench Grid: Live Prompt & In-Place Copy Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Live Rendered Prompt */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-layout-layer uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Production Ready Prompt ({activeEngine})</span>
                </span>
                <span className="text-[11px] font-mono text-layout-layer">
                  {liveRenderedPrompt.length} chars
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs font-mono text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap selection:bg-primary/20 relative group">
                {liveRenderedPrompt}
              </div>

              {/* Visual Analysis Chips */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-2 text-xs">
                <div className="flex items-center justify-between text-layout-layer">
                  <span className="font-semibold text-ink">Detected Architecture</span>
                  <span className="font-medium text-accent">
                    {proposal.visualAnalysis.productIdentified}
                  </span>
                </div>
                <p className="text-layout-layer leading-normal">
                  {proposal.visualAnalysis.referenceStyle}
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-layout-layer font-medium">Palette:</span>
                  <div className="flex items-center space-x-1.5">
                    {proposal.visualAnalysis.palette.map((color, idx) => (
                      <span
                        key={idx}
                        className="inline-block w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 cols: In-Place Live Copy Editor */}
            <div className="lg:col-span-5 flex flex-col space-y-4 p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-ink">Live Copy Tuning</h3>
                </div>
                <span className="text-[11px] text-layout-layer">Instant Live Sync</span>
              </div>

              <div className="space-y-3.5">
                {/* Headline */}
                <div>
                  <label className="block text-xs font-semibold text-layout-layer mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={copyFields.headline}
                    onChange={(e) =>
                      setCopyFields((prev) => ({ ...prev, headline: e.target.value }))
                    }
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-border-subtle bg-surface-subtle text-ink focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                {/* Offer / Badge */}
                <div>
                  <label className="block text-xs font-semibold text-layout-layer mb-1">
                    Offer / Promotional Badge
                  </label>
                  <input
                    type="text"
                    value={copyFields.offer}
                    onChange={(e) =>
                      setCopyFields((prev) => ({ ...prev, offer: e.target.value }))
                    }
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-border-subtle bg-surface-subtle text-ink focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                {/* Call To Action */}
                <div>
                  <label className="block text-xs font-semibold text-layout-layer mb-1">
                    Call To Action (CTA)
                  </label>
                  <input
                    type="text"
                    value={copyFields.cta}
                    onChange={(e) =>
                      setCopyFields((prev) => ({ ...prev, cta: e.target.value }))
                    }
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-border-subtle bg-surface-subtle text-ink focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-xs font-semibold text-layout-layer mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={copyFields.accentColor}
                      onChange={(e) =>
                        setCopyFields((prev) => ({ ...prev, accentColor: e.target.value }))
                      }
                      className="w-8 h-8 rounded-lg border border-border-subtle cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={copyFields.accentColor}
                      onChange={(e) =>
                        setCopyFields((prev) => ({ ...prev, accentColor: e.target.value }))
                      }
                      className="flex-1 text-xs font-mono px-3 py-2 rounded-lg border border-border-subtle bg-surface-subtle text-ink focus:outline-none focus:border-primary/60 transition-colors uppercase"
                    />
                  </div>
                </div>

                {/* Brand Name */}
                <div>
                  <label className="block text-xs font-semibold text-layout-layer mb-1">
                    Brand Name / Wordmark
                  </label>
                  <input
                    type="text"
                    value={copyFields.brandName}
                    onChange={(e) =>
                      setCopyFields((prev) => ({ ...prev, brandName: e.target.value }))
                    }
                    placeholder="e.g. AURA LABS"
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-border-subtle bg-surface-subtle text-ink focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-layout-layer">
                <span>Modifying any field updates prompt live.</span>
                <button
                  type="button"
                  onClick={() => {
                    if (proposal) {
                      setCopyFields({
                        headline: proposal.marketingCopy.headline,
                        offer: proposal.marketingCopy.offer,
                        cta: proposal.marketingCopy.cta,
                        accentColor: proposal.marketingCopy.accentColor,
                        brandName: proposal.marketingCopy.brandName,
                      });
                    }
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Reset Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
