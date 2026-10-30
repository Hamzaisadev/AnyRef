import { CheckCircle2, XCircle } from 'lucide-react';

export default function ComparisonSection() {
  const comparisonItems = [
    {
      dimension: 'Compositional Fidelity',
      adhoc: 'Prompts shift wildly on every reroll; camera angle and lighting cannot be locked.',
      anyref: 'Deterministic Layout Text locks camera focal length, framing, and key lighting.',
    },
    {
      dimension: 'Brand Guideline Enforcement',
      adhoc: 'Zero memory. Random neon hex colors and generic off-brand fonts generated each time.',
      anyref: 'Wordmarks, exact hex palettes, slogans, and negative rules auto-injected into Brand Slots.',
    },
    {
      dimension: 'Pricing & Promotional Claims',
      adhoc: 'AI hallucinates fake "80% OFF" badges and bogus claims that fail legal compliance.',
      anyref: 'Programmatic Never-Invent Guardrail enforces "Needs You" state on all prices and dates.',
    },
    {
      dimension: 'Aspect Ratio & Geometry Clashes',
      adhoc: 'No warning when a vertical product photo is fed into a 16:9 banner prompt, causing distortion.',
      anyref: 'Real-time Layout-Fit Warnings alert you to geometry clashes before you burn GPU hours.',
    },
    {
      dimension: 'Multi-Image Generation in Midjourney',
      adhoc: 'Random copy-pasting of image links with inconsistent weighting and messy misattribution.',
      anyref: 'Ordered Attach in Flow checklist (Asset 1: Product, Asset 2: Logo) tuned for Midjourney v6.',
    },
    {
      dimension: 'Reusing a Winning Poster Concept',
      adhoc: 'Starting from scratch every campaign because prompt variables are tangled in messy notes.',
      anyref: 'Approved Winner Vault enables infinite remixing with new products for $0.00 in AI tokens.',
    },
    {
      dimension: 'Confidential Client Assets',
      adhoc: 'Images uploaded to third-party tools that store and train on unreleased client photos.',
      anyref: 'Ephemeral in-memory processing in RAM. Photos are never stored or logged on disk.',
    },
    {
      dimension: 'Vendor Lock-in & Generation Cost',
      adhoc: 'Trapped in expensive proprietary platforms charging hefty markups on basic image credits.',
      anyref: 'Universal prompt compiler for your existing Midjourney, Flux, Ideogram, and Recraft tools.',
    },
  ];

  return (
    <section 
      id="comparison" 
      aria-labelledby="comparison-heading" 
      className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full"
    >
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-amber-950/60 text-amber-300 border border-amber-400/30">
          <span>The Definitive Difference</span>
        </div>

        <h2 
          id="comparison-heading" 
          className="font-tight font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight"
        >
          Ad-Hoc Prompting vs.{' '}
          <span className="text-cyan-300">AnyRef Structured Engine</span>
        </h2>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          See why professional marketing teams and design studios replace messy text documents with a dedicated prompt architecture.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/10 bg-black/60 p-4 sm:p-6 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
          <div className="md:col-span-4 text-slate-400 mb-2 md:mb-0">Capability &amp; Guardrail</div>
          <div className="md:col-span-4 text-rose-400 mb-2 md:mb-0 flex items-center space-x-1.5">
            <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Ad-Hoc Discord / ChatGPT</span>
          </div>
          <div className="md:col-span-4 text-emerald-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>AnyRef Structured Studio</span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {comparisonItems.map((item, index) => (
            <div 
              key={index} 
              className="grid grid-cols-1 md:grid-cols-12 p-4 sm:p-6 gap-3 sm:gap-4 hover:bg-white/[0.02] transition-colors items-center"
            >
              <div className="md:col-span-4">
                <span className="font-tight font-bold text-sm sm:text-base text-white block">
                  {item.dimension}
                </span>
              </div>
              <div className="md:col-span-4 p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-xs sm:text-sm text-slate-400 leading-relaxed flex items-start space-x-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item.adhoc}</span>
              </div>
              <div className="md:col-span-4 p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs sm:text-sm text-slate-200 font-medium leading-relaxed flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item.anyref}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
