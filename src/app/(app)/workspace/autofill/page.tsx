'use client';

import { useState, useEffect } from 'react';
import {
  UploadCloud,
  Package,
  Sparkles,
  AlertTriangle,
  Check,
  Tag,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import type { Entry } from '@/domain/entry';
import type { SanitizedAutofillResult } from '@/services/autofillService';
import { useBrand } from '@/context/BrandContext';

export default function AutofillStudioPage() {
  const { activeBrand } = useBrand();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SanitizedAutofillResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetch('/api/entries')
      .then((res) => res.json())
      .then((data) => {
        const list: Entry[] = data.entries || [];
        setEntries(list);
        if (list.length > 0 && !selectedEntryId) {
          setSelectedEntryId(list[0]!.id);
        }
      });
  }, [selectedEntryId]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setPhoto(selected);
      setPhotoPreview(URL.createObjectURL(selected));
      setResult(null);
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
      setPhoto(selected);
      setPhotoPreview(URL.createObjectURL(selected));
      setResult(null);
      setError('');
    }
  }

  async function handleAutofill(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) {
      setError('Please upload a product photo.');
      return;
    }
    if (!selectedEntryId) {
      setError('Please select an entry template to autofill.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('entry_id', selectedEntryId);
      formData.append('product_photo', photo);
      if (hint.trim()) {
        formData.append('hint', hint.trim());
      }

      const res = await fetch('/api/autofill', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Autofill extraction failed.');
      } else {
        setResult(data.result);
      }
    } catch {
      setError('Network communication failed during autofill.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-primary font-semibold tracking-wider uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Product Intelligence</span>
        </div>
        <h1 className="font-tight font-bold text-3xl sm:text-4xl text-ink tracking-tight">
          Smart Autofill Studio
        </h1>
        <p className="text-layout-layer text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
          Upload a raw product photo. Gemini detects silhouette, validates layout-fit compatibility with your reference, and auto-populates slots without storing image files.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form (5 cols) */}
        <form
          onSubmit={handleAutofill}
          className="lg:col-span-5 bg-surface p-6 sm:p-7 rounded-2xl border border-border-subtle shadow-xs space-y-6"
        >
          <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-mono font-bold text-ink border border-border-subtle">
              1
            </span>
            <span>Product &amp; Template</span>
          </h2>

          {/* Template Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-ink tracking-wider">
              Target Template Entry
            </label>
            <select
              value={selectedEntryId}
              onChange={(e) => setSelectedEntryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink cursor-pointer"
            >
              {entries.map((e) => (
                <option key={e.id} value={e.id} className="bg-surface text-ink">
                  {e.poster_type ? `[${e.poster_type.toUpperCase()}] ` : ''}
                  {e.prompt_template.slice(0, 48)}...
                </option>
              ))}
            </select>
          </div>

          {/* Photo Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 relative transition-all duration-150 cursor-pointer ${
              dragActive
                ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                : 'border-border-strong hover:border-primary/50 bg-surface-muted'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Upload product photo"
            />
            {photoPreview ? (
              <div className="space-y-2">
                <img
                  src={photoPreview}
                  alt="Product preview"
                  className="max-h-56 mx-auto rounded-xl object-contain shadow-2xs border border-border-subtle"
                />
                <p className="text-xs text-layout-layer font-medium">Click or drag another photo to replace</p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-ink">
                  Upload Product Photo
                </div>
                <p className="text-xs text-layout-layer max-w-xs mx-auto">
                  Analyzed in memory for silhouette &amp; style — never saved to database
                </p>
              </div>
            )}
          </div>

          {/* Hint */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-ink tracking-wider">
              Campaign Hint / Brief (Optional)
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. Festive launch, emphasize midnight black finish"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink placeholder:text-layout-layer/70"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !photo || !selectedEntryId}
            className="w-full py-3.5 bg-primary text-primary-fg font-semibold rounded-xl hover:opacity-90 shadow-xs transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 text-sm flex items-center justify-center space-x-2 active:scale-[0.98] min-h-[48px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Product Attributes...</span>
              </>
            ) : (
              <>
                <span>Run Smart Autofill</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Right: Review & Layout-Fit Warnings (7 cols) */}
        <div className="lg:col-span-7 bg-surface p-6 sm:p-7 rounded-2xl border border-border-subtle shadow-xs space-y-6">
          <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-mono font-bold text-ink border border-border-subtle">
              2
            </span>
            <span>Provenance Review</span>
          </h2>

          {loading ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="font-tight font-bold text-ink text-base">Analyzing Product Silhouette</p>
                <p className="text-xs text-layout-layer max-w-xs mx-auto leading-relaxed">
                  Checking layout aspect ratio fit, mapping brand attributes, and clearing never-invent slots...
                </p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-5">
              {/* Layout-Fit Warning Alert */}
              {result.layoutFitWarning && (
                <div
                  role="status"
                  className="p-4 rounded-xl bg-accent/15 border border-accent/30 text-ink space-y-1.5"
                >
                  <div className="flex items-center space-x-2 font-tight font-bold text-accent text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Layout-Fit Conflict Detected</span>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    This reference poster was designed for a <strong>{result.intendedProductShape}</strong> layout, but the uploaded product is <strong>{result.productShape}</strong>. Consider choosing a matching aspect-ratio template to prevent visual crowding.
                  </p>
                </div>
              )}

              {/* Product Guess Tag */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-muted border border-border-subtle text-xs">
                <span className="text-layout-layer font-medium">Product Identified:</span>
                <span className="font-mono font-bold text-ink text-sm">{result.product_guess}</span>
              </div>

              {/* Slots Provenance Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-ink tracking-wider">
                  Extracted Slot Values
                </h3>
                <div className="space-y-2">
                  {Object.entries(result.values).map(([key, item]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border-subtle bg-surface-muted text-xs hover:border-border-strong transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-ink block">{key}</span>
                        <span className="text-ink/90 font-medium">{item.value}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase shrink-0 ${
                          item.source === 'brand_default'
                            ? 'bg-brand-layer/15 text-brand-layer'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {item.source === 'brand_default' ? 'Brand Default' : 'AI Inferred'}
                      </span>
                    </div>
                  ))}

                  {/* Needs You Slots */}
                  {result.needs_you.map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-accent/25 bg-accent/5 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-ink block">{key}</span>
                        <span className="text-layout-layer italic">Kept blank for human input</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-accent/20 text-accent shrink-0">
                        Needs You (Rule 3)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-layout-layer space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-muted mx-auto flex items-center justify-center text-layout-layer border border-border-subtle">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-tight font-semibold text-ink text-sm">Autofill output will appear here</p>
                <p className="text-xs text-layout-layer max-w-xs mx-auto leading-relaxed">
                  Select a template and upload a product photo to automatically match brand tokens and campaign variables.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
