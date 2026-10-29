'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
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
    return <div className="py-20 text-center text-layout-layer text-sm">Loading workbench...</div>;
  }

  if (error || !entry) {
    return <div className="p-4 bg-danger/10 text-danger rounded-xl">{error || 'Entry not found'}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="text-xs font-mono uppercase bg-ink/5 text-layout-layer px-2 py-0.5 rounded">
              {entry.poster_type || 'POSTER'}
            </span>
            <span className="text-xs font-semibold text-primary">
              Brand: {brand?.name || 'Active Brand'}
            </span>
          </div>
          <h1 className="font-tight font-bold text-3xl text-ink tracking-tight">
            Prompt Workbench
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/entries/${entry.id}/compare`}
            className="px-4 py-2 border border-ink/15 rounded-lg text-sm font-semibold hover:bg-ink/5 transition-all text-ink"
          >
            Visual Compare
          </Link>
          <button
            onClick={handleCopy}
            className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-95 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center space-x-2"
          >
            <span>{copied ? '✓ Copied to Clipboard!' : 'Copy Rendered Prompt'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Slot Input Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-ink/10 shadow-sm space-y-6">
          <div>
            <h2 className="font-tight font-bold text-lg text-ink">Fill Campaign Variables</h2>
            <p className="text-xs text-layout-layer mt-0.5">
              Brand tokens are auto-bound. Fill campaign headline and promo slots.
            </p>
          </div>

          <div className="space-y-4">
            {entry.slots
              .filter((slot) => slot.type !== 'attachment')
              .map((slot) => {
                const val = slotValues[slot.key] || '';
                const isNeverInvent = slot.never_invent;
                const isBrandSlot = Boolean(slot.brand_field);

                return (
                  <div key={slot.key} className="space-y-1.5 p-3 rounded-xl border border-ink/10 bg-paper/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor={`slot-${slot.key}`}
                          className="text-xs font-mono font-bold text-ink"
                        >
                          {slot.label}
                        </label>
                        {isBrandSlot && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-brand-layer/15 text-brand-layer rounded font-semibold">
                            Brand Slot
                          </span>
                        )}
                        {isNeverInvent && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-accent/20 text-accent font-semibold rounded">
                            Needs You
                          </span>
                        )}
                      </div>

                      {slot.max_length && (
                        <span className="text-[11px] text-layout-layer font-mono">
                          {val.length}/{slot.max_length}
                        </span>
                      )}
                    </div>

                    {slot.type === 'choice' && slot.options ? (
                      <select
                        id={`slot-${slot.key}`}
                        value={val}
                        onChange={(e) => handleSlotChange(slot.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                      >
                        <option value="">Select option...</option>
                        {slot.options.map((opt) => (
                          <option key={opt} value={opt}>
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
                        className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white text-ink"
                      />
                    )}

                    {slot.hint && (
                      <p className="text-[11px] text-layout-layer">{slot.hint}</p>
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
            <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm space-y-3">
              <h3 className="font-tight font-bold text-sm text-ink flex items-center space-x-1.5">
                <span>📎</span>
                <span>Attach in Flow (External Generator)</span>
              </h3>
              <p className="text-xs text-layout-layer">
                Upload these visual assets in your external generator in exact order:
              </p>
              <ol className="space-y-1.5 text-xs font-medium">
                {renderResult.attachChecklist.map((item) => (
                  <li
                    key={item.order}
                    className="flex items-center space-x-2 p-2 rounded-lg bg-paper border border-ink/10"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                      {item.order}
                    </span>
                    <span className="text-ink">{item.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Rendered Prompt Preview */}
          <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-tight font-bold text-sm text-ink">
                Live Prompt Output
              </h3>
              <span className="text-xs font-mono text-layout-layer">
                {renderResult.text.length} chars
              </span>
            </div>

            <div className="p-4 bg-paper rounded-xl border border-ink/15 font-mono text-xs text-ink/90 leading-relaxed whitespace-pre-wrap select-all max-h-96 overflow-y-auto">
              {renderResult.text}
            </div>

            {renderResult.missingRequired.length > 0 && (
              <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-lg text-xs text-accent font-medium">
                Missing required: {renderResult.missingRequired.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
