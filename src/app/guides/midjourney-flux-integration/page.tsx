import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Layers,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Maximize2,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Midjourney v6.1 & FLUX.1 Multi-Asset Prompt Guide | Anyref',
  description:
    'Master multi-image prompting in Midjourney v6.1 and FLUX.1. Learn ordered asset upload sequencing, --sref styling, --cref consistency, and layout aspect-ratio math.',
  keywords: [
    'Midjourney v6.1 multi asset prompt',
    'FLUX.1 commercial poster prompt',
    'Midjourney sref styling guide',
    'Ideogram v2 typography prompts',
    'ordered asset checklist AI generation',
    'aspect ratio math AI posters',
  ],
  alternates: {
    canonical: 'https://anyref.app/guides/midjourney-flux-integration',
  },
  openGraph: {
    title: 'Midjourney v6.1 & FLUX.1 Multi-Asset Prompt Guide | Anyref',
    description:
      'Learn how to sequence multi-image uploads and apply style references for first-roll poster generation in Midjourney and FLUX.',
    url: 'https://anyref.app/guides/midjourney-flux-integration',
    type: 'article',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Midjourney v6.1 & FLUX.1 Multi-Asset Prompt Architecture: Ordered Checklists and Style References',
  description:
    'Comprehensive technical guide on multi-image asset sequencing, --sref styling, and aspect-ratio geometry protection in Midjourney v6.1 and FLUX.1 commercial workflows.',
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
  datePublished: '2026-10-22',
  dateModified: '2026-10-30',
  mainEntityOfPage: 'https://anyref.app/guides/midjourney-flux-integration',
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
      name: 'Midjourney & FLUX Integration',
      item: 'https://anyref.app/guides/midjourney-flux-integration',
    },
  ],
};

