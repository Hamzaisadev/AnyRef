'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Edit3,
  Building2,
  UploadCloud,
  Check,
  X,
  Plus,
  Loader2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import type { BrandDraftOutput, FieldSource } from '@/ai/schemas';
import { normalizeLogoAssetPath } from '@/domain/brand';
import { FieldSourceBadge } from '@/components/brands/FieldSourceBadge';
import { useBrand } from '@/context/BrandContext';

type TabMode = 'describe' | 'manual';

export default function NewBrandPage() {
  const router = useRouter();
  const { switchBrand, refreshBrands } = useBrand();

  const [mode, setMode] = useState<TabMode>('describe');

  // "Describe it" stage state
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [draftResult, setDraftResult] = useState<BrandDraftOutput | null>(null);

  // Brand form state (filled either manually or pre-filled from draft)
  const [name, setName] = useState('');
  const [whatYouSell, setWhatYouSell] = useState('');
  const [why, setWhy] = useState('');
  const [tone, setTone] = useState('');
  const [wordmark, setWordmark] = useState('');
  const [slogan, setSlogan] = useState('');
  const [footerText, setFooterText] = useState('');
  const [neverDoRules, setNeverDoRules] = useState('');
  const [colors, setColors] = useState<string[]>(['#0F1020', '#4B2BFF']);
  const [newColor, setNewColor] = useState('#FF8A3D');
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({});
  const [newDefaultKey, setNewDefaultKey] = useState('');
  const [newDefaultValue, setNewDefaultValue] = useState('');

  // Field source tracking
  const [fieldSources, setFieldSources] = useState<
    Partial<Record<string, { source: FieldSource; note?: string }>>
  >({});

  // Submitting state for save
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  // Handle logo file selection and upload
  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(file);

    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);

    // Upload immediately through existing validated upload path
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'logos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogoPath(normalizeLogoAssetPath(data.path));
      } else {
        const data = await res.json();
        setDraftError(data.error?.message || 'Logo upload failed.');
      }
    } catch {
      setDraftError('Failed to upload logo.');
    }
  }

  // Handle "Create brand draft" click
  async function handleCreateDraft(e: React.FormEvent) {
    e.preventDefault();
    const cleanDesc = description.trim();
    if (cleanDesc.length < 20) {
      setDraftError('Please write at least 20 characters describing your business.');
      return;
    }

    setDrafting(true);
    setDraftError('');

    try {
      const res = await fetch('/api/brands/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: cleanDesc,
          logo_path: logoPath,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDraftError(data.error?.message || 'Failed to create brand draft.');
        setDrafting(false);
        return;
      }

      const draft: BrandDraftOutput = data.draft;
      setDraftResult(draft);

      // Pre-fill form values
      setName(draft.name.value || '');
      setWhatYouSell(draft.what_you_sell.value || '');
      setWhy(draft.why.value || '');
      setTone(draft.tone.value || '');
      setWordmark(draft.wordmark.value || '');
      setSlogan(draft.slogan.value || '');
      setFooterText(draft.footer_text.value || '');
      setNeverDoRules(draft.never_do_rules.value || '');
      setColors(draft.colors.value && draft.colors.value.length > 0 ? draft.colors.value : []);
      setDefaultValues(draft.default_values.value || {});

      // Record source tags
      setFieldSources({
        name: { source: draft.name.source, note: draft.name.note },
        what_you_sell: { source: draft.what_you_sell.source, note: draft.what_you_sell.note },
        why: { source: draft.why.source, note: draft.why.note },
        tone: { source: draft.tone.source, note: draft.tone.note },
        wordmark: { source: draft.wordmark.source, note: draft.wordmark.note },
        slogan: { source: draft.slogan.source, note: draft.slogan.note },
        footer_text: { source: draft.footer_text.source, note: draft.footer_text.note },
        never_do_rules: { source: draft.never_do_rules.source, note: draft.never_do_rules.note },
        colors: { source: draft.colors.source, note: draft.colors.note },
        default_values: { source: draft.default_values.source, note: draft.default_values.note },
      });
    } catch {
      setDraftError('Network error while creating brand draft.');
    } finally {
      setDrafting(false);
    }
  }

  function addColor() {
    if (/^#([A-Fa-f0-9]{6})$/.test(newColor)) {
      if (!colors.includes(newColor)) {
        setColors([...colors, newColor]);
      }
    }
  }

  function removeColor(hexToRemove: string) {
    setColors(colors.filter((c) => c !== hexToRemove));
  }

  function addDefaultValue() {
    const k = newDefaultKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const v = newDefaultValue.trim();
    if (k && v) {
      setDefaultValues((prev) => ({ ...prev, [k]: v }));
      setNewDefaultKey('');
      setNewDefaultValue('');
    }
  }

  function removeDefaultValue(keyToRemove: string) {
    setDefaultValues((prev) => {
      const next = { ...prev };
      delete next[keyToRemove];
      return next;
    });
  }

  // Handle final Save Brand click (saves to database)
  async function handleSaveBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setSaveError('Brand name is required.');
      return;
    }

    setSaving(true);
    setSaveError('');

    const payload = {
      name: name.trim(),
      what_you_sell: whatYouSell.trim(),
      why: why.trim(),
      tone: tone.trim(),
      wordmark: wordmark.trim(),
      slogan: slogan.trim(),
      footer_text: footerText.trim(),
      never_do_rules: neverDoRules.trim(),
      colors,
      logo_path: logoPath,
      default_values: defaultValues,
    };

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error?.message || 'Failed to save brand.');
        setSaving(false);
      } else {
        const data = await res.json();
        await refreshBrands();
        if (data.brand?.id) {
          switchBrand(data.brand.id);
        }
        router.push('/brands');
      }
    } catch {
      setSaveError('Network error while saving brand.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back button & Title */}
      <div className="space-y-4">
        <Link
          href="/brands"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-layout-layer hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Brand Identities</span>
        </Link>

        <div>
          <h1 className="font-tight font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Create New Brand
          </h1>
          <p className="text-layout-layer text-sm sm:text-base mt-1">
            Build your visual identity guidelines for consistent prompt generation.
          </p>
        </div>

        {/* Path Selection Tabs */}
        {!draftResult && (
          <div className="flex items-center space-x-2 border-b border-border-subtle pt-2">
            <button
              type="button"
              onClick={() => setMode('describe')}
              className={`inline-flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                mode === 'describe'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-layout-layer hover:text-ink'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Describe it (AI Draft)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`inline-flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-layout-layer hover:text-ink'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Fill the form manually</span>
            </button>
          </div>
        )}
      </div>

      {/* Path 1: Describe It Screen */}
      {mode === 'describe' && !draftResult && (
        <form
          onSubmit={handleCreateDraft}
          className="p-6 sm:p-8 bg-surface rounded-2xl border border-border-subtle shadow-xs space-y-6"
        >
          <div className="space-y-2">
            <h2 className="font-tight font-bold text-xl text-ink flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Describe Your Business</span>
            </h2>
            <p className="text-layout-layer text-sm leading-relaxed">
              Tell us about your business: what you sell, who it's for, how you want to sound, and your colors if you know them.
              You may write in any language, including Roman Urdu or mixed languages.
            </p>
          </div>

          {draftError && (
            <div
              role="alert"
              className="p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl font-medium flex items-center space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{draftError}</span>
            </div>
          )}

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-ink tracking-wider">
              <label htmlFor="description">Business Description *</label>
              <span
                className={`font-mono text-xs ${
                  description.length > 2000 ? 'text-danger font-bold' : 'text-layout-layer'
                }`}
              >
                {description.length} / 2,000
              </span>
            </div>
            <textarea
              id="description"
              required
              rows={6}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Hum handmade leather bags aur wallets banate hain for modern professionals. Minimal, durable, and premium quality with vintage tan and espresso colors. Slogan: Crafted to endure. Never show fake plastic seams or neon filters."
              className="w-full px-4 py-3 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink leading-relaxed"
            />
          </div>

          {/* Optional Logo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase text-ink tracking-wider">
              Brand Logo (Optional)
            </label>
            <p className="text-xs text-layout-layer">
              Upload your logo (PNG, JPEG, or WebP) so brand colors and wordmarks can be analyzed.
            </p>

            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center space-x-2 px-4 py-2 bg-surface-muted border border-border-subtle hover:border-border-strong text-ink text-xs rounded-xl font-semibold cursor-pointer transition-colors">
                <UploadCloud className="w-4 h-4 text-layout-layer" />
                <span>Choose Logo File</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
              </label>

              {logoPreview && (
                <div className="flex items-center space-x-2 p-1.5 bg-surface-muted rounded-xl border border-border-subtle">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-8 h-8 rounded-lg object-contain bg-white"
                  />
                  <span className="text-xs font-medium text-ink truncate max-w-[150px]">
                    {logoFile?.name || 'logo.png'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Draft Button */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border-subtle">
            <button
              type="submit"
              disabled={drafting || description.trim().length < 20}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-primary text-primary-fg rounded-xl text-sm font-semibold hover:bg-primary/95 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {drafting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing business & drafting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Brand Draft</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Path 2 or Review & Edit Draft Screen */}
      {(mode === 'manual' || draftResult) && (
        <form
          onSubmit={handleSaveBrand}
          className="p-6 sm:p-8 bg-surface rounded-2xl border border-border-subtle shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="space-y-1">
              <h2 className="font-tight font-bold text-xl text-ink flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>{draftResult ? 'Review & Edit Brand Draft' : 'Brand Profile'}</span>
              </h2>
              {draftResult && (
                <p className="text-xs text-layout-layer">
                  Review the AI-extracted fields below. Badges indicate extraction sources. Nothing is saved until you click Save Brand.
                </p>
              )}
            </div>
            {draftResult && (
              <button
                type="button"
                onClick={() => {
                  setDraftResult(null);
                  setMode('describe');
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Start Over
              </button>
            )}
          </div>

          {saveError && (
            <div
              role="alert"
              className="p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl font-medium flex items-center space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {draftResult?.missing && draftResult.missing.length > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs rounded-xl flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>
                Please check missing information: <strong>{draftResult.missing.join(', ')}</strong>.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Brand Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                  Brand Name *
                </label>
                {fieldSources.name && (
                  <FieldSourceBadge
                    source={fieldSources.name.source}
                    note={fieldSources.name.note}
                  />
                )}
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rewired"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            {/* Wordmark */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                  Wordmark Text
                </label>
                {fieldSources.wordmark && (
                  <FieldSourceBadge
                    source={fieldSources.wordmark.source}
                    note={fieldSources.wordmark.note}
                  />
                )}
              </div>
              <input
                type="text"
                value={wordmark}
                onChange={(e) => setWordmark(e.target.value)}
                placeholder="e.g. REWIRED"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            {/* What you sell */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                  What You Sell
                </label>
                {fieldSources.what_you_sell && (
                  <FieldSourceBadge
                    source={fieldSources.what_you_sell.source}
                    note={fieldSources.what_you_sell.note}
                  />
                )}
              </div>
              <input
                type="text"
                value={whatYouSell}
                onChange={(e) => setWhatYouSell(e.target.value)}
                placeholder="e.g. Handcrafted leather bags & accessories"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            {/* Tone of voice */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                  Tone of Voice
                </label>
                {fieldSources.tone && (
                  <FieldSourceBadge
                    source={fieldSources.tone.source}
                    note={fieldSources.tone.note}
                  />
                )}
              </div>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="e.g. Elegant, artisanal, trustworthy"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            {/* Why / Brand Story */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                  Brand Mission & Why
                </label>
                {fieldSources.why && (
                  <FieldSourceBadge
                    source={fieldSources.why.source}
                    note={fieldSources.why.note}
                  />
                )}
              </div>
              <input
                type="text"
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="e.g. Empowering timeless style with durable craftsmanship"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            {/* Slogan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                  Brand Tagline / Slogan
                </label>
                {fieldSources.slogan && (
                  <FieldSourceBadge
                    source={fieldSources.slogan.source}
                    note={fieldSources.slogan.note}
                  />
                )}
              </div>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="e.g. Crafted to endure"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            {/* Footer Text */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                  Footer / Legal Text
                </label>
                {fieldSources.footer_text && (
                  <FieldSourceBadge
                    source={fieldSources.footer_text.source}
                    note={fieldSources.footer_text.note}
                  />
                )}
              </div>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="e.g. Free shipping on all domestic orders"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>
          </div>

          {/* Never Do Rules */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                "Never Do" Rules
              </label>
              {fieldSources.never_do_rules && (
                <FieldSourceBadge
                  source={fieldSources.never_do_rules.source}
                  note={fieldSources.never_do_rules.note}
                />
              )}
            </div>
            <textarea
              rows={2}
              value={neverDoRules}
              onChange={(e) => setNeverDoRules(e.target.value)}
              placeholder="e.g. Never use synthetic neon colors; never display fake stitching."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink leading-relaxed"
            />
          </div>

          {/* Color Palette */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                Color Palette (Hex)
              </label>
              {fieldSources.colors && (
                <FieldSourceBadge
                  source={fieldSources.colors.source}
                  note={fieldSources.colors.note}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {colors.map((hex) => (
                <div
                  key={hex}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-border-subtle bg-surface-muted text-xs font-mono font-medium text-ink"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: hex }}
                  />
                  <span>{hex}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(hex)}
                    className="text-layout-layer hover:text-danger ml-1 p-0.5"
                    title="Remove color"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-9 h-9 rounded-xl border border-border-subtle cursor-pointer p-0.5 bg-surface"
              />
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="#HEX"
                className="w-28 px-3 py-2 border border-border-subtle rounded-xl text-xs font-mono uppercase bg-surface-muted font-medium text-ink"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-4 py-2 bg-surface-muted border border-border-subtle text-ink text-xs rounded-xl hover:border-border-strong font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                Add Color
              </button>
            </div>
          </div>

          {/* Default Slot Values */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-ink tracking-wider">
                Default Slot Bindings
              </label>
              {fieldSources.default_values && (
                <FieldSourceBadge
                  source={fieldSources.default_values.source}
                  note={fieldSources.default_values.note}
                />
              )}
            </div>

            {Object.keys(defaultValues).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(defaultValues).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border-subtle bg-surface-muted text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-primary">{k}: </span>
                      <span className="text-ink font-medium">{v}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDefaultValue(k)}
                      className="text-layout-layer hover:text-danger p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newDefaultKey}
                onChange={(e) => setNewDefaultKey(e.target.value)}
                placeholder="key (e.g. cta_button)"
                className="w-1/3 px-3 py-2 border border-border-subtle rounded-xl text-xs bg-surface-muted text-ink font-mono"
              />
              <input
                type="text"
                value={newDefaultValue}
                onChange={(e) => setNewDefaultValue(e.target.value)}
                placeholder="value (e.g. Shop Collection)"
                className="w-1/2 px-3 py-2 border border-border-subtle rounded-xl text-xs bg-surface-muted text-ink"
              />
              <button
                type="button"
                onClick={addDefaultValue}
                className="px-4 py-2 bg-surface-muted border border-border-subtle text-ink text-xs rounded-xl hover:border-border-strong font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border-subtle">
            <Link
              href="/brands"
              className="px-5 py-2.5 border border-border-subtle rounded-xl text-sm font-semibold hover:bg-surface-muted transition-all text-layout-layer hover:text-ink active:scale-[0.98]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-primary text-primary-fg rounded-xl text-sm font-semibold hover:bg-primary/95 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving brand...</span>
                </>
              ) : (
                <span>Save Brand</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
