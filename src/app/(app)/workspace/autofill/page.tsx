'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Copy,
  Terminal,
  BookmarkPlus,
  FileSpreadsheet,
  FileJson,
  Download,
  ExternalLink,
} from 'lucide-react';
import type { Entry } from '@/domain/entry';
import { buildInitialAutofillValues } from '@/domain/slot';
import type { SanitizedAutofillResult } from '@/services/autofillService';
import { useBrand } from '@/context/BrandContext';
import { renderPrompt } from '@/domain/renderPrompt';
import { compilePrompt } from '@/domain/promptCompiler';
import { buildBatchCsv, buildComfyUiBatchQueue } from '@/domain/batchExport';

export default function AutofillStudioPage() {
  const { activeBrand } = useBrand();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [batchMax, setBatchMax] = useState<number>(1);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SanitizedAutofillResult | null>(null);
  const [batchResults, setBatchResults] = useState<SanitizedAutofillResult[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState<number>(0);
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Batch Persistence & Export Suite State
  const [savingDrafts, setSavingDrafts] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [savedDraftsCount, setSavedDraftsCount] = useState(0);

  const photo = photos[0] ?? null;

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  useEffect(() => {
    fetch('/api/account')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const limit = data?.entitlements?.limits?.batch_max;
        if (typeof limit === 'number' && limit >= 1) {
          setBatchMax(limit);
        }
      })
      .catch(() => {
        // Default to 1 on error
      });
  }, []);

  useEffect(() => {
    const brandQuery = activeBrand?.id ? `?brand_id=${activeBrand.id}` : '';
    fetch(`/api/entries${brandQuery}`)
      .then((res) => res.json())
      .then((data) => {
        const list: Entry[] = data.entries || [];
        setEntries(list);
        if (list.length > 0) {
          setSelectedEntryId((prev) => (list.some((e) => e.id === prev) ? prev : list[0]!.id));
        } else {
          setSelectedEntryId('');
        }
      });
  }, [activeBrand?.id]);

  function applySelectedFiles(fileList: FileList) {
    const allFiles = Array.from(fileList);
    if (allFiles.length === 0) return;

    const cappedFiles = allFiles.slice(0, batchMax);
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotos(cappedFiles);
    setPhotoPreview(URL.createObjectURL(cappedFiles[0]!));
    setResult(null);
    setBatchResults([]);
    setActiveBatchIndex(0);
    setSaveSuccessMsg('');
    if (allFiles.length > batchMax) {
      setError(`Your current plan allows up to ${batchMax} product photo${batchMax === 1 ? '' : 's'} per batch.`);
    } else {
      setError('');
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      applySelectedFiles(e.target.files);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      applySelectedFiles(e.dataTransfer.files);
    }
  }

  function selectBatchResult(index: number, items: SanitizedAutofillResult[] = batchResults) {
    const chosen = items[index];
    if (!chosen) return;
    setActiveBatchIndex(index);
    setResult(chosen);
    const targetEntry = entries.find((e) => e.id === selectedEntryId);
    const initial = buildInitialAutofillValues(
      targetEntry?.slots || [],
      activeBrand,
      chosen
    );
    setEditableValues(initial);
  }

  async function handleAutofill(e: React.FormEvent) {
    e.preventDefault();
    if (photos.length === 0) {
      setError('Please upload a product photo.');
      return;
    }
    if (!selectedEntryId) {
      setError('Please select an entry template to autofill.');
      return;
    }

    setLoading(true);
    setError('');
    setSaveSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('entry_id', selectedEntryId);
      for (const itemPhoto of photos.slice(0, batchMax)) {
        formData.append('product_photo', itemPhoto);
      }
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
        const list: SanitizedAutofillResult[] = Array.isArray(data.results) && data.results.length > 0
          ? data.results
          : data.result
          ? [data.result]
          : [];
        setBatchResults(list);
        if (list[0]) {
          selectBatchResult(0, list);
        }
      }
    } catch {
      setError('Network communication failed during autofill.');
    } finally {
      setLoading(false);
    }
  }

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);
  const liveRender = selectedEntry
    ? renderPrompt(selectedEntry.prompt_template, selectedEntry.slots, editableValues)
    : null;

  async function handleCopyPrompt() {
    if (!liveRender) return;
    await navigator.clipboard.writeText(liveRender.text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }

  // --- Feature 3: Persistence & Export Handlers ---

  function handleExportCsv() {
    const currentBatch = batchResults.length > 0 ? batchResults : result ? [result] : [];
    if (!selectedEntry || currentBatch.length === 0) return;

    const csvContent = buildBatchCsv(
      selectedEntry,
      currentBatch,
      activeBrand,
      activeBatchIndex,
      editableValues
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anyref-autofill-batch-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleExportComfyUiQueue() {
    const currentBatch = batchResults.length > 0 ? batchResults : result ? [result] : [];
    if (!selectedEntry || currentBatch.length === 0) return;

    const payload = buildComfyUiBatchQueue(
      selectedEntry,
      currentBatch,
      activeBrand,
      activeBatchIndex,
      editableValues
    );

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comfyui-batch-queue-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleSaveAllAsDrafts() {
    const currentBatch = batchResults.length > 0 ? batchResults : result ? [result] : [];
    if (!selectedEntry || currentBatch.length === 0) return;

    if (!activeBrand?.id) {
      setError('Please select an active brand in the top navigation before saving drafts.');
      return;
    }

    setSavingDrafts(true);
    setSaveSuccessMsg('');
    setError('');

    try {
      let savedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < currentBatch.length; i++) {
        const item = currentBatch[i]!;
        const values =
          i === activeBatchIndex
            ? editableValues
            : buildInitialAutofillValues(selectedEntry.slots, activeBrand, item);

        // Pre-seed the slot defaults so the draft has all extracted variables
        const updatedSlots = selectedEntry.slots.map((slot) => {
          const val = values[slot.key];
          return {
            ...slot,
            default: val !== undefined && val !== '' ? val : slot.default,
          };
        });

        const shapeVal =
          item.productShape === 'wide' || item.productShape === 'tall' || item.productShape === 'square'
            ? item.productShape
            : selectedEntry.intended_product_shape || null;

        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: activeBrand.id,
            prompt_template: selectedEntry.prompt_template,
            slots: updatedSlots,
            status: 'draft',
            poster_type: selectedEntry.poster_type || null,
            intended_product_shape: shapeVal,
            note: `Batch autofill draft #${i + 1} for ${item.product_guess}`,
            parent_entry_id: selectedEntry.id,
          }),
        });

        if (res.ok) {
          savedCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          errors.push(`Item #${i + 1}: ${errData.error?.message || 'Failed to save'}`);
        }
      }

      if (savedCount > 0) {
        setSavedDraftsCount(savedCount);
        setSaveSuccessMsg(
          `Successfully saved ${savedCount} draft${savedCount > 1 ? 's' : ''} to your Library!`
        );
      }
      if (errors.length > 0) {
        setError(`Some drafts failed to save: ${errors.join(', ')}`);
      }
    } catch {
      setError('Network communication failed while saving drafts.');
    } finally {
      setSavingDrafts(false);
    }
  }

  const queryParams = new URLSearchParams();
  for (const [k, v] of Object.entries(editableValues)) {
    if (v.trim()) queryParams.set(k, v.trim());
  }
  const workbenchUrl = selectedEntryId
    ? `/entries/${selectedEntryId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    : '#';

  const currentBatchItems = batchResults.length > 0 ? batchResults : result ? [result] : [];

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
          Upload raw product photos. Gemini detects silhouette, validates layout-fit compatibility with your reference, and auto-populates slots without storing image files.
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

      {saveSuccessMsg && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-success/10 border border-success/30 text-success text-sm rounded-xl font-medium animate-in fade-in"
        >
          <div className="flex items-center space-x-2.5">
            <Check className="w-5 h-5 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <Link
            href="/library"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-success text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer shadow-2xs"
          >
            <span>Open in Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
              multiple
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
                {photos.length > 1 && (
                  <p className="text-xs font-semibold text-primary">
                    {photos.length} product photos queued (max {batchMax})
                  </p>
                )}
                <p className="text-xs text-layout-layer font-medium">Click or drag another photo to replace</p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-ink">
                  Upload Product Photo{batchMax > 1 ? `s (up to ${batchMax})` : ''}
                </div>
                <p className="text-xs text-layout-layer max-w-xs mx-auto">
                  Analyzed in memory for silhouette &amp; style — never saved to database (Plan batch limit: {batchMax})
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
            className="w-full py-3.5 bg-primary text-primary-fg font-semibold rounded-xl hover:opacity-90 shadow-xs transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 text-sm flex items-center justify-center space-x-2 active:scale-[0.98] min-h-[48px] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Product Attributes...</span>
              </>
            ) : (
              <>
                <span>{photos.length > 1 ? `Run Batch Autofill (${photos.length})` : 'Run Smart Autofill'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Right: Review & Layout-Fit Warnings & Export Suite (7 cols) */}
        <div className="lg:col-span-7 bg-surface p-6 sm:p-7 rounded-2xl border border-border-subtle shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-mono font-bold text-ink border border-border-subtle">
                2
              </span>
              <span>Provenance Review</span>
            </h2>

            {batchResults.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {batchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectBatchResult(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeBatchIndex === idx
                        ? 'bg-primary text-primary-fg'
                        : 'bg-surface-muted text-layout-layer hover:text-ink border border-border-subtle'
                    }`}
                  >
                    #{idx + 1}: {item.product_guess.slice(0, 16)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Batch Persistence & Export Suite Toolbar */}
          {currentBatchItems.length > 0 && (
            <div className="p-4 rounded-xl bg-surface-muted border border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center space-x-1.5">
                  <BookmarkPlus className="w-3.5 h-3.5 text-primary" />
                  <span>Batch Actions &amp; Export Suite</span>
                </span>
                <span className="text-[11px] font-mono text-layout-layer">
                  {currentBatchItems.length} item{currentBatchItems.length > 1 ? 's' : ''} extracted
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAllAsDrafts}
                  disabled={savingDrafts}
                  className="flex-1 min-w-[170px] inline-flex items-center justify-center space-x-2 px-3.5 py-2 bg-primary text-primary-fg rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-2xs active:scale-[0.98] disabled:opacity-50 cursor-pointer min-h-[38px]"
                >
                  {savingDrafts ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Drafts...</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Save All as Drafts to Library</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-border-subtle rounded-xl text-xs font-semibold text-ink transition-colors shadow-2xs cursor-pointer min-h-[38px]"
                  title="Export extracted slots as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportComfyUiQueue}
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-border-subtle rounded-xl text-xs font-semibold text-ink transition-colors shadow-2xs cursor-pointer min-h-[38px]"
                  title="Export ComfyUI prompt queue JSON"
                >
                  <FileJson className="w-3.5 h-3.5 text-primary" />
                  <span>ComfyUI Queue JSON</span>
                </button>
              </div>
            </div>
          )}

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

              {/* Editable Slots Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase text-ink tracking-wider">
                    Extracted &amp; Campaign Slots
                  </h3>
                  <span className="text-[11px] text-layout-layer">
                    Edit inputs to update prompt live
                  </span>
                </div>

                <div className="space-y-3">
                  {Object.entries(result.values).map(([key, item]) => (
                    <div
                      key={key}
                      className="p-3.5 rounded-xl border border-border-subtle bg-surface-muted space-y-2 hover:border-border-strong transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor={`slot-${key}`} className="font-mono font-bold text-ink cursor-pointer">
                          {key}
                        </label>
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
                      <input
                        id={`slot-${key}`}
                        type="text"
                        value={editableValues[key] ?? item.value}
                        onChange={(e) =>
                          setEditableValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-border-subtle text-xs bg-surface text-ink font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  ))}

                  {/* Needs You Slots */}
                  {result.needs_you.map((key) => (
                    <div
                      key={key}
                      className="p-3.5 rounded-xl border border-accent/30 bg-accent/5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor={`slot-${key}`} className="font-mono font-bold text-ink cursor-pointer">
                          {key}
                        </label>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-accent/20 text-accent shrink-0">
                          Needs You (Rule 3)
                        </span>
                      </div>
                      <input
                        id={`slot-${key}`}
                        type="text"
                        placeholder="Enter verified value (e.g. price/discount)..."
                        value={editableValues[key] ?? ''}
                        onChange={(e) =>
                          setEditableValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-accent/40 text-xs bg-surface text-ink font-medium focus:ring-2 focus:ring-accent focus:outline-none placeholder:text-layout-layer/60"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Rendered Prompt Box */}
              {liveRender && (
                <div className="space-y-3 pt-2 border-t border-border-subtle">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-ink">
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      <span>Live Rendered Prompt</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleCopyPrompt}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-surface-muted hover:bg-surface border border-border-subtle rounded-lg text-xs font-semibold text-ink transition-colors shadow-2xs cursor-pointer"
                      >
                        {copiedPrompt ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-brand-layer" />
                            <span className="text-brand-layer">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-layout-layer" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                      <Link
                        href={workbenchUrl}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-primary text-primary-fg rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-2xs"
                      >
                        <span>Open in Workbench</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-muted rounded-xl border border-border-subtle font-mono text-xs text-ink/90 leading-relaxed whitespace-pre-wrap select-all max-h-64 overflow-y-auto">
                    {liveRender.text}
                  </div>

                  {liveRender.missingRequired.length > 0 && (
                    <div
                      role="status"
                      className="flex items-start space-x-2 p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs text-accent font-medium leading-relaxed"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Missing required inputs: <strong>{liveRender.missingRequired.join(', ')}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
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
