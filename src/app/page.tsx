import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Repeat, Cpu, ExternalLink } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 text-center">
      <div className="max-w-4xl space-y-8 sm:space-y-12">
        {/* Brand Header */}
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xs">
            <svg
              className="w-7 h-7 text-primary"
              viewBox="0 0 64 64"
              fill="none"
              role="img"
              aria-label="Anyref logo"
            >
              <rect x="6" y="6" width="52" height="52" rx="12" stroke="currentColor" strokeWidth="4" />
              <path
                d="M24 20h-6v24h6M40 20h6v24h-6"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="32" r="4" fill="#FF8A3D" />
            </svg>
          </div>
          <span className="font-tight font-bold text-3xl sm:text-4xl tracking-tight text-ink">
            anyref
          </span>
        </div>

        {/* Hero Copy */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 text-xs font-semibold tracking-wide text-brand-layer bg-brand-layer/10 rounded-full border border-brand-layer/20 uppercase">
            <Cpu className="w-3.5 h-3.5" />
            <span>Structured Poster Engineering</span>
          </div>

          <h1 className="font-tight font-bold text-4xl sm:text-6xl text-ink tracking-tight leading-[1.1]">
            Any reference. Your brand. <br />
            <span className="text-primary">Ready to prompt.</span>
          </h1>

          <p className="text-layout-layer text-base sm:text-lg max-w-xl mx-auto font-sans leading-relaxed">
            Deconstruct posters into reusable, fill-in-the-blank image prompts. Keep your typography, lighting, and layout intact without hallucinated prices or brand drift.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/workspace/generate"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/95 transition-all duration-150 shadow-sm active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-sm sm:text-base min-h-[48px]"
          >
            <span>Deconstruct a Poster</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/library"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 bg-paper border border-ink/15 text-ink font-semibold rounded-xl hover:bg-ink/5 transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-sm sm:text-base min-h-[48px]"
          >
            <span>Browse Winners Library</span>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-8 text-left">
          <div className="p-6 rounded-2xl border border-ink/10 bg-white/70 shadow-2xs space-y-3 hover:border-brand-layer/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-layer/10 flex items-center justify-center text-brand-layer">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="font-tight font-bold text-ink text-base">Brand DNA Injection</h2>
            <p className="text-layout-layer text-sm leading-relaxed">
              Wordmark, palette, and legal copy auto-bind to brand slots. Consistent visual rules across every render.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-ink/10 bg-white/70 shadow-2xs space-y-3 hover:border-accent/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-tight font-bold text-ink text-base">Never-Invent Guard</h2>
            <p className="text-layout-layer text-sm leading-relaxed">
              Discounts, dates, and prices stay blank until typed by you. Programmatic rule stops model hallucinations cold.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-ink/10 bg-white/70 shadow-2xs space-y-3 hover:border-success/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <Repeat className="w-5 h-5" />
            </div>
            <h2 className="font-tight font-bold text-ink text-base">Zero-Cost Winner Reuse</h2>
            <p className="text-layout-layer text-sm leading-relaxed">
              Once a poster prompt delivers a winner in Midjourney or Flux, swap products and headlines with zero AI calls.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
