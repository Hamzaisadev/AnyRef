'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Sliders,
  XCircle,
  FileText,
  Copy,
  Check,
  Plus,
  FolderOpen,
  ArrowRight,
  Eye,
  Sparkles,
  UploadCloud,
  ImageIcon,
  GitFork,
  Loader2,
} from 'lucide-react';
import type { Entry, EntryStatus } from '@/domain/entry';
import { useBrand } from '@/context/BrandContext';
import { renderPrompt } from '@/domain/renderPrompt';

export default function LibraryPage() {
  const router = useRouter();
  const { brands, activeBrandId } = useBrand();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remixingId, setRemixingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [activeBrandId, statusFilter, typeFilter]);

  async function fetchEntries() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeBrandId) params.set('brand_id', activeBrandId);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('poster_type', typeFilter);

      const res = await fetch(`/api/entries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleRemix(entryId: string) {
    setRemixingId(entryId);
    try {
      const res = await fetch(`/api/entries/${entryId}/remix`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.entry?.id) {
          router.push(`/entries/${data.entry.id}`);
          return;
        }
        await fetchEntries();
      }
    } catch {
      // Ignore
    } finally {
      setRemixingId(null);
    }
  }

  async function copyPrompt(entry: Entry) {
    const brand = brands.find((b) => b.id === entry.brand_id) || brands.find((b) => b.id === activeBrandId);
    const initialValues: Record<string, string> = { ...(brand?.default_values || {}) };

    if (brand) {
      for (const slot of entry.slots) {
        if (!initialValues[slot.key] && slot.brand_field) {
          if (slot.brand_field === 'wordmark' && brand.wordmark) {
            initialValues[slot.key] = brand.wordmark;
          } else if (slot.brand_field === 'colors_primary' && brand.colors?.[0]) {
            initialValues[slot.key] = brand.colors[0];
          } else if (slot.brand_field === 'colors_secondary' && brand.colors?.[1]) {
            initialValues[slot.key] = brand.colors[1];
          } else if (slot.brand_field === 'name' && brand.name) {
            initialValues[slot.key] = brand.name;
          } else if (slot.brand_field === 'footer_text' && brand.footer_text) {
            initialValues[slot.key] = brand.footer_text;
          } else if (slot.brand_field === 'slogan' && brand.slogan) {
            initialValues[slot.key] = brand.slogan;
          }
        }
      }
    }

    const { text } = renderPrompt(entry.prompt_template, entry.slots, initialValues);
    await navigator.clipboard.writeText(text || entry.prompt_template);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const statusConfig: Record<
    EntryStatus,
    { label: string; bg: string; text: string; icon: typeof Trophy }
  > = {
    winner: {
      label: 'Winner',
      bg: 'bg-success/15 border-success/30',
      text: 'text-success',
      icon: Trophy,
    },
    needs_tweak: {
      label: 'Needs Tweak',
      bg: 'bg-accent/15 border-accent/30',
      text: 'text-accent',
      icon: Sliders,
    },
    failed: {
      label: 'Failed',
      bg: 'bg-danger/15 border-danger/30',
      text: 'text-danger',
      icon: XCircle,
    },
    draft: {
      label: 'Draft',
      bg: 'bg-surface-muted border-border-subtle',
      text: 'text-layout-layer',
      icon: FileText,
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-tight font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Prompt Library
          </h1>
          <p className="text-layout-layer text-sm sm:text-base mt-1">
            Browse, filter, and reuse validated poster templates for your active brand.
          </p>
        </div>

        <Link
          href="/workspace/generate"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-primary-fg text-xs sm:text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-xs active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>Deconstruct New Poster</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-2 sm:p-2.5 rounded-2xl border border-border-subtle shadow-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {['all', 'winner', 'needs_tweak', 'failed', 'draft'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] ${
                statusFilter === s
                  ? 'bg-primary text-primary-fg shadow-2xs'
                  : 'text-layout-layer hover:text-ink hover:bg-surface-hover'
              }`}
            >
              {s === 'all' ? 'All Entries' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Poster Type Selector */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by poster type"
          className="px-3 py-1.5 rounded-xl border border-border-subtle text-xs text-ink font-semibold bg-surface-muted focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer tracking-tight"
        >
          <option value="all">All Layout Types</option>
          <option value="sale">Sale</option>
          <option value="launch">Launch</option>
          <option value="festive">Festive</option>
          <option value="announcement">Announcement</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Entry Grid */}
      {loading ? (
        <div className="text-center py-24 space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-layout-layer text-sm font-medium">Loading library entries...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border-strong p-8 sm:p-12 space-y-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-surface-muted mx-auto flex items-center justify-center text-layout-layer border border-border-subtle">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-tight font-bold text-ink text-xl">No entries match your filter</h3>
            <p className="text-layout-layer text-sm max-w-sm mx-auto leading-relaxed">
              Deconstruct a poster in the Studio to save your first validated prompt template.
            </p>
          </div>
          <Link
            href="/workspace/generate"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-primary text-primary-fg text-xs sm:text-sm font-semibold rounded-xl hover:opacity-90 shadow-xs transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Deconstruct Studio</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => {
            const config = statusConfig[entry.status] || statusConfig.draft;
            const StatusIcon = config.icon;

            return (
              <div
                key={entry.id}
                className="flex flex-col justify-between bg-surface rounded-2xl border border-border-subtle shadow-xs p-5 sm:p-6 hover:border-primary/40 hover:shadow-sm transition-all duration-150 space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{config.label}</span>
                    </span>

                    {entry.poster_type && (
                      <span className="text-[11px] font-mono uppercase text-layout-layer bg-surface-muted px-2 py-0.5 rounded font-medium border border-border-subtle">
                        {entry.poster_type}
                      </span>
                    )}
                  </div>

                  {/* Thumbnails: Reference & Result (S2-4) */}
                  {(entry.reference_path || entry.result_path) ? (
                    <div className="grid grid-cols-2 gap-2 h-36 rounded-xl overflow-hidden bg-surface-muted border border-border-subtle p-1.5">
                      {entry.reference_path ? (
                        <div className="relative h-full rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                          <img
                            src={entry.reference_path}
                            alt="Reference poster"
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-mono bg-ink/75 text-white rounded">
                            Ref
                          </span>
                        </div>
                      ) : (
                        <div className="h-full rounded-lg bg-surface flex items-center justify-center text-xs text-layout-layer">
                          No ref
                        </div>
                      )}

                      {entry.result_path ? (
                        <div className="relative h-full rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                          <img
                            src={entry.result_path}
                            alt="Result render"
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-mono bg-success/80 text-white rounded">
                            Result
                          </span>
                        </div>
                      ) : (
                        <Link
                          href={`/entries/${entry.id}/compare`}
                          className="h-full rounded-lg border border-dashed border-border-subtle flex flex-col items-center justify-center text-[11px] text-layout-layer hover:text-ink hover:bg-surface transition-colors p-2 text-center"
                        >
                          <UploadCloud className="w-4 h-4 mb-1 text-primary/70" />
                          <span>Add result</span>
                        </Link>
                      )}
                    </div>
                  ) : null}

                  {/* Template snippet */}
                  <div className="p-3.5 bg-surface-muted rounded-xl border border-border-subtle font-mono text-xs text-ink/90 line-clamp-4 leading-relaxed">
                    {entry.prompt_template}
                  </div>

                  {/* Slot Count & Layout Shape */}
                  <div className="flex items-center justify-between text-xs text-layout-layer pt-1 font-medium">
                    <span>{entry.slots.length} configurable slots</span>
                    {entry.intended_product_shape && (
                      <span className="capitalize">{entry.intended_product_shape} shape</span>
                    )}
                  </div>

                  {entry.note && (
                    <p className="text-xs text-ink/75 italic border-l-2 border-primary/40 pl-2.5 leading-relaxed line-clamp-2">
                      {entry.note}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                  <button
                    onClick={() => copyPrompt(entry)}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border-subtle hover:bg-surface-hover transition-all text-ink active:scale-[0.98] min-h-[36px]"
                    title="Copy prompt with brand values rendered (S2-7)"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span className="text-success">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-layout-layer" />
                        <span>Copy Rendered</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/entries/${entry.id}`}
                    className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-fg hover:opacity-90 transition-all text-center active:scale-[0.98] min-h-[36px]"
                  >
                    <span>Workbench</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleRemix(entry.id)}
                    disabled={remixingId === entry.id}
                    className="p-2 rounded-xl border border-border-subtle hover:bg-surface-hover text-layout-layer hover:text-ink transition-all active:scale-[0.98] disabled:opacity-50 min-h-[36px] flex items-center justify-center"
                    title="Remix template"
                    aria-label="Remix template"
                  >
                    {remixingId === entry.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <GitFork className="w-4 h-4" />
                    )}
                  </button>

                  <Link
                    href={`/entries/${entry.id}/compare`}
                    className="p-2 rounded-xl border border-border-subtle hover:bg-surface-hover text-layout-layer hover:text-ink transition-all active:scale-[0.98] min-h-[36px] flex items-center justify-center"
                    title="Compare results"
                    aria-label="Compare results"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
