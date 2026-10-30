'use client';

import { useState, useId, useEffect } from 'react';
import {
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { Slot } from '@/domain/slot';
import type { EntryStatus } from '@/domain/entry';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBrandId: string | null;
  onSuccess: () => Promise<void> | void;
}

export function AddEntryModal({
  isOpen,
  onClose,
  activeBrandId,
  onSuccess,
}: AddEntryModalProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Single entry form state
  const [promptTemplate, setPromptTemplate] = useState('');
  const [status, setStatus] = useState<EntryStatus>('draft');
  const [posterType, setPosterType] = useState<string>('sale');
  const [intendedProductShape, setIntendedProductShape] = useState<string>('any');
  const [note, setNote] = useState('');

  // Bulk import state
  const [bulkText, setBulkText] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const dialogId = useId();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  // Detect slot tokens {{slot_name}} in prompt
  const detectedKeys = Array.from(
    new Set(
      Array.from(promptTemplate.matchAll(/\{\{([a-z][a-z0-9_]{1,40})\}\}/gi)).map(
        (m) => m[1]!.toLowerCase()
      )
    )
  );

  // Parse bulk prompts
  const bulkPrompts = bulkText
    .split(/\n\s*---\s*\n|\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 10);

  function createSlotsFromKeys(keys: string[]): Slot[] {
    return keys.map((key) => {
      const isPrice = /price|discount|date|valid/i.test(key);
      const isBrand = /brand|wordmark|logo/i.test(key);

      return {
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        type: isPrice && key.includes('date') ? 'date' : 'short_text',
        required: false,
        optional_block: false,
        never_invent: isPrice,
        brand_field: isBrand ? 'name' : null,
      };
    });
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeBrandId) {
      setErrorMsg('Please select an active brand before adding entries.');
      return;
    }
    if (promptTemplate.trim().length < 15) {
      setErrorMsg('Prompt template must be at least 15 characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const slots = createSlotsFromKeys(detectedKeys);
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: activeBrandId,
          prompt_template: promptTemplate.trim(),
          slots,
          status,
          poster_type: posterType,
          intended_product_shape: intendedProductShape,
          note: note.trim() || 'Manually added prompt template',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to save entry');
      }

      await onSuccess();
      onClose();
      // Reset form
      setPromptTemplate('');
      setNote('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeBrandId) {
      setErrorMsg('Please select an active brand before importing entries.');
      return;
    }
    if (bulkPrompts.length === 0) {
      setErrorMsg('Please paste at least one valid prompt (min 10 characters).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    let successCount = 0;

    try {
      for (let i = 0; i < bulkPrompts.length; i++) {
        const raw = bulkPrompts[i]!;
        setProgressMsg(`Importing prompt ${i + 1} of ${bulkPrompts.length}...`);

        const keys = Array.from(
          new Set(
            Array.from(raw.matchAll(/\{\{([a-z][a-z0-9_]{1,40})\}\}/gi)).map((m) =>
              m[1]!.toLowerCase()
            )
          )
        );
        const slots = createSlotsFromKeys(keys);

        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: activeBrandId,
            prompt_template: raw,
            slots,
            status: 'draft',
            poster_type: 'other',
            intended_product_shape: 'any',
            note: 'Bulk imported prompt',
          }),
        });

        if (res.ok) {
          successCount++;
        }
      }

      await onSuccess();
      onClose();
      setBulkText('');
    } catch (err: any) {
      setErrorMsg(`Imported ${successCount} prompts before encountering error: ${err.message}`);
    } finally {
      setSubmitting(false);
      setProgressMsg('');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-surface-muted/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 id={dialogId} className="font-tight font-bold text-lg text-ink">
                Add to Library
              </h2>
              <p className="text-xs text-layout-layer">
                Add verified prompt templates directly to your brand library.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-layout-layer hover:text-ink hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-border-subtle bg-surface px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setMode('single')}
            disabled={submitting}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer ${
              mode === 'single'
                ? 'border-primary text-primary'
                : 'border-transparent text-layout-layer hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Single Prompt</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('bulk')}
            disabled={submitting}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer ${
              mode === 'bulk'
                ? 'border-primary text-primary'
                : 'border-transparent text-layout-layer hover:text-ink'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Paste Many (Bulk Import)</span>
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="m-5 mb-0 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {mode === 'single' ? (
            <form id="single-entry-form" onSubmit={handleSingleSubmit} className="space-y-4">
              {/* Prompt Template */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    Prompt Template <span className="text-danger">*</span>
                  </label>
                  <span className="text-[11px] text-layout-layer font-mono">
                    Use {'{{slot_name}}'} for fillable variables
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  placeholder="Studio product photography of {{brand_name}} featuring {{product_name}} centered on a textured stone podium with dramatic rim lighting in {{primary_color}}. Headline: {{headline}}."
                  required
                  disabled={submitting}
                  className="w-full p-3 bg-surface-muted rounded-xl border border-border-subtle text-ink font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent leading-relaxed resize-y"
                />
              </div>

              {/* Detected Slots Preview */}
              {detectedKeys.length > 0 && (
                <div className="p-3 bg-brand-layer/5 border border-brand-layer/20 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-brand-layer text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{detectedKeys.length} Dynamic Slots Detected</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedKeys.map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 bg-surface text-ink text-[11px] font-mono font-medium rounded-md border border-border-subtle"
                      >
                        {`{{${k}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EntryStatus)}
                    disabled={submitting}
                    className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-xl text-xs text-ink focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="winner">Winner</option>
                    <option value="needs_tweak">Needs Tweak</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Poster Type</label>
                  <select
                    value={posterType}
                    onChange={(e) => setPosterType(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-xl text-xs text-ink focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="sale">Sale</option>
                    <option value="launch">Launch</option>
                    <option value="festive">Festive</option>
                    <option value="announcement">Announcement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Intended Shape</label>
                  <select
                    value={intendedProductShape}
                    onChange={(e) => setIntendedProductShape(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-xl text-xs text-ink focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="any">Any / Universal</option>
                    <option value="square">Square</option>
                    <option value="tall">Tall</option>
                    <option value="wide">Wide</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Proven high-CTR layout from Instagram ads"
                  disabled={submitting}
                  className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-xl text-xs text-ink focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </form>
          ) : (
            <form id="bulk-entry-form" onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    Paste Multiple Prompts
                  </label>
                  <span className="text-[11px] text-layout-layer font-mono">
                    Separate by `---` or double line breaks
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Studio product photo of {{product_name}} with minimalist concrete background. Headline: {{headline}}.\n\n---\n\nHigh-fashion campaign poster for {{brand_name}} with vibrant neon accents and bold typography.\n\n---\n\nFestive sale promotional poster with golden particle dust and elegant Serif wordmark.`}
                  required
                  disabled={submitting}
                  className="w-full p-3 bg-surface-muted rounded-xl border border-border-subtle text-ink font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent leading-relaxed resize-y"
                />
              </div>

              {/* Detected Count Banner */}
              <div className="p-3 bg-surface-muted rounded-xl border border-border-subtle flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-ink">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>
                    Detected Prompts: <strong>{bulkPrompts.length}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-layout-layer">
                  All imported prompts will be created as <strong>draft</strong> entries.
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-subtle bg-surface-muted/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-layout-layer hover:text-ink hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            {progressMsg && (
              <span className="text-xs text-primary font-medium animate-pulse">
                {progressMsg}
              </span>
            )}
            <button
              type="submit"
              form={mode === 'single' ? 'single-entry-form' : 'bulk-entry-form'}
              disabled={submitting || (mode === 'bulk' && bulkPrompts.length === 0)}
              className="px-5 py-2.5 bg-primary text-primary-fg text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer min-h-[38px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : mode === 'single' ? (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to Library</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Import {bulkPrompts.length} Prompts</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
