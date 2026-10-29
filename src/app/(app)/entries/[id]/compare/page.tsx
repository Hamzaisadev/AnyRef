'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import type { Entry, EntryStatus } from '@/domain/entry';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ComparePage({ params }: PageProps) {
  const { id } = use(params);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [status, setStatus] = useState<EntryStatus>('draft');
  const [note, setNote] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/entries/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.entry) {
          setEntry(data.entry);
          setStatus(data.entry.status);
          setNote(data.entry.note || '');
          if (data.entry.result_path) {
            setResultImage(data.entry.result_path);
          }
        }
      });
  }, [id]);

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          setResultImage(URL.createObjectURL(file));
        }
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setResultImage(URL.createObjectURL(e.target.files[0]));
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSavedSuccess(false);

    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          note,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update entry');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating entry');
    } finally {
      setSaving(false);
    }
  }

  if (!entry) {
    return <div className="py-20 text-center text-layout-layer text-sm">Loading visual compare...</div>;
  }

  return (
    <div className="space-y-8" onPaste={handlePaste}>
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-layout-layer mb-1">
            <Link href="/library" className="hover:underline">
              &larr; Back to Library
            </Link>
            <span>&bull;</span>
            <Link href={`/entries/${entry.id}`} className="hover:underline text-primary">
              Workbench
            </Link>
          </div>
          <h1 className="font-tight font-bold text-3xl text-ink tracking-tight">
            Visual Compare &amp; Winner Vault
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-95 shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : savedSuccess ? '✓ Saved!' : 'Save Evaluation'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Dual Panel Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Panel: Reference Poster */}
        <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-tight font-bold text-lg text-ink">Original Reference</h2>
            <span className="text-xs text-layout-layer">Target Inspiration</span>
          </div>

          <div className="h-96 rounded-xl bg-paper/60 border border-ink/10 flex items-center justify-center p-4">
            {entry.reference_path ? (
              <img
                src={entry.reference_path}
                alt="Reference Poster"
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="text-center text-layout-layer text-sm space-y-1">
                <div className="text-2xl">🖼️</div>
                <p>Reference image attached to this entry</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Result Poster & Paste Dropzone */}
        <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-tight font-bold text-lg text-ink">External Result</h2>
            <span className="text-xs text-primary font-medium">Paste with Ctrl+V or upload</span>
          </div>

          <div className="h-96 rounded-xl bg-paper/60 border-2 border-dashed border-ink/20 flex items-center justify-center p-4 relative group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            {resultImage ? (
              <img
                src={resultImage}
                alt="External Generator Result"
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="text-center text-layout-layer text-sm space-y-2">
                <div className="text-3xl">🎨</div>
                <p className="font-medium text-ink">
                  Click or drag result poster here, or press <kbd className="px-1.5 py-0.5 bg-ink/10 rounded font-mono text-xs">Ctrl+V</kbd>
                </p>
                <p className="text-xs">Supports Midjourney, Flux, and Ideogram renders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Switcher & Engineering Notes */}
      <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase text-ink/70 mb-3">
            Evaluation Verdict
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'winner', label: '🏆 Winner', desc: 'Approved for zero-cost reuse' },
              { key: 'needs_tweak', label: '⚠️ Needs Tweak', desc: 'Promising, reword slots' },
              { key: 'failed', label: '❌ Failed', desc: 'Composition failed' },
              { key: 'draft', label: '📝 Draft', desc: 'Untested' },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStatus(s.key as EntryStatus)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  status === s.key
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-ink/15 hover:bg-ink/5'
                }`}
              >
                <div className="font-tight font-bold text-sm text-ink">{s.label}</div>
                <div className="text-[11px] text-layout-layer mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-xs font-semibold uppercase text-ink/70 mb-1.5">
            Engineering &amp; Generation Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Generated with Flux 1.1 Pro (4 steps, cfg 3.5). Perfect typography spacing on desktop aspect ratio."
            className="w-full px-3.5 py-2.5 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-paper/30 text-ink"
          />
        </div>
      </div>
    </div>
  );
}
