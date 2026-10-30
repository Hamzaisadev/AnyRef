import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Copy,
  ArrowRight,
  HelpCircle,
  FileCode,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Poster Prompt Engineering Guide | Deconstruct References | Anyref',
  description:
    'Master visual poster prompt engineering. Deconstruct marketing poster layouts into reusable parametric prompt templates for Midjourney v6 and FLUX.1 with dynamic slots.',
  keywords: [
    'AI poster prompt engineering',
    'reverse engineer poster to prompt',
    'Midjourney poster prompt template',
    'parametric AI prompt design',
    'Pinterest reference to Midjourney',
    'FLUX commercial poster prompt',
  ],
  alternates: {
    canonical: 'https://anyref.app/guides/poster-prompts',
  },
  openGraph: {
    title: 'AI Poster Prompt Engineering Guide | Deconstruct References | Anyref',
    description:
      'Learn how to reverse-engineer high-converting poster layouts into reusable parametric prompt templates with dynamic slot interpolation.',
    url: 'https://anyref.app/guides/poster-prompts',
    type: 'article',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Mastering Visual Poster Prompt Engineering: Reverse-Engineering References into Parametric Templates',
  description:
    'In-depth architectural guide on deconstructing visual poster references from Pinterest and Behance into reusable parametric AI prompt templates with dynamic slot interpolation.',
  author: {
    '@type': 'Organization',
    name: 'Anyref Engineering & Visual Research Team',
    url: 'https://anyref.app',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Anyref',
    logo: {
      '@type': 'ImageObject',
      url: 'https://anyref.app/brand/logo.svg',
    },
  },
  datePublished: '2026-10-20',
  dateModified: '2026-10-30',
  mainEntityOfPage: 'https://anyref.app/guides/poster-prompts',
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://anyref.app',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Guides',
      item: 'https://anyref.app/guides',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Visual Poster Prompt Engineering',
      item: 'https://anyref.app/guides/poster-prompts',
    },
  ],
};