export default function MidjourneyFluxGuidePage() {
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
          <span className="text-cyan-300">MIDJOURNEY &amp; FLUX</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-6 border-b border-white/10 pb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>EXTERNAL GENERATION ARCHITECTURE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-tight font-black tracking-tight text-white leading-tight">
            Midjourney v6.1 &amp; FLUX.1 Multi-Asset Prompt Architecture
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            How to sequence multi-image uploads, lock style weights with <code className="text-cyan-400 font-mono">--sref</code>, and eliminate aspect-ratio distortion for first-roll poster generation.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
            <span>By Anyref Visual Research Team</span>
            <span>•</span>
            <span>Published Oct 22, 2026</span>
            <span>•</span>
            <span>Updated Oct 30, 2026</span>
            <span>•</span>
            <span className="text-cyan-400">10 min read</span>
          </div>
        </header>

        {/* Primary Extractable Definition Block (First 150 words) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-cyan-400/30 shadow-lg space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
            DEFINITION &amp; ARCHITECTURAL PRINCIPLE
          </span>
          <p className="text-base sm:text-lg text-white leading-relaxed">
            <strong className="text-cyan-300">Multi-asset prompt architecture</strong> is the structured method of compiling a natural-language prompt alongside an ordered sequence of input image files (product cutouts, brand wordmarks, and texture references) so that external image models like Midjourney v6.1 and FLUX.1 assign weights to the correct image tokens without cross-contamination.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed font-sans">
            When users upload images haphazardly into Discord or Web interfaces, generative attention mechanisms frequently confuse a brand logo with the hero product. Anyref generates an **Ordered Attach Checklist** that specifies the exact sequence required for multi-modal alignment.
          </p>
        </div>

        {/* Deep Article Content */}
        <article className="space-y-12 text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
          {/* Section 1: The Ordered Attach in Flow Sequence */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight">
              1. The Ordered Attach in Flow Checklist
            </h2>
            <p>
              In Midjourney v6.1 and FLUX multi-modal workflows, image links placed at the beginning of a prompt receive positional priority in cross-attention matrices. Anyref enforces a standardized 3-slot upload sequence:
            </p>

            <div className="space-y-3 font-mono text-xs pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-lg bg-primary/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div className="space-y-1">
                  <h3 className="text-white font-bold font-sans text-sm">Asset 1: Product Cutout (Transparent PNG)</h3>
                  <p className="text-slate-400 font-sans text-xs leading-relaxed">
                    Always uploaded first. Represents the physical hero subject. Midjourney isolates the silhouette before processing surrounding background environment descriptions.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-lg bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div className="space-y-1">
                  <h3 className="text-white font-bold font-sans text-sm">Asset 2: Brand Wordmark (Vector SVG / High-Res PNG)</h3>
                  <p className="text-slate-400 font-sans text-xs leading-relaxed">
                    Uploaded second. Referenced via character weight or typography alignment to ensure clean lettering without letter mutation.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div className="space-y-1">
                  <h3 className="text-white font-bold font-sans text-sm">Asset 3: Reference Poster Composition (Optional --sref)</h3>
                  <p className="text-slate-400 font-sans text-xs leading-relaxed">
                    Supplied as a style reference URL via <code className="text-cyan-400 font-mono">--sref [URL]</code> with a controlled weight of <code className="text-cyan-400 font-mono">--sw 100</code> to capture color harmony without copying pixels.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Engine Comparison Matrix */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight">
              2. Generation Engine Comparison: Midjourney vs. FLUX vs. Ideogram
            </h2>
            <p>
              Different AI engines excel at different aspects of commercial poster design. Choose the right engine for your specific campaign requirements:
            </p>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono uppercase text-[11px]">
                    <th className="p-4">Engine</th>
                    <th className="p-4">Best For</th>
                    <th className="p-4">Prompt Syntax Nuance</th>
                    <th className="p-4">Key Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-4 font-bold text-white">Midjourney v6.1</td>
                    <td className="p-4 text-slate-300">Photorealistic studio lighting &amp; textures</td>
                    <td className="p-4 text-slate-400">Prefers concise comma-separated stylistic descriptors</td>
                    <td className="p-4 font-mono text-cyan-300">--ar 4:5 --style raw --v 6.1</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">FLUX.1 [Dev / Schnell]</td>
                    <td className="p-4 text-slate-300">Complex prompt adherence &amp; anatomical hands</td>
                    <td className="p-4 text-slate-400">Excels at long-form natural language paragraph prompts</td>
                    <td className="p-4 font-mono text-cyan-300">Guidance: 3.5, Steps: 28</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Ideogram v2</td>
                    <td className="p-4 text-slate-300">Crisp Swiss typography &amp; text in graphics</td>
                    <td className="p-4 text-slate-400">Put text in quotes: typography reads "HEADLINE"</td>
                    <td className="p-4 font-mono text-cyan-300">Style: Design / Poster</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Recraft v3</td>
                    <td className="p-4 text-slate-300">Exact hex palette matching &amp; vector art</td>
                    <td className="p-4 text-slate-400">Accepts explicit RGB/hex palette arrays</td>
                    <td className="p-4 font-mono text-cyan-300">palette: [#4B2BFF, #FF8A3D]</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Aspect Ratio Math & Layout-Fit Protection */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight flex items-center space-x-2">
              <Maximize2 className="w-5 h-5 text-cyan-300" />
              <span>3. Aspect Ratio Math &amp; The Layout-Fit Warning</span>
            </h2>
            <p>
              One of the costliest mistakes in AI poster generation is aspect-ratio geometry mismatch. When a user feeds a tall vertical product photo (e.g. 9:16 wine bottle) into a horizontal 16:9 banner prompt, generative diffusion models warp the product or crop the brand mark.
            </p>

            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                The Anyref Geometry Guard
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                During Autofill analysis in volatile RAM, Anyref measures the bounding-box aspect ratio of the uploaded product shot against the intended reference poster layout. If a conflict exceeds 25% tolerance (e.g. uploading a square 1:1 jar into a 4:5 hero tall slot), a real-time **Layout-Fit Warning** is triggered before generation begins, preventing wasted GPU credits.
              </p>
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
                  What is the difference between --sref and --cref in Midjourney?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  <code className="text-cyan-300 font-mono">--sref</code> (Style Reference) transfers the color palette, artistic aesthetic, and lighting tone of an image. <code className="text-cyan-300 font-mono">--cref</code> (Character Reference) attempts to preserve identical facial and physical geometry of a subject. For commercial posters, <code className="text-cyan-300 font-mono">--sref</code> is predominantly used.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
                <h3 className="font-tight font-bold text-white text-base">
                  Why not use in-app rendering instead of external Midjourney or Flux?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  In-app generators lock teams into inferior models with 3x-5x markups on API tokens. Midjourney v6.1 and FLUX.1 represent the state of the art in commercial visual fidelity. Anyref gives you the perfect prompt compiler for the tools you already use.
                </p>
              </div>
            </div>
          </section>
        </article>

        {/* Bottom CTA Box */}
        <div className="p-8 rounded-3xl bg-slate-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-tight font-bold text-xl text-white">
              Ready to generate your next commercial campaign?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1">
              Deconstruct your reference poster into an ordered multi-asset prompt in Anyref Studio.
            </p>
          </div>
          <Link
            href="/workspace/generate"
            className="shrink-0 px-6 py-3.5 bg-primary text-white font-mono text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(75,43,255,0.4)] min-h-[48px] flex items-center space-x-2"
          >
            <span>LAUNCH ANYREF STUDIO</span>
            <ArrowRight className="w-4 h-4 text-accent" />
          </Link>
        </div>
      </div>
    </div>
  );
}
