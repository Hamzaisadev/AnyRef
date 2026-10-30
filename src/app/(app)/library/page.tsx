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
  BookmarkPlus,
  Compass,
  Zap,
  Tag,
  ShieldCheck,
  Layers,
  AlertCircle,
} from 'lucide-react';
import type { Entry, EntryStatus } from '@/domain/entry';
import { useBrand } from '@/context/BrandContext';
import { renderPrompt } from '@/domain/renderPrompt';
import { CURATED_TEMPLATES, type CuratedTemplate } from '@/domain/curatedTemplates';
import { resolveBrandSlotValue, type Slot } from '@/domain/slot';
import { AddEntryModal } from '@/components/library/AddEntryModal';

export default function LibraryPage() {
  const router = useRouter();
  const { brands, activeBrandId } = useBrand();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal for Manual Add / Bulk Import
  const [showAddModal, setShowAddModal] = useState(false);

  // Tabs: My Templates vs Curated Vault
  const [activeTab, setActiveTab] = useState<'my_templates' | 'curated_vault'>('my_templates');

  // Filters for My Templates
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filters for Curated Vault
  const [vaultCategory, setVaultCategory] = useState<string>('all');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remixingId, setRemixingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [cloneError, setCloneError] = useState('');

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

  function getSlotValuesForRender(slots: Slot[], brand: (typeof brands)[0] | undefined): Record<string, string> {
    const initialValues: Record<string, string> = { ...(brand?.default_values || {}) };
    for (const slot of slots) {
      if (!initialValues[slot.key]) {
        const brandVal = brand ? resolveBrandSlotValue(slot, brand) : undefined;
        if (brandVal) {
          initialValues[slot.key] = brandVal;
        } else if (slot.default) {
          initialValues[slot.key] = slot.default;
        }
      }
    }
    return initialValues;
  }

  async function copyPrompt(entry: Entry) {
    const brand = brands.find((b) => b.id === entry.brand_id) || brands.find((b) => b.id === activeBrandId);
    const initialValues = getSlotValuesForRender(entry.slots, brand);

    const { text } = renderPrompt(entry.prompt_template, entry.slots, initialValues);
    await navigator.clipboard.writeText(text || entry.prompt_template);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // --- Feature 4: 1-Click Zero-Cost Brand Cloning ---

  async function handleCloneCurated(template: CuratedTemplate) {
    if (!activeBrandId) {
      setCloneError('Please select or create an active brand in the top navigation before cloning.');
      return;
    }

    setCloningId(template.id);
    setCloneError('');

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: activeBrandId,
          prompt_template: template.prompt_template,
          slots: template.slots,
          status: 'draft',
          poster_type: template.poster_type,
          intended_product_shape: template.intended_product_shape,
          note: `Cloned from Curated Vault: ${template.title}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.entry?.id) {
          router.push(`/entries/${data.entry.id}`);
          return;
        }
        await fetchEntries();
        setActiveTab('my_templates');
      } else {
        const errData = await res.json().catch(() => ({}));
        setCloneError(errData.error?.message || 'Failed to clone template');
      }
    } catch {
      setCloneError('Network communication error while cloning template');
    } finally {
      setCloningId(null);
    }
  }

  async function copyCuratedPrompt(template: CuratedTemplate) {
    const brand = brands.find((b) => b.id === activeBrandId);
    const initialValues = getSlotValuesForRender(template.slots, brand);

    const { text } = renderPrompt(template.prompt_template, template.slots, initialValues);
    await navigator.clipboard.writeText(text || template.prompt_template);
    setCopiedId(template.id);
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

  const filteredCurated = CURATED_TEMPLATES.filter((t) => {
    if (vaultCategory === 'all') return true;
    return t.category === vaultCategory;
  });

  const categories = [
    'all',
    'Tech & Audio',
    'Beauty & Skincare',
    'Lifestyle & Coffee',
    'Fashion & Apparel',
    'Home & Architecture',
    'Luxury & Horology',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-tight font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Prompt Library &amp; Vault
          </h1>
          <p className="text-layout-layer text-sm sm:text-base mt-1">
            Browse verified campaign templates or clone pre-deconstructed winning layouts at zero AI cost.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-surface border border-border-subtle text-ink text-xs sm:text-sm font-semibold rounded-xl hover:bg-surface-hover transition-all shadow-2xs active:scale-[0.98] min-h-[40px] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>Add Manually / Import</span>
          </button>

          <Link
            href="/workspace/generate"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-primary-fg text-xs sm:text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-xs active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Deconstruct Poster</span>
          </Link>
        </div>
      </div>

      {cloneError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-danger/10 border border-danger/25 text-danger text-sm rounded-xl font-medium flex items-center space-x-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cloneError}</span>
        </div>
      )}

      {/* Primary Section Switcher Tabs: My Templates vs Curated Inspiration Vault */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('my_templates')}
            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'my_templates'
                ? 'bg-primary text-primary-fg shadow-xs ring-1 ring-primary'
                : 'text-layout-layer hover:text-ink hover:bg-surface-hover'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>My Brand Templates</span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'my_templates'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-muted text-layout-layer'
              }`}
            >
              {entries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('curated_vault')}
            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'curated_vault'
                ? 'bg-primary text-primary-fg shadow-xs ring-1 ring-primary'
                : 'text-layout-layer hover:text-ink hover:bg-surface-hover'
            }`}
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Curated Inspiration Vault</span>
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                activeTab === 'curated_vault'
                  ? 'bg-accent/30 text-white font-bold'
                  : 'bg-accent/15 text-accent font-semibold'
              }`}
            >
              $0.00 Clones
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: MY BRAND TEMPLATES
          ======================================================== */}
      {activeTab === 'my_templates' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-2 sm:p-2.5 rounded-2xl border border-border-subtle shadow-xs">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {['all', 'winner', 'needs_tweak', 'failed', 'draft'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] cursor-pointer ${
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
            <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-border-strong p-8 sm:p-12 space-y-5 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-surface-muted mx-auto flex items-center justify-center text-layout-layer border border-border-subtle">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-tight font-bold text-ink text-xl">No saved entries match your filter</h3>
                <p className="text-layout-layer text-sm max-w-sm mx-auto leading-relaxed">
                  Start with a pre-deconstructed winning commercial layout from the Inspiration Vault or deconstruct a custom poster.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('curated_vault')}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-primary text-primary-fg text-xs sm:text-sm font-semibold rounded-xl hover:opacity-90 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Explore Curated Inspiration Vault</span>
                </button>
                <Link
                  href="/workspace/generate"
                  className="inline-flex items-center space-x-2 px-6 py-2.5 border border-border-subtle bg-surface hover:bg-surface-hover text-ink text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Deconstruct Custom Poster</span>
                </Link>
              </div>
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
                      {entry.reference_path || entry.result_path ? (
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
                          <span className="capitalize font-mono text-[11px]">{entry.intended_product_shape} shape</span>
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
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border-subtle hover:bg-surface-hover transition-all text-ink active:scale-[0.98] min-h-[36px] cursor-pointer"
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
                        className="p-2 rounded-xl border border-border-subtle hover:bg-surface-hover text-layout-layer hover:text-ink transition-all active:scale-[0.98] disabled:opacity-50 min-h-[36px] flex items-center justify-center cursor-pointer"
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
      )}

      {/* ========================================================
          TAB 2: CURATED INSPIRATION VAULT
          ======================================================== */}
      {activeTab === 'curated_vault' && (
        <div className="space-y-6">
          {/* Vault Header Banner */}
          <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-surface via-surface-muted to-primary/5 border border-border-subtle space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
                  Winning Commercial Layouts // Zero AI Overhead
                </span>
              </div>
              <span className="text-xs font-mono bg-surface px-3 py-1 rounded-full border border-border-subtle text-ink font-semibold">
                6 Verified Templates
              </span>
            </div>
            <h2 className="font-tight font-extrabold text-2xl sm:text-3xl text-ink tracking-tight">
              Pre-Deconstructed Commercial Vault
            </h2>
            <p className="text-layout-layer text-xs sm:text-sm max-w-2xl leading-relaxed">
              These winning commercial templates are already structured with strict typed slots, layout-fit protections, and brand bindings. Clone them into your brand for <strong>$0.00</strong> without consuming AI generation quotas.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 bg-surface p-2 rounded-2xl border border-border-subtle">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setVaultCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  vaultCategory === cat
                    ? 'bg-primary text-primary-fg shadow-2xs'
                    : 'text-layout-layer hover:text-ink hover:bg-surface-hover'
                }`}
              >
                {cat === 'all' ? 'All Industries' : cat}
              </button>
            ))}
          </div>

          {/* Curated Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCurated.map((template) => {
              const isCloningThis = cloningId === template.id;

              return (
                <div
                  key={template.id}
                  className="flex flex-col justify-between bg-surface rounded-2xl border border-border-subtle shadow-xs p-5 sm:p-6 hover:border-primary/50 hover:shadow-md transition-all duration-200 space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/25">
                        {template.badge || 'Commercial Winner'}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono uppercase bg-surface-muted text-layout-layer px-2 py-0.5 rounded border border-border-subtle font-semibold">
                          {template.poster_type}
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-semibold">
                          {template.intended_product_shape}
                        </span>
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <h3 className="font-tight font-bold text-lg text-ink leading-snug">
                        {template.title}
                      </h3>
                      <p className="text-xs text-layout-layer mt-1 leading-relaxed">
                        {template.tagline}
                      </p>
                    </div>

                    {/* Recommended for */}
                    <div className="p-3 bg-surface-muted rounded-xl border border-border-subtle text-[11px] space-y-1">
                      <span className="font-semibold text-ink uppercase tracking-wider text-[10px] block">
                        Recommended For
                      </span>
                      <p className="text-layout-layer leading-relaxed">{template.recommendedFor}</p>
                    </div>

                    {/* Prompt Snippet */}
                    <div className="p-3 bg-surface-muted rounded-xl border border-border-subtle font-mono text-[11px] text-ink/90 line-clamp-3 leading-relaxed">
                      {template.prompt_template}
                    </div>

                    {/* Slots Meta */}
                    <div className="flex items-center justify-between text-xs text-layout-layer pt-1 font-medium">
                      <span>{template.slots.length} configured slots</span>
                      <span className="flex items-center space-x-1 text-emerald-500 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Protected</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border-subtle space-y-2">
                    <button
                      type="button"
                      onClick={() => handleCloneCurated(template)}
                      disabled={isCloningThis}
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary text-primary-fg font-semibold rounded-xl hover:opacity-90 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm cursor-pointer min-h-[40px]"
                    >
                      {isCloningThis ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cloning &amp; Injected Brand Tokens...</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4" />
                          <span>Clone to Active Brand ($0.00)</span>
                          <ArrowRight className="w-4 h-4 text-accent" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyCuratedPrompt(template)}
                      className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border-subtle hover:bg-surface-hover transition-colors text-ink active:scale-[0.98] cursor-pointer"
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-success" />
                          <span className="text-success">Copied with Brand Injected!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-layout-layer" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: MANUAL ADD ENTRY & BULK IMPORT
          ======================================================== */}
      <AddEntryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        activeBrandId={activeBrandId}
        onSuccess={async () => {
          await fetchEntries();
          setActiveTab('my_templates');
        }}
      />
    </div>
  );
}
