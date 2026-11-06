'use client';

import { useState, useEffect, use, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Copy,
  Check,
  Eye,
  Paperclip,
  AlertCircle,
  Tag,
  Sliders,
  Sparkles,
  ArrowRight,
  Terminal,
  Edit2,
  Plus,
  Loader2,
  X,
  GitFork,
  Download,
  Image as ImageIcon,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileJson,
  Upload,
  ExternalLink,
  Cpu,
  Palette,
  Maximize2,
} from 'lucide-react';
import type { Entry } from '@/domain/entry';
import type { Brand } from '@/domain/brand';
import { type Slot, resolveBrandSlotValue } from '@/domain/slot';
import { renderPrompt, RenderResult } from '@/domain/renderPrompt';
import {
  compilePrompt,
  compileAllTargets,
  type TargetModel,
  type AspectRatio,
  type CompiledPrompt,
} from '@/domain/promptCompiler';
import { SlotPreview } from '@/components/SlotPreview';
import { validatePromptTemplate } from '@/domain/validateTemplate';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Copies an image directly to the system clipboard using navigator.clipboard.write.
 * Converts to image/png via canvas to satisfy strict browser MIME type support.
 */
async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();

    if (blob.type === 'image/png') {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }

    // Convert JPEG/WebP/SVG to PNG for clipboard compliance
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const blobUrl = URL.createObjectURL(blob);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = blobUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 400;
    canvas.height = img.naturalHeight || 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(blobUrl);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!pngBlob) throw new Error('Canvas conversion to PNG failed');

    const item = new ClipboardItem({ 'image/png': pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    // Graceful fallback: copy direct image URL so caller has asset link
    await navigator.clipboard.writeText(imageUrl);
    return false;
  }
}

/**
 * Downloads an asset to user machine
 */