export default function PosterPromptGuidePage() {
  return (
    <div className="min-h-screen bg-[#090A10] text-slate-100 antialiased selection:bg-primary selection:text-white">
      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            HOME
          </Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-white transition-colors">
            GUIDES
          </Link>
          <span>/</span>
          <span className="text-cyan-300">POSTER PROMPTS</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-6 border-b border-white/10 pb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ARCHITECTURAL GUIDE // REUSABLE TEMPLATES</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-tight font-black tracking-tight text-white leading-tight">
            Mastering Visual Poster Prompt Engineering
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            How to reverse-engineer high-converting poster layouts into reusable parametric prompt templates with dynamic slot interpolation and layout text isolation.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
            <span>By Anyref Visual Research Team</span>
            <span>•</span>
            <span>Published Oct 20, 2026</span>
            <span>•</span>
            <span>Updated Oct 30, 2026</span>
            <span>•</span>
            <span className="text-cyan-400">8 min read</span>
          </div>
        </header>

        {/* Primary Extractable Definition Block (First 150 words) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-cyan-400/30 shadow-lg space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
            DEFINITION &amp; CORE CONCEPT
          </span>
          <p className="text-base sm:text-lg text-white leading-relaxed">
            <strong className="text-cyan-300">Visual poster prompt engineering</strong> is the methodical practice of deconstructing a graphic design reference poster into isolated compositional parameters—framing perspective, lighting temperature, typographic hierarchy, and negative constraints—and encoding them into a parametric template containing typed slot variables.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed font-sans">
            Instead of typing raw, one-off text prompts that morph unpredictably on every reroll, visual prompt engineering produces deterministic formulas that allow brands to swap product cutouts and seasonal headlines while maintaining exact visual consistency.
          </p>
        </div>

        {/* Deep Article Content */}
        <article className="space-y-12 text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
          {/* Section 1: The 3 Layout Layers */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight flex items-center space-x-2">
              <span>1. The Three Layers of a Poster Template</span>
            </h2>
            <p>
              Generative image models like Midjourney v6.1, FLUX.1, and Stable Diffusion often hallucinate composition when given unstructured natural language prompts. Professional prompt engineering requires separating a graphic design into three distinct layers:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase block">
                  Layer 1: Gray
                </span>
                <h3 className="font-tight font-bold text-white text-base">Layout Text</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fixed descriptive text defining camera focal length (e.g. 85mm macro), lighting setup (e.g. 5600K amber top-down softbox), framing grid, and negative prompts.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <span className="text-xs font-mono font-bold text-primary uppercase block">
                  Layer 2: Blue
                </span>
                <h3 className="font-tight font-bold text-white text-base">Brand Slots</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Variables automatically bound to stored brand properties, including wordmarks, exact hex color codes, typography hierarchy, and corporate negative constraints.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase block">
                  Layer 3: Orange
                </span>
                <h3 className="font-tight font-bold text-white text-base">Campaign Slots</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transient variables specific to a single product run, such as the product cutout description, seasonal promotional badge, and campaign headline.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Syntax Specification */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight">
              2. Parametric Slot Syntax: Interpolation &amp; Conditional Blocks
            </h2>
            <p>
              To maintain grammatical cleanlines across variable prompts, Anyref implements a dual-token syntax:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-white/5">
                  <span className="text-cyan-300">STANDARD VARIABLE INTERPOLATION</span>
                  <span>&#123;&#123;key&#125;&#125;</span>
                </div>
                <p className="text-slate-300 font-sans text-xs">
                  Substitutes the slot value directly into the compiled prompt.
                </p>
                <code className="text-primary block pt-1">
                  Featuring &#123;&#123;product_name&#125;&#125; centered in the frame adhering to palette of &#123;&#123;brand_color&#125;&#125;.
                </code>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-white/5">
                  <span className="text-amber-300">CONDITIONAL BLOCK RENDERING</span>
                  <span>[[?key: ...]]</span>
                </div>
                <p className="text-slate-300 font-sans text-xs">
                  Renders the enclosed text ONLY if the slot is populated. If empty, the entire block is cleanly stripped without orphaned commas.
                </p>
                <code className="text-amber-400 block pt-1">
                  [[?discount_badge: Subhead discount callout badge: &quot;&#123;&#123;discount_badge&#125;&#125;&quot;.]]
                </code>
              </div>
            </div>
          </section>

          {/* Section 3: Head-to-Head Comparison Table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight">
              3. Natural Language Prompts vs. Parametric Templates
            </h2>
            <p>
              Why professional marketing teams abandon unstructured Discord prompting in favor of a structured visual prompt engine:
            </p>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono uppercase text-[11px]">
                    <th className="p-4">Dimension</th>
                    <th className="p-4 text-red-400">Ad-Hoc Natural Language</th>
                    <th className="p-4 text-cyan-300">Anyref Parametric Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-4 font-bold text-white">Composition Stability</td>
                    <td className="p-4 text-slate-400">Shifts on every reroll; focal angle mutates randomly.</td>
                    <td className="p-4 text-cyan-200">Locked via deterministic Layout Text.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Brand Guideline Enforcement</td>
                    <td className="p-4 text-slate-400">AI hallucinates off-brand colors and mismatched fonts.</td>
                    <td className="p-4 text-cyan-200">Auto-bound from stored Brand Slots with zero drift.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Promotional Compliance</td>
                    <td className="p-4 text-slate-400">Invented fake discount badges like "80% OFF".</td>
                    <td className="p-4 text-cyan-200">Never-Invent guard enforces human "Needs You" state.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Campaign Reusability</td>
                    <td className="p-4 text-slate-400">Must start from scratch for every seasonal drop.</td>
                    <td className="p-4 text-cyan-200">Swap product cutout in 1 click for $0.00 token cost.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Production Prompt Formula */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight">
              4. Step-by-Step Walkthrough: Building a Production Poster Formula
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-1">
                <span className="text-xs font-mono font-bold text-cyan-300">Step 1: Isolate Composition &amp; Lighting</span>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Analyze the reference poster. Identify whether the layout uses a golden-ratio spiral or Swiss grid. Lock the lighting (e.g. "diffused studio softbox, 45-degree rim light").
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-1">
                <span className="text-xs font-mono font-bold text-cyan-300">Step 2: Assign Brand Variables</span>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Replace hardcoded company names and colors with <code className="text-cyan-400">&#123;&#123;brand_wordmark&#125;&#125;</code> and <code className="text-cyan-400">&#123;&#123;palette_primary&#125;&#125;</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-1">
                <span className="text-xs font-mono font-bold text-cyan-300">Step 3: Guard Promotional Slots</span>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Flag price tags and launch dates with <code className="text-amber-400">never_invent: true</code> to ensure AI cannot hallucinate bogus claims.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-1">
                <span className="text-xs font-mono font-bold text-cyan-300">Step 4: Attach Engine Parameters</span>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Append Midjourney flags (<code className="text-primary font-mono">--ar 4:5 --style raw --v 6.1</code>) and generate the ordered multi-asset upload checklist.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Real-World Formula Example */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight">
              5. Production Template Example: Artisan FMCG Poster
            </h2>
            <div className="p-5 rounded-2xl bg-black/60 border border-cyan-400/30 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
                <span className="text-cyan-300 font-bold">COMPILED PROMPT TEMPLATE</span>
                <span className="text-emerald-400">VALIDATED FOR MIDJOURNEY V6.1</span>
              </div>
              <p className="text-slate-300 leading-relaxed break-words">
                Minimalist studio product poster, 4:5 aspect ratio, centered hero placement on elevated stone pedestal. Warm 45-degree directional morning sun casting crisp linear architectural shadows. Eye-level macro framing, shallow depth of field. Featuring <span className="text-amber-300 font-bold">&#123;&#123;product_name&#125;&#125;</span>. Brand wordmark &quot;<span className="text-primary font-bold">&#123;&#123;brand_wordmark&#125;&#125;</span>&quot;, adhering strictly to palette <span className="text-primary font-bold">&#123;&#123;brand_palette&#125;&#125;</span>. Typography headline reads: &quot;<span className="text-amber-300 font-bold">&#123;&#123;headline&#125;&#125;</span>&quot;. [[?discount_badge: Subhead discount tag: <span className="text-red-400 font-bold">&#123;&#123;discount_badge&#125;&#125;</span>.]] Rules: clean editorial layout, no neon, matte paper texture. --ar 4:5 --style raw --v 6.1
              </p>
              <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400">
                <span>Ordered Upload Checklist: Asset 1: Transparent bottle cutout • Asset 2: Vector logo SVG</span>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-cyan-300" />
              <span>Frequently Asked Questions</span>
            </h2>

            <div className="space-y-3">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
                <h3 className="font-tight font-bold text-white text-base">
                  Can I use Anyref templates with FLUX.1 and Ideogram?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  Yes. Anyref templates output clean, standard text prompts that can be pasted directly into FLUX.1 [Schnell/Dev], Ideogram v2, Recraft v3, or Midjourney v6.1.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
                <h3 className="font-tight font-bold text-white text-base">
                  Why does Anyref forbid AI from inventing discount percentages?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  Generative models frequently hallucinate promotional claims. Launching an ad with a fake discount violates commercial advertising laws. The Never-Invent guard forces human verification.
                </p>
              </div>
            </div>
          </section>
        </article>

        {/* Bottom CTA Box */}
        <div className="p-8 rounded-3xl bg-slate-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-tight font-bold text-xl text-white">
              Deconstruct your first poster reference
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1">
              Upload your reference into Anyref Studio and generate a production-ready template in under 60 seconds.
            </p>
          </div>
          <Link
            href="/workspace/generate"
            className="shrink-0 px-6 py-3.5 bg-primary text-white font-mono text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(75,43,255,0.4)] min-h-[48px] flex items-center space-x-2"
          >
            <span>LAUNCH DECONSTRUCTION STUDIO</span>
            <ArrowRight className="w-4 h-4 text-accent" />
          </Link>
        </div>
      </div>
    </div>
  );
}
