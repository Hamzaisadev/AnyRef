'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Palette,
  Plus,
  Trash2,
  X,
  Check,
  Building2,
  ShieldAlert,
  Loader2,
  Sparkles,
  Edit2,
  Edit3,
  ChevronDown,
  Upload,
  AlertTriangle,
  ImageIcon,
} from 'lucide-react';
import type { Brand } from '@/domain/brand';
import { useBrand } from '@/context/BrandContext';

export default function BrandsPage() {
  const { activeBrandId, switchBrand, refreshBrands: syncGlobalBrands } = useBrand();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state (Create or Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [showNewBrandMenu, setShowNewBrandMenu] = useState(false);

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
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({});
  const [newDefaultKey, setNewDefaultKey] = useState('');
  const [newDefaultValue, setNewDefaultValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Delete modal state
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [dependentEntriesCount, setDependentEntriesCount] = useState<number | null>(null);
  const [checkingEntries, setCheckingEntries] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    setLoading(true);
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || []);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingBrand(null);
    setName('');
    setWhatYouSell('');
    setWhy('');
    setTone('');
    setWordmark('');
    setSlogan('');
    setFooterText('');
    setNeverDoRules('');
    setColors(['#0F1020', '#4B2BFF']);
    setNewColor('#FF8A3D');
    setLogoPath(null);
    setDefaultValues({});
    setNewDefaultKey('');
    setNewDefaultValue('');
    setError('');
    setShowForm(true);
  }

  function openEditForm(brand: Brand) {
    setEditingBrand(brand);
    setName(brand.name || '');
    setWhatYouSell(brand.what_you_sell || '');
    setWhy(brand.why || '');
    setTone(brand.tone || '');
    setWordmark(brand.wordmark || '');
    setSlogan(brand.slogan || '');
    setFooterText(brand.footer_text || '');
    setNeverDoRules(brand.never_do_rules || '');
    setColors(brand.colors && brand.colors.length > 0 ? brand.colors : ['#0F1020', '#4B2BFF']);
    setNewColor('#FF8A3D');
    setLogoPath(brand.logo_path || null);
    setDefaultValues(brand.default_values || {});
    setNewDefaultKey('');
    setNewDefaultValue('');
    setError('');
    setShowForm(true);
  }

  function addColor() {
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor)) {
      if (!colors.includes(newColor)) {
        setColors([...colors, newColor]);
      }
    }
  }

  function removeColor(hexToRemove: string) {
    setColors(colors.filter((c) => c !== hexToRemove));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setLogoUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'logos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Logo upload failed.');
      } else {
        const finalPath = data.path.startsWith('/api/assets/')
          ? data.path
          : `/api/assets/logos/${data.path}`;
        setLogoPath(finalPath);
      }
    } catch {
      setError('Network communication failed during logo upload.');
    } finally {
      setLogoUploading(false);
    }
  }

  function addDefaultValue() {
    const k = newDefaultKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!k || !newDefaultValue.trim()) return;
    setDefaultValues((prev) => ({
      ...prev,
      [k]: newDefaultValue.trim(),
    }));
    setNewDefaultKey('');
    setNewDefaultValue('');
  }

  function removeDefaultValue(keyToRemove: string) {
    setDefaultValues((prev) => {
      const copy = { ...prev };
      delete copy[keyToRemove];
      return copy;
    });
  }

  async function handleSaveBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Brand name is required.');
      return;
    }

    setSubmitting(true);
    setError('');

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
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands';
      const method = editingBrand ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || `Failed to ${editingBrand ? 'update' : 'create'} brand.`);
      } else {
        setShowForm(false);
        setEditingBrand(null);
        await fetchBrands();
        await syncGlobalBrands();
      }
    } catch {
      setError('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  async function openDeleteModal(brand: Brand) {
    setBrandToDelete(brand);
    setCheckingEntries(true);
    setDependentEntriesCount(null);
    try {
      const res = await fetch(`/api/entries?brand_id=${brand.id}`);
      if (res.ok) {
        const data = await res.json();
        setDependentEntriesCount(data.entries?.length || 0);
      } else {
        setDependentEntriesCount(0);
      }
    } catch {
      setDependentEntriesCount(0);
    } finally {
      setCheckingEntries(false);
    }
  }

  async function handleConfirmDelete() {
    if (!brandToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/brands/${brandToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = brands.filter((b) => b.id !== brandToDelete.id);
        if (brandToDelete.id === activeBrandId && remaining.length > 0) {
          switchBrand(remaining[0]!.id);
        }
        setBrandToDelete(null);
        await fetchBrands();
        await syncGlobalBrands();
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to delete brand.');
      }
    } catch {
      alert('Network error while deleting brand.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-tight font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Brand Identities
          </h1>
          <p className="text-layout-layer text-sm sm:text-base mt-1">
            Configure visual guidelines, colors, logos, wordmarks, and default slot bindings.
          </p>
        </div>

        {showForm ? (
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditingBrand(null);
            }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-surface border border-border-subtle text-ink text-xs sm:text-sm font-semibold rounded-xl hover:bg-surface-muted transition-all shadow-xs active:scale-[0.98] min-h-[40px] cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        ) : (
          <div className="relative inline-flex items-center rounded-xl shadow-xs">
            <Link
              href="/brands/new"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-primary text-primary-fg text-xs sm:text-sm font-semibold rounded-l-xl hover:bg-primary/95 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px]"
              title="Describe it (AI draft - default)"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Brand</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowNewBrandMenu(!showNewBrandMenu)}
              aria-label="New brand creation options"
              aria-expanded={showNewBrandMenu}
              className="px-2.5 py-2.5 bg-primary text-primary-fg border-l border-white/20 rounded-r-xl hover:bg-primary/90 transition-all min-h-[40px] cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {showNewBrandMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-60 bg-surface border border-border-subtle rounded-xl shadow-lg py-1.5 z-20"
                onMouseLeave={() => setShowNewBrandMenu(false)}
              >
                <Link
                  href="/brands/new"
                  onClick={() => setShowNewBrandMenu(false)}
                  className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-muted transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <div className="text-left">
                    <div>Describe it (Default)</div>
                    <div className="text-[10px] text-layout-layer font-normal">AI drafts from business description</div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewBrandMenu(false);
                    openCreateForm();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-muted transition-colors cursor-pointer text-left"
                >
                  <Edit3 className="w-4 h-4 text-layout-layer shrink-0" />
                  <div>
                    <div>Fill the form manually</div>
                    <div className="text-[10px] text-layout-layer font-normal">Blank brand configuration form</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Brand Form (Create or Edit) */}
      {showForm && (
        <form
          onSubmit={handleSaveBrand}
          className="p-6 sm:p-7 bg-surface rounded-2xl border border-border-subtle shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span>{editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Create Brand Profile'}</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-layout-layer hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
              title="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-ink tracking-wider mb-1.5">
                Brand Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rewired"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink tracking-wider mb-1.5">
                Wordmark Text
              </label>
              <input
                type="text"
                value={wordmark}
                onChange={(e) => setWordmark(e.target.value)}
                placeholder="e.g. REWIRED"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink tracking-wider mb-1.5">
                What You Sell
              </label>
              <input
                type="text"
                value={whatYouSell}
                onChange={(e) => setWhatYouSell(e.target.value)}
                placeholder="e.g. High-performance wireless audio"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink tracking-wider mb-1.5">
                Tone of Voice
              </label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="e.g. Direct, technical, energetic"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink tracking-wider mb-1.5">
                Brand Tagline / Slogan
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="e.g. Engineered for pure focus"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink tracking-wider mb-1.5">
                Footer Legal Text
              </label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="e.g. Free shipping on orders over $50."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink"
              />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <label className="block text-xs font-semibold uppercase text-ink tracking-wider">
              Brand Logo
            </label>
            <div className="flex flex-wrap items-center gap-4">
              {logoPath ? (
                <div className="relative group">
                  <div className="w-20 h-20 rounded-xl border border-border-subtle bg-surface-muted p-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={logoPath}
                      alt="Brand Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoPath(null)}
                    className="absolute -top-2 -right-2 bg-danger text-danger-fg p-1 rounded-full shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                    title="Remove logo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border-strong bg-surface-muted flex items-center justify-center text-layout-layer">
                  <ImageIcon className="w-7 h-7" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="inline-flex items-center space-x-2 px-3.5 py-2 bg-surface-muted hover:bg-surface border border-border-subtle text-xs font-semibold text-ink rounded-xl cursor-pointer transition-colors shadow-2xs">
                  {logoUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Logo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoPath ? 'Change Logo Image' : 'Upload Logo Image'}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-layout-layer">
                  PNG, JPG, or WebP up to 8MB. Stored securely in your private logos bucket.
                </p>
              </div>
            </div>
          </div>

          {/* Default Values Editor */}
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase text-ink tracking-wider">
                Default Slot Values
              </label>
              <span className="text-[11px] text-layout-layer">
                Pre-populates template slots (e.g. headline, promo_text)
              </span>
            </div>

            {Object.keys(defaultValues).length > 0 && (
              <div className="space-y-2">
                {Object.entries(defaultValues).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border-subtle bg-surface-muted text-xs font-mono"
                  >
                    <span className="font-bold text-ink">{key}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-layout-layer font-sans">{val}</span>
                      <button
                        type="button"
                        onClick={() => removeDefaultValue(key)}
                        className="text-layout-layer hover:text-danger p-0.5 cursor-pointer"
                        title="Remove default value"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newDefaultKey}
                onChange={(e) => setNewDefaultKey(e.target.value)}
                placeholder="Slot key (e.g. headline)"
                className="w-40 px-3 py-2 border border-border-subtle rounded-xl text-xs font-mono bg-surface-muted font-medium text-ink focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                value={newDefaultValue}
                onChange={(e) => setNewDefaultValue(e.target.value)}
                placeholder="Default value (e.g. Summer Special)"
                className="flex-1 min-w-[180px] px-3 py-2 border border-border-subtle rounded-xl text-xs bg-surface-muted font-medium text-ink focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={addDefaultValue}
                disabled={!newDefaultKey.trim() || !newDefaultValue.trim()}
                className="px-4 py-2 bg-surface-muted border border-border-subtle text-ink text-xs rounded-xl hover:border-border-strong font-semibold transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
              >
                Add Slot Default
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-ink tracking-wider mb-1.5">
              "Never Do" Rules (Passed directly to AI prompt generator)
            </label>
            <textarea
              rows={2}
              value={neverDoRules}
              onChange={(e) => setNeverDoRules(e.target.value)}
              placeholder="e.g. Never use vintage filters; never show tangled cables; never use neon text."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface-muted font-medium text-ink leading-relaxed"
            />
          </div>

          {/* Color Palette */}
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <label className="block text-xs font-semibold uppercase text-ink tracking-wider">
              Color Palette (Hex)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {colors.map((hex, index) => (
                <div
                  key={`${hex}-${index}`}
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
                    className="text-layout-layer hover:text-danger ml-1 p-0.5 cursor-pointer"
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

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 border border-border-subtle rounded-xl text-sm font-semibold hover:bg-surface-muted transition-all text-layout-layer hover:text-ink active:scale-[0.98] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-primary-fg rounded-xl text-sm font-semibold hover:bg-primary/95 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingBrand ? 'Save Changes' : 'Create Brand'}</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {brandToDelete && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl border border-border-subtle p-6 max-w-md w-full shadow-lg space-y-4">
            <div className="flex items-center space-x-3 text-danger">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-tight font-bold text-lg text-ink">Delete Brand Profile</h3>
            </div>

            {checkingEntries ? (
              <div className="py-6 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-layout-layer">Checking dependent poster entries...</p>
              </div>
            ) : dependentEntriesCount && dependentEntriesCount > 0 ? (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger space-y-2">
                <p className="font-semibold text-xs uppercase tracking-wider">
                  Caution: Dependent Data Warning
                </p>
                <p className="text-xs leading-relaxed text-ink/90">
                  This brand has <strong>{dependentEntriesCount}</strong> saved poster {dependentEntriesCount === 1 ? 'entry' : 'entries'}. Deleting <strong>{brandToDelete.name}</strong> will permanently cascade-delete all associated entries!
                </p>
              </div>
            ) : (
              <p className="text-sm text-layout-layer leading-relaxed">
                Are you sure you want to delete <strong>{brandToDelete.name}</strong>? This action cannot be undone.
              </p>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setBrandToDelete(null)}
                className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-semibold text-layout-layer hover:text-ink hover:bg-surface-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || checkingEntries}
                onClick={handleConfirmDelete}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-danger text-danger-fg rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brand Grid */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-layout-layer text-sm font-medium">Loading brands...</p>
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border-strong p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-border-subtle mx-auto flex items-center justify-center text-layout-layer">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-tight font-bold text-ink text-lg">No brands configured</h3>
            <p className="text-layout-layer text-sm max-w-sm mx-auto leading-relaxed">
              Create your first brand profile to automatically bind wordmarks, slogans, and palette tokens into every prompt.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/brands/new"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary text-primary-fg text-xs font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Describe it (AI Draft)</span>
            </Link>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-surface-muted border border-border-subtle text-ink text-xs font-semibold rounded-xl hover:border-border-strong transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Fill manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => {
            const isActive = brand.id === activeBrandId;
            const defaultValuesCount = Object.keys(brand.default_values || {}).length;

            return (
              <div
                key={brand.id}
                className={`p-6 bg-surface rounded-2xl border shadow-xs space-y-4 transition-all duration-150 flex flex-col justify-between ${
                  isActive
                    ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                    : 'border-border-subtle hover:border-primary/40 hover:shadow-xs'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {brand.logo_path && (
                        <div className="w-8 h-8 rounded-lg border border-border-subtle bg-surface-muted p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={
                              brand.logo_path.startsWith('/api/assets/')
                                ? brand.logo_path
                                : `/api/assets/logos/${brand.logo_path.replace(/^\/+/, '')}`
                            }
                            alt={`${brand.name} logo`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}
                      <h3 className="font-tight font-bold text-xl text-ink tracking-tight truncate">
                        {brand.name}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {isActive && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-primary-fg shadow-2xs">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                      {brand.wordmark && !isActive && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-layer/10 text-brand-layer border border-brand-layer/20">
                          {brand.wordmark}
                        </span>
                      )}
                    </div>
                  </div>

                  {brand.what_you_sell && (
                    <p className="text-sm text-layout-layer leading-relaxed">
                      {brand.what_you_sell}
                    </p>
                  )}

                  {/* Palette */}
                  {brand.colors.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-ink/70 uppercase tracking-wider">
                        Palette
                      </span>
                      <div className="flex items-center space-x-2">
                        {brand.colors.map((hex, i) => (
                          <span
                            key={i}
                            className="w-6 h-6 rounded-full border border-black/10 shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slogan */}
                  {brand.slogan && (
                    <div className="text-xs text-ink/80 italic border-l-2 border-primary/40 pl-2.5 py-0.5 leading-relaxed">
                      "{brand.slogan}"
                    </div>
                  )}

                  {/* Default Values Tag */}
                  {defaultValuesCount > 0 && (
                    <div className="text-[11px] text-layout-layer font-mono bg-surface-muted px-2.5 py-1 rounded-lg border border-border-subtle inline-block">
                      {defaultValuesCount} default slot {defaultValuesCount === 1 ? 'value' : 'values'} configured
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  {brand.never_do_rules && (
                    <div className="text-xs bg-surface-muted p-3 rounded-xl text-ink/90 flex items-start space-x-2 border border-border-subtle">
                      <ShieldAlert className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        <strong className="text-danger font-semibold">Never:</strong> {brand.never_do_rules}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => switchBrand(brand.id)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-border-subtle hover:border-primary hover:bg-primary/10 text-xs font-semibold text-ink hover:text-primary transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Use Colors</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditForm(brand)}
                      className="inline-flex items-center justify-center space-x-1 p-2 rounded-xl border border-border-subtle hover:bg-surface-muted text-xs font-semibold text-layout-layer hover:text-ink transition-colors cursor-pointer"
                      title="Edit brand"
                      aria-label={`Edit ${brand.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDeleteModal(brand)}
                      className="inline-flex items-center justify-center space-x-1 p-2 rounded-xl border border-border-subtle hover:bg-danger/10 hover:border-danger/30 text-xs font-semibold text-layout-layer hover:text-danger transition-colors cursor-pointer"
                      title="Delete brand"
                      aria-label={`Delete ${brand.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
