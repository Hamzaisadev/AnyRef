'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { Brand } from '@/domain/brand';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  async function handleCreateBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Brand name is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          what_you_sell: whatYouSell.trim(),
          why: why.trim(),
          tone: tone.trim(),
          wordmark: wordmark.trim(),
          slogan: slogan.trim(),
          footer_text: footerText.trim(),
          never_do_rules: neverDoRules.trim(),
          colors,
          default_values: {},
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Failed to create brand.');
      } else {
        setShowCreateForm(false);
        setName('');
        setWhatYouSell('');
        setWhy('');
        setTone('');
        setWordmark('');
        setSlogan('');
        setFooterText('');
        setNeverDoRules('');
        fetchBrands();
      }
    } catch {
      setError('Network error occurred.');
    } finally {
      setSubmitting(false);
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
            Configure visual guidelines, colors, wordmarks, and negative rules for your brands.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-xs active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px]"
        >
          {showCreateForm ? (
            <>
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>New Brand</span>
            </>
          )}
        </button>
      </div>

      {/* Create Brand Modal / Inline Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateBrand}
          className="p-6 sm:p-7 bg-white rounded-2xl border border-ink/10 shadow-sm space-y-6"
        >
          <h2 className="font-tight font-bold text-lg text-ink flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Create Brand Profile</span>
          </h2>

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
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-paper/30 font-medium text-ink"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-paper/30 font-medium text-ink"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-paper/30 font-medium text-ink"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-paper/30 font-medium text-ink"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-paper/30 font-medium text-ink"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-paper/30 font-medium text-ink"
              />
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-paper/30 font-medium text-ink leading-relaxed"
            />
          </div>

          {/* Color Palette */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase text-ink tracking-wider">
              Color Palette (Hex)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {colors.map((hex) => (
                <div
                  key={hex}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-ink/15 bg-paper/60 text-xs font-mono font-medium"
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
                className="w-9 h-9 rounded-xl border border-ink/20 cursor-pointer p-0.5 bg-paper"
              />
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="#HEX"
                className="w-28 px-3 py-2 border border-ink/20 rounded-xl text-xs font-mono uppercase bg-paper/30 font-medium"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-4 py-2 bg-ink/10 text-ink text-xs rounded-xl hover:bg-ink/20 font-semibold transition-all active:scale-[0.98]"
              >
                Add Color
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2.5 border border-ink/20 rounded-xl text-sm font-semibold hover:bg-ink/5 transition-all text-layout-layer hover:text-ink active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/95 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Brand</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Brand Grid */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-layout-layer text-sm font-medium">Loading brands...</p>
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-ink/20 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-ink/5 mx-auto flex items-center justify-center text-layout-layer">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-tight font-bold text-ink text-lg">No brands configured</h3>
            <p className="text-layout-layer text-sm max-w-sm mx-auto leading-relaxed">
              Create your first brand profile to automatically bind wordmarks, slogans, and palette tokens into every prompt.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="p-6 bg-white rounded-2xl border border-ink/10 shadow-xs space-y-4 hover:border-primary/40 hover:shadow-sm transition-all duration-150 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-tight font-bold text-xl text-ink tracking-tight">
                    {brand.name}
                  </h3>
                  {brand.wordmark && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-layer/10 text-brand-layer border border-brand-layer/20">
                      {brand.wordmark}
                    </span>
                  )}
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

                {brand.slogan && (
                  <div className="text-xs text-ink/80 italic border-l-2 border-primary/40 pl-2.5 py-0.5 leading-relaxed">
                    "{brand.slogan}"
                  </div>
                )}
              </div>

              {brand.never_do_rules && (
                <div className="text-xs bg-ink/5 p-3 rounded-xl text-ink/80 flex items-start space-x-2 border border-ink/5">
                  <ShieldAlert className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong className="text-danger font-semibold">Never:</strong> {brand.never_do_rules}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