async function downloadAsset(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function WorkbenchContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [slotValues, setSlotValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [copiedPart, setCopiedPart] = useState<'all' | 'positive' | 'negative' | 'json' | null>(null);
  const [remixing, setRemixing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Multi-Model Target Compiler State
  const [targetModel, setTargetModel] = useState<TargetModel>('midjourney');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [rawMode, setRawMode] = useState<boolean>(true);
  const [stylizeVal, setStylizeVal] = useState<number>(100);

  // Asset Drawer State
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(true);
  const [assetCopiedId, setAssetCopiedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [localCutouts, setLocalCutouts] = useState<{ id: string; name: string; url: string }[]>([]);
  const cutoutInputRef = useRef<HTMLInputElement>(null);

  // Template editing state (S2-10)
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState('');
  const [editedSlots, setEditedSlots] = useState<Slot[]>([]);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateErrors, setTemplateErrors] = useState<string[]>([]);
  const [newSlotKey, setNewSlotKey] = useState('');
  const [newSlotLabel, setNewSlotLabel] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const entryRes = await fetch(`/api/entries/${id}`);
        if (!entryRes.ok) throw new Error('Entry not found');
        const entryData = await entryRes.json();
        const loadedEntry: Entry = entryData.entry;
        setEntry(loadedEntry);

        // Fetch brand
        const brandRes = await fetch(`/api/brands/${loadedEntry.brand_id}`);
        let loadedBrand: Brand | null = null;
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          loadedBrand = brandData.brand;
          setBrand(loadedBrand);
        }

        // Set default aspect ratio based on intended product shape
        if (loadedEntry.intended_product_shape === 'tall') {
          setAspectRatio('9:16');
        } else if (loadedEntry.intended_product_shape === 'wide') {
          setAspectRatio('16:9');
        } else if (loadedEntry.intended_product_shape === 'square') {
          setAspectRatio('1:1');
        }

        // Populate initial slot values with brand defaults, brand default_values, and query params
        const initialValues: Record<string, string> = {};
        for (const slot of loadedEntry.slots) {
          if (loadedBrand) {
            const brandVal = resolveBrandSlotValue(slot, loadedBrand);
            const defVal = loadedBrand.default_values?.[slot.key];
            if (brandVal) {
              initialValues[slot.key] = brandVal;
            } else if (defVal) {
              initialValues[slot.key] = defVal;
            } else if (slot.default) {
              initialValues[slot.key] = slot.default;
            }
          } else if (slot.default) {
            initialValues[slot.key] = slot.default;
          }
        }

        // Search params take precedence if passed from autofill or URL
        searchParams.forEach((val, key) => {
          if (val) {
            initialValues[key] = val;
          }
        });

        setSlotValues(initialValues);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workbench');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, searchParams]);

  function handleSlotChange(key: string, value: string) {
    setSlotValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // Compute live prompt rendering
  const renderResult: RenderResult = entry
    ? renderPrompt(entry.prompt_template, entry.slots, slotValues)
    : { text: '', missingRequired: [], warnings: [], attachChecklist: [] };

  // Multi-Model Compilation
  const compiledPrompt: CompiledPrompt = compilePrompt(renderResult.text, targetModel, {
    aspectRatio,
    negativePrompt: brand?.never_do_rules || undefined,
    rawMode,
    stylize: stylizeVal,
  });

  // Combined warnings from renderer + target compiler
  const allWarnings = [...renderResult.warnings, ...compiledPrompt.warnings];

  async function handleCopyTargetPrompt() {
    await navigator.clipboard.writeText(compiledPrompt.fullCommand);
    setCopied(true);
    setCopiedPart('all');
    setTimeout(() => {
      setCopied(false);
      setCopiedPart(null);
    }, 2000);
  }

  async function handleCopyPart(textToCopy: string, part: 'positive' | 'negative' | 'json') {
    await navigator.clipboard.writeText(textToCopy);
    setCopiedPart(part);
    setTimeout(() => setCopiedPart(null), 2000);
  }

  async function handleCopyAsset(url: string, assetId: string) {
    const success = await copyImageToClipboard(url);
    setAssetCopiedId(assetId);
    setTimeout(() => setAssetCopiedId(null), 2500);
  }

  function handleCutoutUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const newCutout = {
        id: `cutout-${Date.now()}`,
        name: file.name,
        url,
      };
      setLocalCutouts((prev) => [newCutout, ...prev]);
    }
  }

  async function handleRemix() {
    if (!entry) return;
    setRemixing(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}/remix`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.entry?.id) {
          router.push(`/entries/${data.entry.id}`);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error?.message || 'Failed to remix entry');
      }
    } catch {
      setError('Network error while remixing entry');
    } finally {
      setRemixing(false);
    }
  }

  function handleStartEditTemplate() {
    if (!entry) return;
    setEditedTemplate(entry.prompt_template);
    setEditedSlots([...entry.slots]);
    setTemplateErrors([]);
    setNewSlotKey('');
    setNewSlotLabel('');
    setIsEditingTemplate(true);
  }

  function handleCancelEditTemplate() {
    setIsEditingTemplate(false);
    setTemplateErrors([]);
  }

  function handleCollapseSlot(slotKey: string) {
    const slot = editedSlots.find((s) => s.key === slotKey);
    const replacement = slot?.default || slot?.label || '';
    const updatedTemplate = editedTemplate.replaceAll(`{{${slotKey}}}`, replacement);
    const updatedSlots = editedSlots.filter((s) => s.key !== slotKey);
    setEditedTemplate(updatedTemplate);
    setEditedSlots(updatedSlots);
  }

  function handleMakeSlot() {
    const rawKey = newSlotKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!rawKey) return;
    if (editedSlots.some((s) => s.key === rawKey)) {
      setTemplateErrors([`Slot "${rawKey}" already exists.`]);
      return;
    }

    const label =
      newSlotLabel.trim() || rawKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const newSlot: Slot = {
      key: rawKey,
      label,
      type: 'short_text',
      required: true,
      optional_block: false,
      never_invent: false,
      brand_field: null,
    };

    let updatedTemplate = editedTemplate;
    if (!updatedTemplate.includes(`{{${rawKey}}}`)) {
      updatedTemplate = `${updatedTemplate.trim()} {{${rawKey}}}`;
    }

    setEditedTemplate(updatedTemplate);
    setEditedSlots([...editedSlots, newSlot]);
    setNewSlotKey('');
    setNewSlotLabel('');
    setTemplateErrors([]);
  }

  async function handleSaveTemplate() {
    if (!entry) return;
    const validation = validatePromptTemplate(editedTemplate, editedSlots);
    if (!validation.valid) {
      setTemplateErrors(validation.errors);
      return;
    }

    setTemplateSaving(true);
    setTemplateErrors([]);

    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_template: editedTemplate,
          slots: editedSlots,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setTemplateErrors([data.error?.message || 'Failed to update template']);
      } else {
        const data = await res.json();
        setEntry(data.entry);
        setIsEditingTemplate(false);
      }
    } catch {
      setTemplateErrors(['Network communication error while saving template']);
    } finally {
      setTemplateSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-layout-layer text-sm font-medium">Loading workbench template...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-5 bg-danger/10 border border-danger/20 text-danger rounded-2xl flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{error || 'Entry not found'}</span>
      </div>
    );
  }

  // Model tab configurations
  const modelTabs: { id: TargetModel; label: string; badge?: string }[] = [
    { id: 'midjourney', label: 'Midjourney v6.1', badge: '--ar & raw' },
    { id: 'flux', label: 'Flux.1', badge: 'Natural Flow' },
    { id: 'ideogram', label: 'Ideogram 2.0', badge: 'Quoted Type' },
    { id: 'sd_comfyui', label: 'SD / ComfyUI', badge: '+ / - Split' },
  ];

  const aspectRatios: AspectRatio[] = ['4:5', '9:16', '1:1', '16:9', '3:4', '21:9'];

  return (
    <div className="space-y-8">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-surface rounded-2xl p-2 shadow-2xl border border-border-subtle" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Asset full view"
              className="max-h-[85vh] max-w-full rounded-xl object-contain mx-auto"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-ink/70 hover:bg-ink text-white rounded-full transition-colors cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="text-xs font-mono uppercase bg-surface-muted text-layout-layer px-2.5 py-0.5 rounded-md font-semibold border border-border-subtle">
              {entry.poster_type || 'POSTER'}
            </span>
            <span className="text-xs font-semibold text-primary flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Brand: {brand?.name || 'Active Brand'}</span>
            </span>
            {entry.intended_product_shape && (
              <span className="text-[11px] font-mono text-layout-layer bg-surface-muted px-2 py-0.5 rounded border border-border-subtle capitalize">
                {entry.intended_product_shape} shape
              </span>
            )}
          </div>
          <h1 className="font-tight font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Prompt Workbench
          </h1>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleRemix}
            disabled={remixing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-border-subtle rounded-xl text-xs sm:text-sm font-semibold hover:bg-surface-hover transition-all text-ink active:scale-[0.98] disabled:opacity-50 min-h-[40px] cursor-pointer"
          >
            {remixing ? (
              <Loader2 className="w-4 h-4 animate-spin text-layout-layer" />
            ) : (
              <GitFork className="w-4 h-4 text-layout-layer" />
            )}
            <span>Remix</span>
          </button>
          <Link
            href={`/entries/${entry.id}/compare`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-border-subtle rounded-xl text-xs sm:text-sm font-semibold hover:bg-surface-hover transition-all text-ink active:scale-[0.98] min-h-[40px]"
          >
            <Eye className="w-4 h-4 text-layout-layer" />
            <span>Visual Compare</span>
          </Link>
          <button
            onClick={handleCopyTargetPrompt}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] min-h-[40px] cursor-pointer ${
              copied
                ? 'bg-success text-white'
                : 'bg-primary text-primary-fg hover:opacity-90'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied for {compiledPrompt.label}!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy for {compiledPrompt.label}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Asset Drawer Card */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden transition-all">
        <div
          onClick={() => setIsAssetDrawerOpen((prev) => !prev)}
          className="flex items-center justify-between p-4 sm:p-5 bg-surface-muted/60 hover:bg-surface-muted transition-colors cursor-pointer border-b border-border-subtle/50"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-tight font-bold text-sm text-ink">
                  Interactive Asset Drawer
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                  1-Click Clipboard
                </span>
              </div>
              <p className="text-xs text-layout-layer">
                Copy brand logos, reference posters, and product cutouts directly to clipboard for generator paste.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-layout-layer hidden sm:inline">
              {isAssetDrawerOpen ? 'Collapse' : 'Expand Assets'}
            </span>
            {isAssetDrawerOpen ? (
              <ChevronUp className="w-4 h-4 text-layout-layer" />
            ) : (
              <ChevronDown className="w-4 h-4 text-layout-layer" />
            )}
          </div>
        </div>

        {isAssetDrawerOpen && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Asset 1: Brand Logo */}
              <div className="p-4 rounded-xl border border-border-subtle bg-surface-muted space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-ink">Brand Identity</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-layer/15 text-brand-layer font-semibold">
                      Logo
                    </span>
                  </div>

                  <div className="h-28 rounded-lg bg-surface border border-border-subtle flex items-center justify-center p-2 overflow-hidden">
                    {brand?.logo_path ? (
                      <img
                        src={brand.logo_path}
                        alt="Brand logo"
                        className="max-h-full max-w-full object-contain cursor-pointer"
                        onClick={() => setLightboxImage(brand.logo_path || null)}
                      />
                    ) : (
                      <div className="text-center space-y-1">
                        <span className="font-tight font-black text-ink text-lg tracking-wider">
                          {brand?.wordmark || brand?.name || 'WORDMARK'}
                        </span>
                        <p className="text-[10px] text-layout-layer">SVG Wordmark</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  {brand?.logo_path ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyAsset(brand.logo_path!, 'brand-logo')}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-primary text-primary-fg rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                      >
                        {assetCopiedId === 'brand-logo' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Image!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Image</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAsset(brand.logo_path!, `${brand.name || 'brand'}-logo.png`)}
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface text-layout-layer hover:text-ink transition-colors cursor-pointer"
                        title="Download logo file"
                        aria-label="Download logo file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(brand?.wordmark || brand?.name || '');
                        setAssetCopiedId('brand-wordmark');
                        setTimeout(() => setAssetCopiedId(null), 2000);
                      }}
                      className="w-full inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-primary text-primary-fg rounded-lg text-xs font-semibold hover:opacity-90 cursor-pointer shadow-2xs"
                    >
                      {assetCopiedId === 'brand-wordmark' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied Wordmark!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Wordmark Text</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Asset 2: Reference Poster */}
              <div className="p-4 rounded-xl border border-border-subtle bg-surface-muted space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-ink">Reference Poster</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-layout-layer font-semibold border border-border-subtle">
                      Layout
                    </span>
                  </div>

                  <div className="h-28 rounded-lg bg-surface border border-border-subtle flex items-center justify-center p-2 overflow-hidden relative group">
                    {entry.reference_path ? (
                      <>
                        <img
                          src={entry.reference_path}
                          alt="Reference poster"
                          className="max-h-full max-w-full object-contain cursor-pointer"
                          onClick={() => setLightboxImage(entry.reference_path || null)}
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxImage(entry.reference_path || null)}
                          className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                          title="Zoom"
                          aria-label="Zoom reference poster"
                        >
                          <Maximize2 className="w-5 h-5 drop-shadow" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-layout-layer">No reference uploaded</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  {entry.reference_path ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyAsset(entry.reference_path!, 'reference-poster')}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-primary text-primary-fg rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                      >
                        {assetCopiedId === 'reference-poster' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Image!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Image</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAsset(entry.reference_path!, `reference-${entry.id}.png`)}
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface text-layout-layer hover:text-ink transition-colors cursor-pointer"
                        title="Download reference image"
                        aria-label="Download reference image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-layout-layer italic py-1">Attach in Flow #1</span>
                  )}
                </div>
              </div>

              {/* Asset 3: Brand Palette Swatches */}
              <div className="p-4 rounded-xl border border-border-subtle bg-surface-muted space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-ink">Palette Swatches</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
                      Hex Codes
                    </span>
                  </div>

                  <div className="h-28 rounded-lg bg-surface border border-border-subtle p-2 flex flex-col justify-center space-y-2">
                    {brand?.colors && brand.colors.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {brand.colors.slice(0, 3).map((hex, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(hex);
                              setAssetCopiedId(`color-${i}`);
                              setTimeout(() => setAssetCopiedId(null), 2000);
                            }}
                            className="group flex flex-col items-center space-y-1 p-1 rounded-md hover:bg-surface-muted transition-colors cursor-pointer"
                            title={`Copy hex ${hex}`}
                          >
                            <span
                              className="w-7 h-7 rounded-md shadow-2xs border border-border-subtle block"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="text-[10px] font-mono text-ink group-hover:text-primary font-medium">
                              {assetCopiedId === `color-${i}` ? 'Copied!' : hex}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-layout-layer text-center">No brand colors configured</p>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const text = brand?.colors?.join(', ') || '';
                      navigator.clipboard.writeText(text);
                      setAssetCopiedId('palette-all');
                      setTimeout(() => setAssetCopiedId(null), 2000);
                    }}
                    disabled={!brand?.colors?.length}
                    className="w-full inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs font-semibold hover:bg-surface transition-colors cursor-pointer text-ink disabled:opacity-40"
                  >
                    {assetCopiedId === 'palette-all' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span className="text-success">All Hex Codes Copied!</span>
                      </>
                    ) : (
                      <>
                        <Palette className="w-3.5 h-3.5 text-layout-layer" />
                        <span>Copy All Colors</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Asset 4: Local Product Cutout Scratchpad */}
              <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-ink">Product Cutout</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                      Scratchpad
                    </span>
                  </div>

                  <input
                    ref={cutoutInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCutoutUpload}
                    className="hidden"
                    aria-label="Upload temporary product cutout"
                  />

                  <div
                    onClick={() => cutoutInputRef.current?.click()}
                    className="h-28 rounded-lg border border-dashed border-primary/30 bg-surface/60 hover:bg-surface flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors"
                  >
                    {localCutouts[0] ? (
                      <img
                        src={localCutouts[0].url}
                        alt="Local cutout preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-5 h-5 mx-auto text-primary" />
                        <span className="text-xs font-semibold text-ink block">Upload Cutout</span>
                        <p className="text-[10px] text-layout-layer">Drop PNG cutout to copy</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  {localCutouts[0] ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyAsset(localCutouts[0]!.url, 'local-cutout')}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-primary text-primary-fg rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                      >
                        {assetCopiedId === 'local-cutout' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Image!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Cutout</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAsset(localCutouts[0]!.url, localCutouts[0]!.name)}
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface text-layout-layer hover:text-ink transition-colors cursor-pointer"
                        title="Download cutout"
                        aria-label="Download cutout"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cutoutInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-surface border border-border-subtle rounded-lg text-xs font-semibold hover:bg-surface-hover transition-colors text-ink cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary" />
                      <span>Add Local Asset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Slot Input Form (6 cols) */}
        <div className="lg:col-span-6 bg-surface p-6 sm:p-7 rounded-2xl border border-border-subtle shadow-xs space-y-6">
          <div>
            <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-accent" />
              <span>Campaign &amp; Brand Variables</span>
            </h2>
            <p className="text-xs text-layout-layer mt-1 leading-relaxed">
              Brand wordmarks and legal footers are auto-populated. Enter headline and promo variables below.
            </p>
          </div>

          <div className="space-y-4">
            {entry.slots
              .filter((slot) => slot.type !== 'attachment')
              .map((slot) => {
                const val = slotValues[slot.key] || '';
                const isNeverInvent = slot.never_invent;
                const isBrandSlot = Boolean(slot.brand_field);
                const charRatio = slot.max_length ? val.length / slot.max_length : 0;

                return (
                  <div
                    key={slot.key}
                    className="space-y-2 p-4 rounded-xl border border-border-subtle bg-surface-muted transition-colors hover:border-border-strong"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor={`slot-${slot.key}`}
                          className="text-xs font-mono font-bold text-ink"
                        >
                          {slot.label}
                        </label>
                        {isBrandSlot && (
                          <span className="text-[10px] px-2 py-0.5 bg-brand-layer/15 text-brand-layer rounded-full font-semibold">
                            Brand Slot
                          </span>
                        )}
                        {isNeverInvent && (
                          <span className="text-[10px] px-2 py-0.5 bg-accent/20 text-accent font-semibold rounded-full">
                            Needs You
                          </span>
                        )}
                      </div>

                      {slot.max_length && (
                        <span
                          className={`text-[11px] font-mono font-medium ${
                            charRatio > 0.9
                              ? 'text-danger'
                              : charRatio > 0.75
                              ? 'text-accent'
                              : 'text-layout-layer'
                          }`}
                        >
                          {val.length}/{slot.max_length}
                        </span>
                      )}
                    </div>

                    {slot.type === 'choice' && slot.options ? (
                      <select
                        id={`slot-${slot.key}`}
                        value={val}
                        onChange={(e) => handleSlotChange(slot.key, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface text-ink font-medium cursor-pointer"
                      >
                        <option value="">Select option...</option>
                        {slot.options.map((opt) => (
                          <option key={opt} value={opt} className="bg-surface text-ink">
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`slot-${slot.key}`}
                        type="text"
                        value={val}
                        maxLength={slot.max_length}
                        onChange={(e) => handleSlotChange(slot.key, e.target.value)}
                        placeholder={slot.hint || `Enter ${slot.label.toLowerCase()}...`}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface text-ink font-medium placeholder:text-layout-layer/70"
                      />
                    )}

                    {slot.hint && (
                      <p className="text-[11px] text-layout-layer leading-relaxed">{slot.hint}</p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Multi-Model Target Compiler & Output (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Target Model Selector Card */}
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-primary" />
                <h3 className="font-tight font-bold text-sm text-ink">
                  Multi-Model Target Compiler
                </h3>
              </div>

              {/* Aspect Ratio Selector Chips */}
              <div className="flex items-center space-x-1 bg-surface-muted p-1 rounded-xl border border-border-subtle text-xs">
                <span className="text-[10px] text-layout-layer px-1.5 font-semibold">AR:</span>
                {aspectRatios.map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setAspectRatio(ar)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      aspectRatio === ar
                        ? 'bg-primary text-primary-fg shadow-2xs'
                        : 'text-layout-layer hover:text-ink hover:bg-surface'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {modelTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTargetModel(tab.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    targetModel === tab.id
                      ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary'
                      : 'border-border-subtle bg-surface-muted hover:border-border-strong text-layout-layer'
                  }`}
                >
                  <span className="block text-xs font-bold text-ink leading-tight">
                    {tab.label}
                  </span>
                  {tab.badge && (
                    <span className="inline-block mt-1 text-[10px] font-mono opacity-80">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Model-Specific Tuning Controls */}
            {targetModel === 'midjourney' && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-surface-muted rounded-xl border border-border-subtle text-xs">
                <label className="flex items-center space-x-2 cursor-pointer font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={rawMode}
                    onChange={(e) => setRawMode(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span>--style raw (Commercial Realism)</span>
                </label>

                <div className="flex items-center space-x-2 font-medium text-ink">
                  <span>Stylize (--s):</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={stylizeVal}
                    onChange={(e) => setStylizeVal(Number(e.target.value))}
                    className="w-24 accent-primary cursor-pointer"
                  />
                  <span className="font-mono text-xs w-8">{stylizeVal}</span>
                </div>
              </div>
            )}

            {/* Quality Warnings Alert Banner */}
            {allWarnings.length > 0 && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-accent/10 border border-accent/25 space-y-1.5 text-xs text-accent"
              >
                <div className="flex items-center space-x-2 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Model Quality &amp; Architecture Notes</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-ink/85 leading-relaxed">
                  {allWarnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target Output Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-ink tracking-wider flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span>Compiled Prompt ({compiledPrompt.label})</span>
                </span>
                <span className="text-xs font-mono text-layout-layer">
                  {compiledPrompt.fullCommand.length} chars
                </span>
              </div>

              {/* SD / ComfyUI Split View */}
              {targetModel === 'sd_comfyui' ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-success">Positive Prompt (CLIP 1)</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPart(compiledPrompt.positivePrompt, 'positive')}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface border border-border-subtle hover:bg-surface-hover text-ink cursor-pointer"
                      >
                        {copiedPart === 'positive' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPart === 'positive' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-surface-muted rounded-xl border border-border-subtle font-mono text-xs text-ink/90 leading-relaxed whitespace-pre-wrap select-all max-h-36 overflow-y-auto">
                      {compiledPrompt.positivePrompt}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-danger">Negative Prompt (CLIP 2)</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPart(compiledPrompt.negativePrompt || '', 'negative')}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface border border-border-subtle hover:bg-surface-hover text-ink cursor-pointer"
                      >
                        {copiedPart === 'negative' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPart === 'negative' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-surface-muted rounded-xl border border-border-subtle font-mono text-xs text-ink/90 leading-relaxed whitespace-pre-wrap select-all max-h-24 overflow-y-auto">
                      {compiledPrompt.negativePrompt}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const jsonStr = JSON.stringify(compiledPrompt.comfyUiPayload, null, 2);
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        downloadAsset(url, `comfyui-prompt-${entry.id}.json`);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-surface border border-border-subtle rounded-lg text-xs font-semibold hover:bg-surface-hover text-ink cursor-pointer shadow-2xs"
                    >
                      <FileJson className="w-3.5 h-3.5 text-primary" />
                      <span>Download ComfyUI Workflow JSON</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="p-4 bg-surface-muted rounded-xl border border-border-subtle font-mono text-xs text-ink/90 leading-relaxed whitespace-pre-wrap select-all max-h-80 overflow-y-auto">
                    {compiledPrompt.fullCommand}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Template Architecture & Token Highlighting Card (S2-10, S2-11) */}
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-primary" />
                <h3 className="font-tight font-bold text-sm text-ink">
                  Template Architecture &amp; Tokens
                </h3>
              </div>
              <button
                type="button"
                onClick={isEditingTemplate ? handleCancelEditTemplate : handleStartEditTemplate}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-surface-muted hover:bg-surface border border-border-subtle rounded-lg text-xs font-semibold text-ink transition-colors shadow-2xs cursor-pointer"
              >
                {isEditingTemplate ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-3.5 h-3.5 text-layout-layer" />
                    <span>Edit Template</span>
                  </>
                )}
              </button>
            </div>

            {/* Token Colors Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] bg-surface-muted p-2.5 rounded-xl border border-border-subtle">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-layer" />
                <span className="text-brand-layer font-medium">Brand Token</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-accent font-medium">Campaign Token</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-layout-layer/60" />
                <span className="text-layout-layer font-medium">Layout Text</span>
              </span>
            </div>

            {isEditingTemplate ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase text-ink tracking-wider">
                    Template Syntax (Click slot chip below to collapse to text)
                  </label>
                  <textarea
                    rows={4}
                    value={editedTemplate}
                    onChange={(e) => setEditedTemplate(e.target.value)}
                    className="w-full p-3 bg-surface-muted rounded-xl border border-border-subtle font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                </div>

                {/* Live Token Highlighting with Interactive Collapse */}
                <SlotPreview
                  template={editedTemplate}
                  slots={editedSlots}
                  interactive={true}
                  onCollapseSlot={handleCollapseSlot}
                />

                {/* Make Slot Tool */}
                <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-muted space-y-2">
                  <span className="block text-xs font-semibold text-ink">Make New Slot</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={newSlotKey}
                      onChange={(e) => setNewSlotKey(e.target.value)}
                      placeholder="slot_key"
                      className="w-32 px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs font-mono bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={newSlotLabel}
                      onChange={(e) => setNewSlotLabel(e.target.value)}
                      placeholder="Label (e.g. Launch Year)"
                      className="flex-1 min-w-[140px] px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleMakeSlot}
                      disabled={!newSlotKey.trim()}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-primary text-primary-fg rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Slot</span>
                    </button>
                  </div>
                </div>

                {templateErrors.length > 0 && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger space-y-1">
                    {templateErrors.map((err, i) => (
                      <div key={i} className="flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCancelEditTemplate}
                    className="px-3.5 py-1.5 border border-border-subtle rounded-lg text-xs font-semibold text-layout-layer hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={templateSaving}
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-primary text-primary-fg rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {templateSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Template</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <SlotPreview template={entry.prompt_template} slots={entry.slots} />
            )}
          </div>

          {/* Attach in Flow Checklist */}
          {renderResult.attachChecklist.length > 0 && (
            <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-3.5">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Paperclip className="w-4 h-4" />
                </div>
                <h3 className="font-tight font-bold text-sm text-ink">
                  Attach in Flow (External Generator)
                </h3>
              </div>
              <p className="text-xs text-layout-layer leading-relaxed">
                Upload these visual assets into Midjourney or Flux in exact sequence:
              </p>
              <ol className="space-y-2 text-xs font-medium">
                {renderResult.attachChecklist.map((item) => (
                  <li
                    key={item.order}
                    className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-surface-muted border border-border-subtle"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-fg text-[11px] font-bold flex items-center justify-center shrink-0">
                      {item.order}
                    </span>
                    <span className="text-ink font-semibold">{item.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkbenchPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-layout-layer text-sm font-medium">Loading workbench template...</p>
        </div>
      }
    >
      <WorkbenchContent id={id} />
    </Suspense>
  );
}
