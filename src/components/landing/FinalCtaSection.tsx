import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Layers } from 'lucide-react';

export default function FinalCtaSection() {
  return (
    <section 
      aria-label="Get Started with AnyRef" 
      className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center"
    >
      <div className="p-8 sm:p-16 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-black border border-white/15 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-400/30">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Start Building Your Winning Poster Engine</span>
          </div>

          <h2 className="font-tight font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Stop prompt guessing.{' '}
            <span className="text-cyan-300 block sm:inline">
              Lock in your brand today.
            </span>
          </h2>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Drop your favorite Pinterest reference, auto-bind your brand guidelines, and generate bulletproof prompts for Midjourney and Flux in 60 seconds.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/workspace/generate"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 bg-primary text-white font-mono text-xs font-bold tracking-wider rounded-2xl hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(75,43,255,0.4)] active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[48px]"
            >
              <span>START DECONSTRUCTING POSTERS FREE</span>
              <ArrowRight className="w-4 h-4 text-accent" aria-hidden="true" />
            </Link>

            <Link
              href="/library"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-mono text-xs font-semibold tracking-wider rounded-2xl transition-all active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[48px]"
            >
              <span>EXPLORE WINNER VAULT</span>
            </Link>
          </div>

          {/* Risk Reversals */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>5 free deconstructions daily</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span>Instant setup in 30 seconds</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
