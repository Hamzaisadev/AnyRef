'use client';

import { useState, useEffect } from 'react';
import type { Entry } from '@/domain/entry';
import type { SanitizedAutofillResult } from '@/services/autofillService';

export default function AutofillStudioPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SanitizedAutofillResult | null>(null);
  const [copied, setCopied] = useState(false);

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

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-tight font-bold text-3xl text-ink tracking-tight">
          Autofill Studio
        </h1>
        <p className="text-layout-layer text-sm mt-1">
          Drop a raw product photo. AI analyzes product features, detects layout-fit compatibility, and prepares your prompt without saving temporary images.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form (5 cols) */}
        <form
          onSubmit={handleAutofill}
          className="lg:col-span-5 bg-white p-6 rounded-2xl border border-ink/10 shadow-sm space-y-5"
        >
          <h2 className="font-tight font-bold text-lg text-ink">1. Product &amp; Template</h2>

          {/* Template Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-ink/70">
              Target Template Entry
            </label>
            <select
              value={selectedEntryId}
              onChange={(e) => setSelectedEntryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white"
            >
              {entries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.poster_type ? `[${e.poster_type.toUpperCase()}] ` : ''}
                  {e.prompt_template.slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          {/* Photo Dropzone */}
          <div className="border-2 border-dashed border-ink/20 rounded-xl p-6 text-center space-y-3 relative hover:border-primary/50 transition-all cursor-pointer bg-paper/50">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {photoPreview ? (
              <div className="space-y-2">
                <img
                  src={photoPreview}
                  alt="Product preview"
                  className="max-h-56 mx-auto rounded-lg object-contain shadow-sm"
                />
                <p className="text-xs text-layout-layer font-medium">Click to replace photo</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center text-lg">
                  📦
                </div>
                <div className="text-sm font-medium text-ink">
                  Upload Product Photo
                </div>
                <p className="text-xs text-layout-layer">
                  Ephemeral in-memory analysis (never stored)
                </p>
              </div>
            )}
          </div>

          {/* Hint */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-ink/70">
              Campaign Hint / Brief (Optional)
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. Festive launch, emphasize midnight black finish"
              className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !photo || !selectedEntryId}
            className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:opacity-95 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Extracting Product Attributes...</span>
            ) : (
              <span>Run Smart Autofill</span>
            )}
          </button>
        </form>

        {/* Right: Review & Layout-Fit Warnings (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-ink/10 shadow-sm space-y-6">
          <h2 className="font-tight font-bold text-lg text-ink">2. Provenance Review</h2>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-layout-layer font-medium">
                Detecting product silhouette, aspect ratio, and extracting copy...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-5">
              {/* Layout-Fit Warning Alert */}
              {result.layoutFitWarning && (
                <div className="p-4 rounded-xl bg-accent/15 border border-accent/30 text-ink space-y-1">
                  <div className="flex items-center space-x-2 font-tight font-bold text-accent text-sm">
                    <span>⚠️</span>
                    <span>Layout-Fit Conflict Detected</span>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    This reference poster was designed for a <strong>{result.intendedProductShape}</strong> layout, but the uploaded product photo is <strong>{result.productShape}</strong>. To avoid awkward cropping or visual distortion, consider pairing with a matching aspect-ratio template.
                  </p>
                </div>
              )}

              {/* Product Guess Tag */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-paper border border-ink/10 text-xs">
                <span className="text-layout-layer">Product Identified:</span>
                <span className="font-mono font-bold text-ink">{result.product_guess}</span>
              </div>

              {/* Slots Provenance Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-ink/70">
                  Extracted Slot Values
                </h3>
                <div className="space-y-2">
                  {Object.entries(result.values).map(([key, item]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg border border-ink/10 bg-paper/40 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-ink block">{key}</span>
                        <span className="text-ink/90 font-medium">{item.value}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          item.source === 'brand_default'
                            ? 'bg-brand-layer/15 text-brand-layer'
                            : 'bg-primary/10 text-primary'
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
                      className="flex items-center justify-between p-3 rounded-lg border border-accent/20 bg-accent/5 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-ink block">{key}</span>
                        <span className="text-layout-layer italic">Left blank for human input</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase bg-accent/20 text-accent">
                        Needs You (Rule 3)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-layout-layer text-sm space-y-2">
              <div className="text-2xl">🤖</div>
              <p>Upload a product photo on the left to automatically populate template slots with brand DNA.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
