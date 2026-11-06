import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  Layers,
  Sparkles,
  ShieldCheck,
  Repeat,
  Terminal,
  Cpu,
  Eye,
  Sliders,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Prompt Engineering Guides & Documentation | Anyref',
  description:
    'Comprehensive architectural documentation and guides on deconstructing Pinterest reference posters into reusable, brand-consistent image prompts for Midjourney v6, FLUX.1, and Ideogram.',
  keywords: [
    'AI poster prompt engineering',
    'Midjourney v6 prompt guide',
    'FLUX.1 prompt tutorial',
    'parametric prompt templates',
    'brand-safe AI prompts',
    'Never-Invent guardrails',
    'ordered asset checklist Midjourney',
    'prompt deconstruction architecture',
  ],
  alternates: {
    canonical: 'https://anyref.app/guides',
  },
  openGraph: {
    title: 'AI Prompt Engineering Guides & Documentation | Anyref',
    description:
      'Learn how to reverse-engineer high-converting poster references into reusable AI prompt templates with zero brand drift.',
    url: 'https://anyref.app/guides',
    type: 'website',
    images: [
      {
        url: '/brand/og/og-guides-hub.svg',
        width: 1200,
        height: 630,
        alt: 'Anyref AI Prompt Engineering Guides & Architecture Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Prompt Engineering Guides & Documentation | Anyref',
    description:
      'Master prompt deconstruction, Never-Invent guardrails, and multi-asset sequencing for Midjourney & FLUX.',
    images: ['/brand/og/og-guides-hub.svg'],
    creator: '@anyrefapp',
  },
};

const guideItems = [
  {
    slug: '/guides/poster-prompts',
    badge: 'Core Architecture',
    title: 'Mastering Visual Poster Prompt Engineering',
    summary:
      'How to deconstruct Pinterest and Behance reference posters into reusable parametric prompt templates with dynamic slot interpolation and layout text isolation.',
    readTime: '8 min read',
    icon: Layers,
    topics: ['Visual Hierarchy', 'Parametric Slots', 'Conditional Syntax', 'Layout Text'],
  },
  {
    slug: '/guides/midjourney-flux-integration',
    badge: 'Multi-Asset Workflow',
    title: 'Midjourney v6.1 & FLUX.1 Multi-Asset Prompt Architecture',
    summary:
      'Master ordered asset upload checklists, --sref styling, --cref character references, and aspect-ratio geometry matching to ensure first-roll accuracy.',
    readTime: '10 min read',
    icon: Sparkles,
    topics: ['Attach Checklist', '--sref & --cref', 'Aspect-Ratio Math', 'Ideogram Typography'],
  },
  {
    slug: '/guides/brand-dna-guardrails',
    badge: 'Enterprise Safety',
    title: 'Eliminating Brand Drift & Hallucination: The Never-Invent Architecture',
    summary:
      'Why general LLMs fail at brand guidelines, how the programmatic "Needs You" state prevents fake discounts, and how ephemeral RAM protects NDA assets.',
    readTime: '7 min read',
    icon: ShieldCheck,
    topics: ['Never-Invent Guard', 'Needs You State', 'Ephemeral RAM', 'Tri-Color Highlighting'],
  },
  {
    slug: '/guides/zero-cost-winner-vault',
    badge: 'ROI & Production Scaling',
    title: 'Scaling Campaign Creatives with the Zero-Cost Winner Vault',
    summary:
      'Build an appreciating internal prompt design system. How to test, grade, lock, and remix winning poster templates for $0.00 in AI API tokens.',
    readTime: '6 min read',
    icon: Repeat,
    topics: ['Winner Grading', 'Template Remixing', 'Zero-Cost Scaling', 'Design Systems'],
  },
];

const glossaryTerms = [
  {
    term: 'Brand',
    definition: 'A distinct business identity with defined visual and verbal guidelines (name, colors, wordmark, logo, slogan, and negative rules).',
  },
  {
    term: 'Entry',
    definition: 'A saved prompt record within a Brand, linking a reference poster to an AI-derived prompt template, configurable slots, and optional result posters.',
  },
  {
    term: 'Reference Poster',
    definition: 'An uploaded marketing poster image used as a visual guide for layout composition, lighting setup, and visual hierarchy.',
  },
  {
    term: 'Result Poster',
    definition: 'An image generated externally in Midjourney, Flux, or Ideogram, pasted back into an Entry for side-by-side visual grading.',
  },
  {
    term: 'Prompt Template',
    definition: 'A structured text string containing placeholder tokens ({{key}}) and conditional blocks ([[?key: ...]]) that produces a generation prompt when rendered.',
  },
  {
    term: 'Slot',
    definition: 'A typed placeholder variable within a Prompt Template that accepts user input, brand defaults, or AI vision autofill values.',
  },
  {
    term: 'Brand Slot',
    definition: 'A Slot whose value is automatically populated from a Brand\'s stored properties (wordmark, primary hex color, slogan).',
  },
  {
    term: 'Campaign Slot',
    definition: 'A Slot specific to a seasonal marketing drop or single poster run (product cutout shot, discount tag, headline).',
  },
  {
    term: 'Layout Text',
    definition: 'Fixed, non-substitutable descriptive text within a Prompt Template specifying camera focal length, angle, lighting, and negative prompts.',
  },
  {
    term: 'Needs You',
    definition: 'A mandatory state applied to sensitive Slots (prices, dates, discounts) that AI is strictly prohibited from inventing and that requires human input.',
  },
  {
    term: 'Never-Invent Slot',
    definition: 'A Slot classified as sensitive where automatic AI values are forbidden by policy and must be supplied explicitly by a verified human.',
  },
  {
    term: 'Attach Checklist',
    definition: 'An ordered upload guide rendered with the final prompt specifying which visual assets to upload to Midjourney or Flux in exact sequence.',
  },
  {
    term: 'Layout-Fit Warning',
    definition: 'A real-time geometry alert triggered when the physical aspect ratio of a product photo conflicts with the intended composition shape.',
  },
  {
    term: 'Slot Highlighting',
    definition: 'Tri-color visual encoding used across the interface: blue for Brand Slots, orange for Campaign Slots, and gray for fixed Layout Text.',
  },
  {
    term: 'Winner',
    definition: 'An Entry status indicating that the prompt template has been tested, approved, and proven to produce production-grade poster outputs ready for zero-cost reuse.',
  },
];

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
      name: 'Guides & Documentation',
      item: 'https://anyref.app/guides',
    },
  ],
};

const collectionPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Anyref AI Prompt Engineering Guides & Documentation',
  description:
    'Comprehensive documentation and in-depth architectural guides on visual poster prompt engineering, brand DNA guardrails, and multi-asset generative AI workflows.',
  url: 'https://anyref.app/guides',
  publisher: {
    '@type': 'Organization',
    name: 'Anyref',
    url: 'https://anyref.app',
  },
};

export default function GuidesIndexPage() {
  return (
    <div className="min-h-screen bg-[#090A10] text-slate-100 antialiased selection:bg-primary selection:text-white">
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(collectionPageSchema)}
      </script>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            HOME
          </Link>
          <span>/</span>
          <span className="text-cyan-300">GUIDES &amp; DOCUMENTATION</span>
        </nav>

        {/* Header & Primary Extractable Definition Block */}
        <header className="space-y-6 border-b border-white/10 pb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>KNOWLEDGE BASE // PROMPT ARCHITECTURE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-tight font-black tracking-tight text-white leading-tight">
            Anyref Documentation &amp; AI Prompt Engineering Guides
          </h1>

          {/* Definition block for Google AI Overviews & Perplexity */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3 text-slate-300">
            <p className="text-base sm:text-lg leading-relaxed">
              <strong className="text-white">The Anyref Documentation Hub</strong> provides technical guides, prompt syntax specifications, and best practices for converting visual reference posters into parametric image-generation prompts. Learn how to eliminate brand drift in Midjourney v6.1 and FLUX.1, enforce Never-Invent anti-hallucination guardrails, and scale creative output with zero AI API token costs.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 pt-1">
              <span>• 4 Comprehensive Guides</span>
              <span>• Complete 15-Term Domain Vocabulary</span>
              <span>• Multi-Engine Compatibility Specs</span>
              <span>• Production Prompt Formulas</span>
            </div>
          </div>
        </header>

        {/* Guides Grid */}
        <section aria-labelledby="guides-grid-heading" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 id="guides-grid-heading" className="text-2xl font-tight font-bold text-white">
                Architectural Guides &amp; Tutorials
              </h2>
              <p className="text-sm text-slate-400">
                In-depth blueprints for visual prompt engineering, compliance, and production scaling.
              </p>
            </div>
            <Link
              href="/library"
              className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-300 hover:text-white transition-colors"
            >
              <span>Explore Curated Vault Templates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guideItems.map((g, idx) => {
              const Icon = g.icon;
              return (
                <Link
                  key={idx}
                  href={g.slug}
                  className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/10 hover:border-primary/50 transition-all duration-300 group flex flex-col justify-between space-y-6 relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wider bg-white/5 border border-white/10 text-cyan-300 uppercase">
                        {g.badge}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{g.readTime}</span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>

                    <h3 className="text-xl font-tight font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {g.title}
                    </h3>

                    <p className="text-sm text-slate-400 leading-relaxed font-sans">
                      {g.summary}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-1.5">
                      {g.topics.map((t, tidx) => (
                        <span
                          key={tidx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-cyan-300 group-hover:translate-x-1 transition-transform">
                      <span>READ FULL GUIDE</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Complete Domain Model & Glossary Section */}
        <section aria-labelledby="glossary-heading" className="space-y-6 pt-8 border-t border-white/10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-cyan-300">
              <Terminal className="w-3.5 h-3.5" />
              <span>Standardized Domain Vocabulary</span>
            </div>
            <h2 id="glossary-heading" className="text-2xl sm:text-3xl font-tight font-bold text-white">
              The Anyref Domain Glossary
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              To prevent miscommunication and ensure exact parameter binding, Anyref adheres to a strict 15-term domain model. Use these definitions when referencing features and architectures.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 overflow-hidden">
            <div className="divide-y divide-white/5">
              {glossaryTerms.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-4 hover:bg-white/[0.02] transition-colors items-start"
                >
                  <div className="md:col-span-4">
                    <span className="font-mono font-bold text-sm text-cyan-300">{item.term}</span>
                  </div>
                  <div className="md:col-span-8">
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                      {item.definition}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Launch CTA Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-linear-to-r from-primary/20 via-slate-900 to-cyan-950/40 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-tight font-bold text-2xl text-white">
              Ready to build your brand-locked prompt library?
            </h3>
            <p className="text-sm text-slate-400 max-w-xl">
              Launch Anyref Studio and deconstruct your first reference poster in under 60 seconds. Free forever for testing.
            </p>
          </div>

          <Link
            href="/workspace/generate"
            className="shrink-0 inline-flex items-center space-x-2 px-7 py-3.5 bg-primary text-white font-mono text-xs font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(75,43,255,0.4)] min-h-[48px]"
          >
            <span>LAUNCH DECONSTRUCTION STUDIO</span>
            <ArrowRight className="w-4 h-4 text-accent" />
          </Link>
        </div>
      </div>
    </div>
  );
}
