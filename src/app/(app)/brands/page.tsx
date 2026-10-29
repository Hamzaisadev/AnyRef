'use client';

import { useState, useEffect } from 'react';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-tight font-bold text-3xl text-ink tracking-tight">
            Brand Identities
          </h1>
          <p className="text-layout-layer text-sm mt-1">
            Configure visual guidelines, colors, wordmarks, and negative rules for your brands.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {showCreateForm ? 'Cancel' : '+ New Brand'}
        </button>
      </div>

      {/* Create Brand Modal / Inline Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateBrand}
          className="p-6 bg-white rounded-2xl border border-ink/10 shadow-sm space-y-5"
        >
          <h2 className="font-tight font-bold text-lg text-ink">Create New Brand</h2>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-ink/70 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rewired"
                className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink/70 mb-1">
                Wordmark Text
              </label>
              <input
                type="text"
                value={wordmark}
                onChange={(e) => setWordmark(e.target.value)}
                placeholder="e.g. REWIRED"
                className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink/70 mb-1">
                What You Sell
              </label>
              <input
                type="text"
                value={whatYouSell}
                onChange={(e) => setWhatYouSell(e.target.value)}
                placeholder="e.g. High-performance wireless audio"
                className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink/70 mb-1">
                Tone of Voice
              </label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="e.g. Direct, technical, energetic"
                className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink/70 mb-1">
                Brand Tagline / Slogan
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="e.g. Engineered for pure focus"
                className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink/70 mb-1">
                Footer Legal Text
              </label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="e.g. Free shipping on orders over $50."
                className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-ink/70 mb-1">
              "Never Do" Rules (Passed directly to AI prompt generator)
            </label>
            <textarea
              rows={2}
              value={neverDoRules}
              onChange={(e) => setNeverDoRules(e.target.value)}
              placeholder="e.g. Never use vintage filters; never show tangled cables; never use neon text."
              className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-semibold uppercase text-ink/70 mb-1">
              Color Palette (Hex)
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {colors.map((hex) => (
                <div
                  key={hex}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-ink/15 bg-white text-xs font-mono font-medium"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: hex }}
                  />
                  <span>{hex}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(hex)}
                    className="text-layout-layer hover:text-danger ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-8 h-8 rounded border border-ink/20 cursor-pointer"
              />
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="#HEX"
                className="w-28 px-2 py-1 border border-ink/20 rounded text-xs font-mono uppercase"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-3 py-1 bg-ink/10 text-ink text-xs rounded hover:bg-ink/20 font-medium"
              >
                Add Color
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-ink/20 rounded-lg text-sm font-medium hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-95 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Brand'}
            </button>
          </div>
        </form>
      )}

      {/* Brand Grid */}
      {loading ? (
        <div className="text-center py-12 text-layout-layer text-sm">
          Loading brands...
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-ink/20 p-8 space-y-3">
          <h3 className="font-tight font-semibold text-ink text-base">No brands found</h3>
          <p className="text-layout-layer text-sm max-w-sm mx-auto">
            Create your first brand profile or apply the database seed to start using Anyref.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="p-6 bg-white rounded-2xl border border-ink/10 shadow-sm space-y-4 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-tight font-bold text-xl text-ink">
                  {brand.name}
                </h3>
                {brand.wordmark && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-brand-layer/10 text-brand-layer">
                    {brand.wordmark}
                  </span>
                )}
              </div>

              {brand.what_you_sell && (
                <p className="text-sm text-layout-layer">
                  {brand.what_you_sell}
                </p>
              )}

              {/* Palette */}
              {brand.colors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-ink/70 uppercase">
                    Palette
                  </span>
                  <div className="flex items-center space-x-2">
                    {brand.colors.map((hex, i) => (
                      <span
                        key={i}
                        className="w-6 h-6 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>
              )}

              {brand.slogan && (
                <div className="text-xs text-ink/80 italic border-l-2 border-primary/40 pl-2">
                  "{brand.slogan}"
                </div>
              )}

              {brand.never_do_rules && (
                <div className="text-xs bg-ink/5 p-2.5 rounded-lg text-ink/80">
                  <strong className="text-danger">Never:</strong> {brand.never_do_rules}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
