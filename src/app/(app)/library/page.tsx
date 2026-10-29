'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import type { Entry, EntryStatus } from '@/domain/entry';
import type { PosterType } from '@/ai/schemas';

export default function LibraryPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [statusFilter, typeFilter]);

  async function fetchEntries() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
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

  async function copyPrompt(entry: Entry) {
    await navigator.clipboard.writeText(entry.prompt_template);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const statusConfig: Record<
    EntryStatus,
    { label: string; bg: string; text: string; icon: typeof Trophy }
  > = {
    winner: {
      label: 'Winner',
      bg: 'bg-success/10 border-success/20',
      text: 'text-success',
      icon: Trophy,
    },
    needs_tweak: {
      label: 'Needs Tweak',
      bg: 'bg-accent/10 border-accent/20',
      text: 'text-accent',
      icon: Sliders,
    },
    failed: {
      label: 'Failed',
      bg: 'bg-danger/10 border-danger/20',
      text: 'text-danger',
      icon: XCircle,
    },
    draft: {
      label: 'Draft',
      bg: 'bg-ink/5 border-ink/10',
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
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-xs active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>Deconstruct New Poster</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-ink/10 shadow-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {['all', 'winner', 'needs_tweak', 'failed', 'draft'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] ${
                statusFilter === s
                  ? 'bg-ink text-paper shadow-2xs'
                  : 'text-layout-layer hover:text-ink hover:bg-ink/5'
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
          className="px-3 py-1.5 rounded-xl border border-ink/15 text-xs text-ink font-semibold bg-paper/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer tracking-tight"
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
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-ink/20 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-ink/5 mx-auto flex items-center justify-center text-layout-layer">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-tight font-bold text-ink text-lg">No entries match your filter</h3>
            <p className="text-layout-layer text-sm max-w-sm mx-auto leading-relaxed">
              Deconstruct a poster in the Studio to save your first validated prompt template.
            </p>
          </div>
          <Link
            href="/workspace/generate"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/95 shadow-xs transition-all active:scale-[0.98]"
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
                className="flex flex-col justify-between bg-white rounded-2xl border border-ink/10 shadow-xs p-5 sm:p-6 hover:border-primary/40 hover:shadow-sm transition-all duration-150 space-y-4"
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
                      <span className="text-[11px] font-mono uppercase text-layout-layer bg-ink/5 px-2 py-0.5 rounded font-medium">
                        {entry.poster_type}
                      </span>
                    )}
                  </div>

                  {/* Template snippet */}
                  <div className="p-3.5 bg-paper rounded-xl border border-ink/10 font-mono text-xs text-ink/90 line-clamp-4 leading-relaxed">
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
                    <p className="text-xs text-ink/75 italic border-l-2 border-primary/30 pl-2.5 leading-relaxed line-clamp-2">
                      {entry.note}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => copyPrompt(entry)}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-ink/15 hover:bg-ink/5 transition-all text-ink active:scale-[0.98] min-h-[36px]"
                    title="Copy prompt template"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span className="text-success">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-layout-layer" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/entries/${entry.id}`}
                    className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary/95 transition-all text-center active:scale-[0.98] min-h-[36px]"
                  >
                    <span>Workbench</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/entries/${entry.id}/compare`}
                    className="p-2 rounded-xl border border-ink/15 hover:bg-ink/5 text-layout-layer hover:text-ink transition-all active:scale-[0.98] min-h-[36px] flex items-center justify-center"
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
