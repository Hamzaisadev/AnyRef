import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  Terminal,
  ArrowRight,
  HelpCircle,
  EyeOff,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Eliminating Brand Drift & Hallucination: Never-Invent Architecture | Anyref',
  description:
    'Discover how Anyref eliminates AI hallucinations in marketing campaigns. Programmatic Never-Invent guardrails, human "Needs You" states, and ephemeral RAM security.',
  keywords: [
    'anti hallucination AI marketing',
    'Never-Invent guardrail architecture',
    'prevent brand drift Midjourney',
    'ephemeral in-memory AI processing',
    'confidential client assets generative AI',
    'brand safe image prompts',
  ],
  alternates: {
    canonical: 'https://anyref.app/guides/brand-dna-guardrails',
  },
  openGraph: {
    title: 'Eliminating Brand Drift & Hallucination: Never-Invent Architecture | Anyref',
    description:
      'Learn how programmatic Never-Invent guardrails and ephemeral RAM processing protect brand consistency and commercial compliance.',
    url: 'https://anyref.app/guides/brand-dna-guardrails',
    type: 'article',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Eliminating Brand Drift & Hallucination: The Never-Invent Guardrail Architecture',
  description:
    'Technical deep dive on programmatic Never-Invent guardrails, mandatory "Needs You" human verification states, and ephemeral RAM processing for confidential brand assets.',
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
  datePublished: '2026-10-24',
  dateModified: '2026-10-30',
  mainEntityOfPage: 'https://anyref.app/guides/brand-dna-guardrails',
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
      name: 'Brand DNA & Guardrails',
      item: 'https://anyref.app/guides/brand-dna-guardrails',
    },
  ],
};

