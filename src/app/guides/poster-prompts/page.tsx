import Link from 'next/link';
import { ArrowLeft, BookOpen, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'AI Poster Prompt Engineering Guide | Anyref',
  description: 'In-depth architectural guide on deconstructing visual poster references into reusable AI prompt templates.',
};

export default function PosterPromptGuidePage() {
  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-layout-layer hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Anyref Studio</span>
        </Link>

        <header className="space-y-3 border-b border-border-subtle pb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Design Studio Architecture & Best Practices</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-tight tracking-tight text-ink">
            Mastering Visual Poster Prompt Engineering
          </h1>
          <p className="text-base text-layout-layer max-w-2xl leading-relaxed">
            How to reverse-engineer high-converting poster layouts into reusable parametric prompt templates with dynamic slot interpolation.
          </p>
        </header>

        <article className="space-y-8 text-ink text-sm sm:text-base leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-tight">1. The Core Anatomy of a Poster Template</h2>
            <p className="text-layout-layer">
              Generative image models like Midjourney, Flux, and Stable Diffusion often hallucinate composition when given unstructured natural language prompts. Professional prompt engineering requires separating a graphic design into distinct layout parameters:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-layout-layer">
              <li>
                <strong className="text-ink">Visual Hierarchy & Anchor:</strong> The dominant hero subject, focal placement, and camera perspective.
              </li>
              <li>
                <strong className="text-ink">Typography & Text Blocks:</strong> Headlines, sub-headlines, brand wordmarks, and callout badges.
              </li>
              <li>
                <strong className="text-ink">Color Grading & Palette:</strong> Dominant primary hues, contrasting accents, and background atmospheric tint.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-tight">2. Parametric Slot Extraction</h2>
            <p className="text-layout-layer">
              Instead of hardcoding a prompt for one specific product, Anyref converts dynamic text fields into variable slots:
            </p>
            <div className="p-4 rounded-2xl bg-surface border border-border-subtle font-mono text-xs text-primary space-y-1">
              <code>A high-impact promotional poster featuring &#123;&#123;product_name&#125;&#125; in the center, rendered in vibrant &#123;&#123;brand_color&#125;&#125; tones, with bold Swiss-style typography displaying &quot;&#123;&#123;headline&#125;&#125;&quot;.</code>
            </div>
            <p className="text-layout-layer">
              This structure enables automated batch autofill across seasonal marketing campaigns without degrading visual layout fidelity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-tight">3. Enforcing Brand Guardrails</h2>
            <p className="text-layout-layer">
              Brand consistency is safeguarded by strict negative constraints:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-1">
                <span className="text-xs font-bold text-success uppercase tracking-wider block">Recommended</span>
                <p className="text-xs text-layout-layer">
                  Specify hex color values, exact font categories (grotesque sans-serif, geometric serif), and clean studio lighting.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-1">
                <span className="text-xs font-bold text-danger uppercase tracking-wider block">Avoid</span>
                <p className="text-xs text-layout-layer">
                  Vague aesthetic buzzwords like &quot;photorealistic 8k&quot; or contradictory composition instructions.
                </p>
              </div>
            </div>
          </section>
        </article>

        <div className="p-6 rounded-2xl bg-surface border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-tight font-bold text-lg text-ink">Ready to deconstruct a poster?</h3>
            <p className="text-xs text-layout-layer">
              Upload your reference into Anyref Studio and generate a production-ready template in seconds.
            </p>
          </div>
          <Link
            href="/workspace/generate"
            className="px-5 py-2.5 bg-primary text-primary-fg text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-xs"
          >
            Launch Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
