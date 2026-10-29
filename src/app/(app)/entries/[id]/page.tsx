'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  Eye,
  Paperclip,
  AlertCircle,
  Tag,
  ShieldCheck,
  Sliders,
  Sparkles,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import type { Entry } from '@/domain/entry';
import type { Brand } from '@/domain/brand';
import { renderPrompt, RenderResult } from '@/domain/renderPrompt';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkbenchPage({ params }: PageProps) {
  const { id } = use(params);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [slotValues, setSlotValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          const loadedBrand: Brand = brandData.brand;
          setBrand(loadedBrand);

          // Populate initial slot values with brand defaults
          const initialValues: Record<string, string> = {};
          for (const slot of loadedEntry.slots) {
            if (slot.brand_field && loadedBrand) {
              const brandVal = (loadedBrand as unknown as Record<string, string>)[slot.brand_field];
              if (brandVal) {
                initialValues[slot.key] = brandVal;
              }
            } else if (slot.default) {
              initialValues[slot.key] = slot.default;
            }
          }
          setSlotValues(initialValues);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workbench');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

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

  async function handleCopy() {
    await navigator.clipboard.writeText(renderResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="space-y-8">
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
          </div>
          <h1 className="font-tight font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Prompt Workbench
          </h1>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link
            href={`/entries/${entry.id}/compare`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-border-subtle rounded-xl text-xs sm:text-sm font-semibold hover:bg-surface-hover transition-all text-ink active:scale-[0.98] min-h-[40px]"
          >
            <Eye className="w-4 h-4 text-layout-layer" />
            <span>Visual Compare</span>
          </Link>
          <button
            onClick={handleCopy}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] min-h-[40px] ${
              copied
                ? 'bg-success text-white'
                : 'bg-primary text-primary-fg hover:opacity-90'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Rendered Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Slot Input Form (7 cols) */}
        <div className="lg:col-span-7 bg-surface p-6 sm:p-7 rounded-2xl border border-border-subtle shadow-xs space-y-6">
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface text-ink font-medium"
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

        {/* Right: Live Prompt Preview & Attach Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
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

          {/* Rendered Prompt Preview */}
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-primary" />
                <h3 className="font-tight font-bold text-sm text-ink">
                  Live Prompt Output
                </h3>
              </div>
              <span className="text-xs font-mono text-layout-layer bg-surface-muted px-2 py-0.5 rounded border border-border-subtle">
                {renderResult.text.length} chars
              </span>
            </div>

            <div className="relative group">
              <div className="p-4 bg-surface-muted rounded-xl border border-border-subtle font-mono text-xs text-ink/90 leading-relaxed whitespace-pre-wrap select-all max-h-96 overflow-y-auto">
                {renderResult.text}
              </div>
            </div>

            {renderResult.missingRequired.length > 0 && (
              <div
                role="status"
                className="flex items-start space-x-2 p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs text-accent font-medium leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Missing required inputs: <strong>{renderResult.missingRequired.join(', ')}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
