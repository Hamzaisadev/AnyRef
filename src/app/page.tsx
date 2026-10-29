import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-3xl space-y-8">
        {/* Brand Header */}
        <div className="flex items-center justify-center space-x-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/30">
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
          <span className="font-tight font-bold text-4xl tracking-tight text-ink">
            anyref
          </span>
        </div>

        <div className="space-y-4">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-brand-layer bg-brand-layer/10 rounded-full border border-brand-layer/20 uppercase">
            Phase 1: Data &amp; Auth Ready
          </span>
          <h1 className="font-tight font-bold text-4xl sm:text-6xl text-ink tracking-tight leading-tight">
            Any reference. Your brand. <br />
            <span className="text-primary">Ready to prompt.</span>
          </h1>
          <p className="text-layout-layer text-lg sm:text-xl max-w-xl mx-auto font-sans leading-relaxed">
            Deconstruct Pinterest and marketing posters into reusable, fill-in-the-blank image generation prompts without hallucinated prices or brand drift.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-medium rounded-lg hover:opacity-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Access Studio
          </Link>
          <Link
            href="/library"
            className="w-full sm:w-auto px-8 py-3.5 bg-paper border border-ink/15 text-ink font-medium rounded-lg hover:bg-ink/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Browse Library
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-5 rounded-xl border border-ink/10 bg-white/40">
            <div className="w-8 h-8 rounded-lg bg-brand-layer/10 flex items-center justify-center text-brand-layer mb-3 font-mono font-bold text-sm">
              01
            </div>
            <h3 className="font-tight font-semibold text-ink text-base">Brand DNA Injection</h3>
            <p className="text-layout-layer text-sm mt-1">
              Wordmark, colors, and slogans auto-bind to brand slots.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-ink/10 bg-white/40">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-3 font-mono font-bold text-sm">
              02
            </div>
            <h3 className="font-tight font-semibold text-ink text-base">Never-Invent Guard</h3>
            <p className="text-layout-layer text-sm mt-1">
              Prices, discounts, and dates stay blank until typed by you.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-ink/10 bg-white/40">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success mb-3 font-mono font-bold text-sm">
              03
            </div>
            <h3 className="font-tight font-semibold text-ink text-base">Zero-Cost Winner Reuse</h3>
            <p className="text-layout-layer text-sm mt-1">
              Reuse proven prompt templates infinitely for $0.00 in AI calls.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
