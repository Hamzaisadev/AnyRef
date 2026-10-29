'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Brand } from '@/domain/brand';
import type { GenerateOutput } from '@/ai/schemas';

export default function GenerateStudioPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<GenerateOutput | null>(null);

  useEffect(() => {
    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        const brandList: Brand[] = data.brands || [];
        setBrands(brandList);
        if (brandList.length > 0 && !selectedBrandId) {
          setSelectedBrandId(brandList[0]!.id);
        }
      });
  }, [selectedBrandId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setProposal(null);
      setError('');
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please upload a reference poster image.');
      return;
    }
    if (!selectedBrandId) {
      setError('Please select an active brand.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('brand_id', selectedBrandId);
      formData.append('reference', file);

      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Generation failed.');
      } else {
        setProposal(data.proposal);
      }
    } catch {
      setError('Network communication failed during generation.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveEntry() {
    if (!proposal || !selectedBrandId) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: selectedBrandId,
          prompt_template: proposal.prompt_template,
          slots: proposal.slots,
          poster_type: proposal.poster_type,
          intended_product_shape: proposal.intended_product_shape,
          note: proposal.layout_notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to save entry.');
      } else {
        router.push(`/entries/${data.entry.id}`);
      }
    } catch {
      setError('Network error saving entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-tight font-bold text-3xl text-ink tracking-tight">
          Reference Deconstruction Studio
        </h1>
        <p className="text-layout-layer text-sm mt-1">
          Upload any poster reference from Pinterest or campaigns. AI will analyze the layout, lighting, and typography hierarchy without altering product or brand fidelity.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Main Studio View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Input & Dropzone */}
        <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm space-y-5">
          <h2 className="font-tight font-bold text-lg text-ink">1. Upload Reference</h2>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-ink/70">
              Active Brand
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.wordmark || 'No wordmark'})
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-ink/20 rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-all cursor-pointer relative bg-paper/50">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Reference Preview"
                  className="max-h-72 mx-auto rounded-lg shadow-sm border border-ink/10 object-contain"
                />
                <p className="text-xs text-layout-layer font-medium">Click or drag to replace image</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center text-xl">
                  🖼️
                </div>
                <div className="text-sm font-medium text-ink">
                  Drag and drop a poster image, or <span className="text-primary underline">browse</span>
                </div>
                <p className="text-xs text-layout-layer">
                  Supports JPG, PNG, WEBP up to 10MB
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !file}
            className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:opacity-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            {generating ? (
              <span>Deconstructing Poster with Gemini...</span>
            ) : (
              <span>Deconstruct Reference &rarr;</span>
            )}
          </button>
        </div>

        {/* Right: Deconstructed Template & Slot Syntax */}
        <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-tight font-bold text-lg text-ink">2. Deconstruction Output</h2>
            {proposal && (
              <button
                onClick={handleSaveEntry}
                disabled={saving}
                className="px-4 py-1.5 bg-success text-white text-xs font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save as Entry'}
              </button>
            )}
          </div>

          {generating ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-layout-layer font-medium">
                Analyzing composition, typography hierarchy, and lighting...
              </p>
            </div>
          ) : proposal ? (
            <div className="space-y-4">
              {/* Syntax Token Guide */}
              <div className="flex items-center space-x-3 text-xs bg-paper p-2.5 rounded-lg border border-ink/10">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-layer" />
                  <span className="text-brand-layer font-medium">Brand Slot</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <span className="text-accent font-medium">Campaign Slot</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-layout-layer" />
                  <span className="text-layout-layer font-medium">Layout Text</span>
                </span>
              </div>

              {/* Template Display */}
              <div className="p-4 bg-paper rounded-xl border border-ink/15 font-mono text-xs text-ink/90 leading-relaxed whitespace-pre-wrap">
                {proposal.prompt_template}
              </div>

              {/* Slot Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-ink/70">
                  Configured Slots ({proposal.slots.length})
                </h3>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {proposal.slots.map((slot) => (
                    <div
                      key={slot.key}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-paper border border-ink/10 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            slot.brand_field ? 'bg-brand-layer' : slot.never_invent ? 'bg-danger' : 'bg-accent'
                          }`}
                        />
                        <span className="font-mono font-bold text-ink">{slot.key}</span>
                        <span className="text-layout-layer">({slot.type})</span>
                        {slot.never_invent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/10 text-danger font-semibold">
                            Never-Invent
                          </span>
                        )}
                      </div>
                      <span className="text-layout-layer text-[11px] truncate max-w-[180px]">
                        {slot.hint || slot.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-layout-layer text-sm space-y-2">
              <div className="text-2xl">✨</div>
              <p>Upload a poster on the left and click "Deconstruct Reference" to generate your prompt template.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
