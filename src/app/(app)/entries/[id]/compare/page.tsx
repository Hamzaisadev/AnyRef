'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Sliders,
  XCircle,
  FileText,
  UploadCloud,
  ImageIcon,
  Check,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
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
  const [dragActive, setDragActive] = useState(false);

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
      setResultImage(URL.createObjectURL(e.dataTransfer.files[0]));
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
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-layout-layer text-sm font-medium">Loading visual comparison...</p>
      </div>
    );
  }

  const verdictCards = [
    {
      key: 'winner',
      label: 'Winner',
      icon: Trophy,
      desc: 'Validated prompt ready for zero-cost reuse',
      color: 'text-success',
      activeBorder: 'border-success bg-success/5 ring-2 ring-success/20',
    },
    {
      key: 'needs_tweak',
      label: 'Needs Tweak',
      icon: Sliders,
      desc: 'Promising layout, adjust lighting or slot wording',
      color: 'text-accent',
      activeBorder: 'border-accent bg-accent/5 ring-2 ring-accent/20',
    },
    {
      key: 'failed',
      label: 'Failed',
      icon: XCircle,
      desc: 'Severe distortion or composition failure',
      color: 'text-danger',
      activeBorder: 'border-danger bg-danger/5 ring-2 ring-danger/20',
    },
    {
      key: 'draft',
      label: 'Draft',
      icon: FileText,
      desc: 'Pending generator evaluation test',
      color: 'text-layout-layer',
      activeBorder: 'border-ink/40 bg-ink/5 ring-2 ring-ink/10',
    },
  ];

  return (
    <div className="space-y-8" onPaste={handlePaste}>
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-layout-layer mb-1.5">
            <Link
              href="/library"
              className="hover:text-ink transition-colors flex items-center space-x-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Library</span>
            </Link>
            <span>/</span>
            <Link
              href={`/entries/${entry.id}`}
              className="hover:text-ink text-primary transition-colors font-medium"
            >
              Workbench
            </Link>
          </div>
          <h1 className="font-tight font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Visual Compare &amp; Winner Vault
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center space-x-2 px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 min-h-[40px] ${
            savedSuccess
              ? 'bg-success text-white'
              : 'bg-primary text-white hover:bg-primary/95'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Saved to Vault!</span>
            </>
          ) : (
            <span>Save Evaluation</span>
          )}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center space-x-2.5 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dual Panel Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Panel: Reference Poster */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-ink/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-brand-layer" />
              <span>Original Reference</span>
            </h2>
            <span className="text-xs font-mono uppercase bg-ink/5 text-layout-layer px-2 py-0.5 rounded">
              Target Style
            </span>
          </div>

          <div className="h-96 rounded-xl bg-paper/60 border border-ink/10 flex items-center justify-center p-4 overflow-hidden">
            {entry.reference_path ? (
              <img
                src={entry.reference_path}
                alt="Reference Poster"
                className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
              />
            ) : (
              <div className="text-center text-layout-layer text-sm space-y-2">
                <ImageIcon className="w-8 h-8 mx-auto text-layout-layer/50" />
                <p>Reference image attached to this entry</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Result Poster & Paste Dropzone */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-ink/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-primary" />
              <span>External Generator Result</span>
            </h2>
            <span className="text-xs text-primary font-medium">Ctrl+V or upload</span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`h-96 rounded-xl border-2 border-dashed flex items-center justify-center p-4 relative group transition-all duration-150 cursor-pointer overflow-hidden ${
              dragActive
                ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                : 'border-ink/20 hover:border-primary/50 bg-paper/60'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              aria-label="Upload external generator render"
            />
            {resultImage ? (
              <img
                src={resultImage}
                alt="External Generator Result"
                className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
              />
            ) : (
              <div className="text-center text-layout-layer text-sm space-y-2.5 p-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-ink text-sm">
                    Drop render here or press <kbd className="px-1.5 py-0.5 bg-ink/10 rounded font-mono text-xs">Ctrl+V</kbd>
                  </p>
                  <p className="text-xs text-layout-layer">
                    Supports Midjourney, Flux, and Ideogram renders
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Switcher & Engineering Notes */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-ink/10 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase text-ink tracking-wider mb-3">
            Evaluation Verdict
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {verdictCards.map((s) => {
              const Icon = s.icon;
              const isSelected = status === s.key;

              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key as EntryStatus)}
                  className={`p-4 rounded-xl border text-left transition-all duration-150 active:scale-[0.98] ${
                    isSelected
                      ? s.activeBorder
                      : 'border-ink/15 hover:border-ink/30 hover:bg-ink/5'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <span className="font-tight font-bold text-sm text-ink">{s.label}</span>
                  </div>
                  <div className="text-[11px] text-layout-layer mt-1 leading-relaxed">
                    {s.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-xs font-semibold uppercase text-ink tracking-wider mb-2">
            Engineering &amp; Generation Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Generated with Flux 1.1 Pro (4 steps, cfg 3.5). Perfect typography spacing on portrait layout."
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-paper/30 text-ink leading-relaxed placeholder:text-layout-layer/70"
          />
        </div>
      </div>
    </div>
  );
}