export default function BrandDnaGuardrailsGuidePage() {
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
          <span className="text-cyan-300">BRAND GUARDRAILS</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-6 border-b border-white/10 pb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>SAFETY &amp; COMPLIANCE ARCHITECTURE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-tight font-black tracking-tight text-white leading-tight">
            Eliminating Brand Drift &amp; Hallucination: The Never-Invent Architecture
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            How Anyref locks down brand guidelines with automatic slot binding, prevents fake promotional claims with the programmatic "Needs You" state, and protects unreleased client packaging with ephemeral RAM.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
            <span>By Anyref Safety &amp; Engineering Team</span>
            <span>•</span>
            <span>Published Oct 24, 2026</span>
            <span>•</span>
            <span>Updated Oct 30, 2026</span>
            <span>•</span>
            <span className="text-cyan-400">7 min read</span>
          </div>
        </header>

        {/* Primary Extractable Definition Block (First 150 words) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-cyan-400/30 shadow-lg space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
            DEFINITION &amp; PROBLEM STATEMENT
          </span>
          <p className="text-base sm:text-lg text-white leading-relaxed">
            The <strong className="text-cyan-300">Never-Invent Guardrail Architecture</strong> is a deterministic software safeguard that strictly prohibits artificial intelligence models from fabricating promotional variables—such as discount percentages, retail prices, coupon codes, and calendar dates—forcing a human-in-the-loop state called <strong className="text-amber-400">Needs You</strong>.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed font-sans">
            Standard conversational LLMs hallucinate statistical and financial claims with high confidence. In commercial graphic design, an AI-invented "70% OFF" badge printed on an ad campaign invites severe deceptive advertising penalties. Anyref's schema-level validation guarantees that zero promotional claims can be rendered without human verification.
          </p>
        </div>

        {/* Deep Article Content */}
        <article className="space-y-12 text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
          {/* Section 1: The Three Traps of Ad-Hoc Prompting */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight">
              1. The Three Failure Modes of General LLMs in Brand Marketing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-red-500/20 space-y-2">
                <div className="flex items-center space-x-1.5 text-red-400 font-bold text-xs font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>HALLUCINATION</span>
                </div>
                <h3 className="font-tight font-bold text-white text-base">Fictitious Offers</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When analyzing a sale poster, LLMs invent specific discount percentages ("Save 50% Today") even when the reference had none, risking regulatory compliance violations.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-red-500/20 space-y-2">
                <div className="flex items-center space-x-1.5 text-red-400 font-bold text-xs font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>MEMORY DRIFT</span>
                </div>
                <h3 className="font-tight font-bold text-white text-base">Off-Brand Mutations</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  After 3 or 4 iterations in a chat thread, models forget exact hex codes and brand guidelines, replacing custom palettes with generic neon or pastel colors.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-red-500/20 space-y-2">
                <div className="flex items-center space-x-1.5 text-red-400 font-bold text-xs font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>DATA LEAKAGE</span>
                </div>
                <h3 className="font-tight font-bold text-white text-base">Cloud Asset Retention</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Uploading unreleased prototypes or confidential product packaging into generic cloud generators stores image bytes on third-party servers, compromising client NDAs.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Programmatic "Needs You" State */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight flex items-center space-x-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>2. How the Programmatic "Needs You" Guard Works</span>
            </h2>
            <p>
              When a user uploads a reference poster to Anyref Studio, the vision deconstruction pipeline inspects the layout geometry. When it detects a promotional badge or price tag, the slot definition is assigned:
            </p>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-slate-300 space-y-2">
              <div className="text-cyan-300">// Schema Rule Enforced in Domain Engine</div>
              <p className="text-amber-300">
                {`{\n  "key": "discount_badge",\n  "type": "short_text",\n  "never_invent": true,\n  "status": "needs_you",\n  "value": null\n}`}
              </p>
            </div>

            <p>
              The prompt compiler strictly refuses to evaluate the slot or generate an invented string. If the user does not supply a verified promotional value, the enclosing conditional block <code className="text-cyan-400 font-mono">[[?discount_badge: ...]]</code> is completely omitted from the rendered monospace prompt.
            </p>
          </section>

          {/* Section 3: Ephemeral RAM Processing */}
          <section className="space-y-4">
            <h2 className="text-2xl font-tight font-bold text-white tracking-tight flex items-center space-x-2">
              <EyeOff className="w-5 h-5 text-cyan-300" />
              <span>3. Ephemeral In-Memory RAM Processing for Client Security</span>
            </h2>
            <p>
              Professional marketing agencies cannot afford to have embargoed product photos saved on public cloud disks. Anyref implements zero-retention ephemeral processing:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Volatile RAM Streaming</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans mt-0.5">
                    Uploaded product shots stream directly into volatile server RAM to compute aspect ratio geometry and extract visual descriptor tokens.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Zero Disk or Cloud Database Persistence</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans mt-0.5">
                    Images are never written to disk, stored in Supabase storage buckets, or saved in relational database rows.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Zero Model Training Commitments</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans mt-0.5">
                    Image bytes are transmitted over encrypted TLS 1.3 channels to Google Gemini Vision APIs under enterprise terms forbidding training on customer data.
                  </p>
                </div>
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
                  Can an admin or team lead bypass the Never-Invent guardrail?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  No. The Never-Invent policy is enforced in core domain logic (`slot.ts` and `renderPrompt.ts`). AI cannot populate the slot under any condition; values must be provided by a human user or pre-saved in brand defaults.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
                <h3 className="font-tight font-bold text-white text-base">
                  What happens if I leave a "Needs You" slot blank?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  If the slot is wrapped in a conditional block `[[?key: ...]]`, it simply omits the entire promotional phrase from the final prompt. If it is a mandatory slot, Anyref highlights the field in red and pauses compilation until you provide a value.
                </p>
              </div>
            </div>
          </section>
        </article>

        {/* Bottom CTA Box */}
        <div className="p-8 rounded-3xl bg-slate-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-tight font-bold text-xl text-white">
              Safeguard your commercial brand creative
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1">
              Create your brand workspace and generate hallucination-free prompts in Anyref Studio.
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
