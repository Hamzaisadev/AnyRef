import { 
  Sparkles, 
  ShieldCheck, 
  Repeat, 
  Sliders, 
  Eye, 
  Lock, 
  CheckSquare, 
  Wand2, 
  Share2, 
  Maximize2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function FeaturesSection() {
  const coreFeatures = [
    {
      icon: Eye,
      tag: 'Vision Deconstruction',
      title: 'Reference Poster Deconstruction',
      whatItDoes:
        'Vision AI deconstructs any reference poster into its foundational lighting, camera focal length, visual hierarchy, and composition geometry.',
      whichMeans:
        'You capture the structural genius of award-winning marketing posters in seconds without copying pixels or infringing copyright.',
      highlight: 'Pinterest & Behance Ready',
    },
    {
      icon: Sparkles,
      tag: 'Brand Enforcement',
      title: 'Brand DNA Injection',
      whatItDoes:
        'Your stored brand assets—wordmark, exact hex codes, slogans, tone guidelines, and negative prompt rules—automatically bind to Brand Slots.',
      whichMeans:
        'Zero brand drift. Every single generated poster honors your corporate visual identity across every designer on your team.',
      highlight: '100% Brand Consistency',
    },
    {
      icon: Sliders,
      tag: 'Modular Syntax',
      title: 'Tri-Color Slot Architecture',
      whatItDoes:
        'Color-codes prompt tokens into Blue (Brand), Orange (Campaign), and Gray (Layout), with full support for conditional blocks [[?key: ...]].',
      whichMeans:
        'You can audit, tune, and remix 300-word prompts in 5 seconds flat with zero syntax confusion.',
      highlight: 'Blue • Orange • Gray',
    },
    {
      icon: ShieldCheck,
      tag: 'Programmatic Safety',
      title: 'Never-Invent Guardrails & "Needs You"',
      whatItDoes:
        'A hard programmatic rule strictly forbids AI from inventing prices, percentage discounts, promo codes, or calendar dates.',
      whichMeans:
        'Zero risk of launching an ad with hallucinated discounts or facing deceptive marketing compliance liabilities.',
      highlight: 'Zero AI Hallucination',
    },
    {
      icon: Maximize2,
      tag: 'Composition Fit',
      title: 'Autofill Studio & Layout-Fit Warnings',
      whatItDoes:
        'Drop a raw product photo; vision AI extracts campaign slots and triggers instant warnings if the photo aspect ratio clashes with the poster layout.',
      whichMeans:
        'You stop burning GPU credits trying to force vertical beverage bottles into horizontal 16:9 banner layouts.',
      highlight: 'Real-time Geometry Guard',
    },
    {
      icon: Lock,
      tag: 'Confidential Privacy',
      title: 'Ephemeral In-Memory Processing',
      whatItDoes:
        'Uploaded product photos are analyzed purely in volatile memory (RAM) and never saved to cloud storage buckets or database tables.',
      whichMeans:
        'Unreleased client packaging, secret prototypes, and NDA-protected campaigns remain strictly confidential.',
      highlight: '100% Ephemeral RAM',
    },
    {
      icon: CheckSquare,
      tag: 'Multi-Image Prompting',
      title: 'Attach in Flow & Ordered Asset Checklist',
      whatItDoes:
        'Generates pure monospace prompts paired with an ordered checklist (Asset 1: Product cutout, Asset 2: Brand wordmark) tuned for Midjourney and Flux.',
      whichMeans:
        'Multi-image prompting hits on the very first roll because assets are structured in the exact sequence models expect.',
      highlight: 'First-Roll Accuracy',
    },
    {
      icon: Repeat,
      tag: 'Compounding ROI',
      title: 'Winner Vault & Zero-Cost Unlimited Remix',
      whatItDoes:
        'Grade external result posters side-by-side with references. Stamped "Winners" are stored as modular templates ready for instant remixing.',
      whichMeans:
        'You build an appreciating company library of guaranteed hit posters that cost $0.00 in AI API fees to reuse forever.',
      highlight: '$0.00 Re-Prompting Cost',
    },
    {
      icon: Wand2,
      tag: 'Rapid Onboarding',
      title: '"Describe It" AI Brand Studio',
      whatItDoes:
        'Type 2 plain-text sentences about your company; AI drafts your complete Brand specification with source audit badges (You said / Inferred / Needs you).',
      whichMeans:
        'You are up and running in 45 seconds without filling out tedious 20-field brand configuration forms.',
      highlight: 'Instant Setup in 45s',
    },
    {
      icon: Share2,
      tag: 'No Vendor Lock-in',
      title: 'Multi-Engine Freedom',
      whatItDoes:
        'Outputs clean, universal prompts compiled specifically for Midjourney v6, FLUX.1 (Schnell, Dev, Pro), Ideogram v2, and Recraft.',
      whichMeans:
        'You generate where visual quality is highest instead of being trapped in low-quality proprietary walled gardens.',
      highlight: 'Universal Compatibility',
    },
  ];

  return (
    <section 
      id="features" 
      aria-labelledby="features-heading" 
      className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full"
    >
      {/* Header (PAS: Solve) */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-cyan-950/60 text-cyan-300 border border-cyan-400/30">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>The Solution: Structured Poster Engineering</span>
        </div>

        <h2 
          id="features-heading" 
          className="font-tight font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight"
        >
          Every feature engineered for one goal:{' '}
          <span className="text-primary-fg block sm:inline">
            total brand control with zero prompt drift.
          </span>
        </h2>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          Stop guessing in Discord. AnyRef gives you a deterministic, modular studio to deconstruct reference posters, lock in brand guidelines, and generate production-grade prompts.
        </p>
      </div>

      {/* 10 Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {coreFeatures.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div 
              key={i} 
              className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/80 shadow-xl hover:border-cyan-400/40 hover:shadow-2xl transition-all flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-cyan-300 flex items-center justify-center group-hover:scale-105 group-hover:border-cyan-400/30 transition-all">
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-400 text-xs font-mono font-medium border border-white/10">
                    {feat.highlight}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    {feat.tag}
                  </span>
                  <h3 className="font-tight font-bold text-xl sm:text-2xl text-white">
                    {feat.title}
                  </h3>
                </div>

                <div className="space-y-3 pt-1">
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    {feat.whatItDoes}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide block mb-1">
                      Which means for you:
                    </span>
                    <p className="text-slate-200 text-sm font-medium leading-relaxed">
                      {feat.whichMeans}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Production Feature</span>
                <span className="text-cyan-400 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                  Active in AnyRef
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mid-Page Conversion Hook */}
      <div className="mt-16 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-primary/20 via-slate-950 to-cyan-950/30 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="font-tight font-bold text-2xl text-white">
            Ready to turn your Pinterest boards into reusable brand engines?
          </h3>
          <p className="text-slate-400 text-sm sm:text-base">
            Deconstruct your first reference poster in under 60 seconds. Free forever for testing.
          </p>
        </div>

        <Link
          href="/workspace/generate"
          className="shrink-0 inline-flex items-center space-x-2 px-7 py-3.5 bg-primary text-white font-mono text-xs font-bold tracking-wider rounded-2xl hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(75,43,255,0.4)] active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[48px]"
        >
          <span>DECONSTRUCT A POSTER NOW</span>
          <ArrowRight className="w-4 h-4 text-accent" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
