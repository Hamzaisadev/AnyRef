'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  ImageIcon,
  Sparkles,
  Wand2,
  Check,
  Copy,
  AlertTriangle,
  Bookmark,
  Layers,
  Sliders,
  Tag,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type { GenerateOutput } from '@/ai/schemas';
import { useBrand } from '@/context/BrandContext';

export default function GenerateStudioPage() {
  const router = useRouter();
  const { brands, activeBrandId, switchBrand } = useBrand();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<GenerateOutput | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectedBrandId = activeBrandId || brands[0]?.id || '';

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setProposal(null);
      setError('');
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setProposal(null);
      setError('');
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please upload a reference poster image.');
      return;
    }
    if (!selectedBrandId) {
      setError('Please select an active brand.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('brand_id', selectedBrandId);
      formData.append('reference', file);

      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Generation failed.');
      } else {
        setProposal(data.proposal);
      }
    } catch {
      setError('Network communication failed during generation.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyTemplate() {
    if (!proposal) return;
    await navigator.clipboard.writeText(proposal.prompt_template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  }

  async function handleSaveEntry() {
    if (!proposal || !selectedBrandId) return;

    setSaving(true);
    setError('');

    try {
      let referencePath: string | null = null;
      if (file) {
        const uploadForm = new FormData();
        uploadForm.append('file', file);
        uploadForm.append('bucket', 'references');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error?.message || 'Failed to upload reference image');
        }

        const uploadData = await uploadRes.json();
        referencePath = `/api/assets/references/${uploadData.path}`;
      }

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: selectedBrandId,
          reference_path: referencePath,
          prompt_template: proposal.prompt_template,
          slots: proposal.slots,
          poster_type: proposal.poster_type,
          intended_product_shape: proposal.intended_product_shape,
          note: proposal.layout_notes,
          system_prompt_version: (proposal as any).system_prompt_version || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to save entry.');
      } else {
        router.push(`/entries/${data.entry.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error saving entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-primary font-semibold tracking-wider uppercase mb-1">
          <Wand2 className="w-3.5 h-3.5" />
          <span>Poster Engineering Studio</span>
        </div>
        <h1 className="font-tight font-bold text-3xl sm:text-4xl text-ink tracking-tight">
          Reference Deconstruction Studio
        </h1>
        <p className="text-layout-layer text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
          Upload any reference poster. Gemini analyzes composition hierarchy, typography slots, and lighting setup without saving temporary copies.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center space-x-2.5 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl font-medium"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Input & Dropzone */}
        <div className="bg-surface p-6 sm:p-7 rounded-2xl border border-border-subtle shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-mono font-bold text-ink border border-border-subtle">
                1
              </span>
              <span>Upload Poster Reference</span>
            </h2>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-ink tracking-wider">
              Active Brand Context
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => switchBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id} className="bg-surface text-ink">
                  {b.name} {b.wordmark ? `(${b.wordmark})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-4 transition-all duration-150 cursor-pointer relative ${
              dragActive
                ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                : 'border-border-strong hover:border-primary/50 bg-surface-muted'
            }`}
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Upload reference poster image"
            />
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Reference Preview"
                  className="max-h-72 mx-auto rounded-xl shadow-xs border border-border-subtle object-contain"
                />
                <p className="text-xs text-layout-layer font-medium">
                  Click or drag another image to replace
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">
                    Drag and drop your poster, or <span className="text-primary underline">browse files</span>
                  </div>
                  <p className="text-xs text-layout-layer mt-1">
                    Supports JPG, PNG, WEBP up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !file}
            className="w-full py-3.5 bg-primary text-primary-fg font-semibold rounded-xl hover:opacity-90 transition-all duration-150 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 text-sm flex items-center justify-center space-x-2 active:scale-[0.98] min-h-[48px]"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deconstructing Poster with Gemini...</span>
              </>
            ) : (
              <>
                <span>Deconstruct Reference</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Right: Deconstructed Template & Slot Syntax */}
        <div className="bg-surface p-6 sm:p-7 rounded-2xl border border-border-subtle shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-mono font-bold text-ink border border-border-subtle">
                2
              </span>
              <span>Deconstruction Output</span>
            </h2>

            {proposal && (
              <button
                onClick={handleSaveEntry}
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-success text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 min-h-[36px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save as Entry</span>
                  </>
                )}
              </button>
            )}
          </div>

          {generating ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="font-tight font-bold text-ink text-base">Deconstructing Layout</p>
                <p className="text-xs text-layout-layer max-w-xs mx-auto leading-relaxed">
                  Extracting composition geometry, copy slots, and lighting hierarchy into structured prompt tokens...
                </p>
              </div>
            </div>
          ) : proposal ? (
            <div className="space-y-5">
              {/* Syntax Token Guide */}
              <div className="flex flex-wrap items-center gap-3 text-xs bg-surface-muted p-3 rounded-xl border border-border-subtle">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-layer" />
                  <span className="text-brand-layer font-semibold">Brand Slot</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <span className="text-accent font-semibold">Campaign Slot</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger" />
                  <span className="text-danger font-semibold">Never-Invent Guard</span>
                </span>
              </div>

              {/* Template Display */}
              <div className="relative group">
                <div className="p-4 bg-surface-muted rounded-xl border border-border-subtle font-mono text-xs text-ink/90 leading-relaxed whitespace-pre-wrap select-all max-h-60 overflow-y-auto">
                  {proposal.prompt_template}
                </div>
                <button
                  onClick={handleCopyTemplate}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-surface border border-border-subtle text-layout-layer hover:text-ink shadow-2xs transition-all opacity-80 hover:opacity-100"
                  title="Copy template"
                >
                  {copiedTemplate ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Slot Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase text-ink tracking-wider">
                    Configured Slots ({proposal.slots.length})
                  </h3>
                  {proposal.poster_type && (
                    <span className="text-[11px] font-mono uppercase bg-surface-muted px-2 py-0.5 rounded text-layout-layer border border-border-subtle font-medium">
                      {proposal.poster_type}
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {proposal.slots.map((slot) => {
                    const isBrand = Boolean(slot.brand_field);
                    const isNeverInvent = slot.never_invent;

                    return (
                      <div
                        key={slot.key}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-muted border border-border-subtle text-xs hover:border-border-strong transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isBrand ? 'bg-brand-layer' : isNeverInvent ? 'bg-danger' : 'bg-accent'
                            }`}
                          />
                          <span className="font-mono font-bold text-ink truncate">{slot.key}</span>
                          <span className="text-layout-layer text-[11px]">({slot.type})</span>
                          {isNeverInvent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-danger/10 text-danger font-semibold shrink-0">
                              Never-Invent
                            </span>
                          )}
                          {isBrand && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-layer/10 text-brand-layer font-semibold shrink-0">
                              Brand
                            </span>
                          )}
                        </div>
                        <span className="text-layout-layer text-[11px] truncate max-w-[160px] pl-2 text-right">
                          {slot.hint || slot.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-layout-layer space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-muted mx-auto flex items-center justify-center text-layout-layer border border-border-subtle">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-tight font-semibold text-ink text-sm">Template will appear here</p>
                <p className="text-xs text-layout-layer max-w-xs mx-auto leading-relaxed">
                  Select a brand, upload a reference poster, and click Deconstruct Reference to generate your structured prompt template.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
