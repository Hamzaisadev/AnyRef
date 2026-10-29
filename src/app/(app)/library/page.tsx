'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

  const statusBadges: Record<EntryStatus, { label: string; bg: string; text: string }> = {
    winner: { label: '🏆 Winner', bg: 'bg-success/10', text: 'text-success' },
    needs_tweak: { label: '⚠️ Needs Tweak', bg: 'bg-accent/10', text: 'text-accent' },
    failed: { label: '❌ Failed', bg: 'bg-danger/10', text: 'text-danger' },
    draft: { label: '📝 Draft', bg: 'bg-ink/5', text: 'text-layout-layer' },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-tight font-bold text-3xl text-ink tracking-tight">
            Prompt Library
          </h1>
          <p className="text-layout-layer text-sm mt-1">
            Browse, filter, and reuse validated poster templates for your active brand.
          </p>
        </div>

        <Link
          href="/workspace/generate"
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          + Generate New Entry
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-ink/10 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1">
          {['all', 'winner', 'needs_tweak', 'failed', 'draft'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                statusFilter === s
                  ? 'bg-ink text-paper'
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
          className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs text-ink font-medium bg-transparent focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="sale">Sale</option>
          <option value="launch">Launch</option>
          <option value="festive">Festive</option>
          <option value="announcement">Announcement</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Entry Grid */}
      {loading ? (
        <div className="text-center py-16 text-layout-layer text-sm">
          Loading library entries...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-ink/20 p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-ink/5 mx-auto flex items-center justify-center text-xl">
            📂
          </div>
          <h3 className="font-tight font-semibold text-ink text-lg">No entries match your filter</h3>
          <p className="text-layout-layer text-sm max-w-sm mx-auto">
            Deconstruct a poster reference in the Studio to add your first template.
          </p>
          <Link
            href="/workspace/generate"
            className="inline-block px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-95 shadow-sm"
          >
            Open Generate Studio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => {
            const badge = statusBadges[entry.status] || statusBadges.draft;

            return (
              <div
                key={entry.id}
                className="flex flex-col justify-between bg-white rounded-2xl border border-ink/10 shadow-sm p-5 hover:border-primary/40 transition-all space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>

                    {entry.poster_type && (
                      <span className="text-xs font-mono uppercase text-layout-layer bg-ink/5 px-2 py-0.5 rounded">
                        {entry.poster_type}
                      </span>
                    )}
                  </div>

                  {/* Template snippet */}
                  <div className="p-3 bg-paper rounded-lg border border-ink/10 font-mono text-xs text-ink/90 line-clamp-4 leading-relaxed">
                    {entry.prompt_template}
                  </div>

                  {/* Slot Count & Layout Shape */}
                  <div className="flex items-center justify-between text-xs text-layout-layer">
                    <span>{entry.slots.length} configurable slots</span>
                    {entry.intended_product_shape && (
                      <span>Shape: {entry.intended_product_shape}</span>
                    )}
                  </div>

                  {entry.note && (
                    <p className="text-xs text-ink/70 italic border-l border-ink/20 pl-2">
                      {entry.note}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-ink/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => copyPrompt(entry)}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-ink/15 hover:bg-ink/5 transition-all text-ink flex items-center justify-center space-x-1"
                  >
                    <span>{copiedId === entry.id ? '✓ Copied!' : 'Copy'}</span>
                  </button>

                  <Link
                    href={`/entries/${entry.id}`}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:opacity-95 transition-all text-center"
                  >
                    Reuse
                  </Link>

                  <Link
                    href={`/entries/${entry.id}/compare`}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-ink/15 hover:bg-ink/5 text-layout-layer hover:text-ink"
                    title="Compare results"
                  >
                    Compare
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
