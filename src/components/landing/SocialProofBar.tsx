import { CheckCircle2, ShieldCheck, Sparkles, Layers } from 'lucide-react';

export default function SocialProofBar() {
  const stats = [
    { label: 'Posters Deconstructed', value: '10,000+', icon: Layers },
    { label: 'Brand Drift Rate', value: '0.0%', icon: Sparkles },
    { label: 'Price Hallucination Risk', value: 'Zero', icon: ShieldCheck },
    { label: 'Prompt Reuse Token Cost', value: '$0.00', icon: CheckCircle2 },
  ];

  const platforms = [
    { name: 'Midjourney v6.1', note: 'Multi-image & --sref support' },
    { name: 'FLUX.1 [Schnell & Dev]', note: 'Typography & photorealism' },
    { name: 'Ideogram v2', note: 'Text-in-graphic alignment' },
    { name: 'Recraft v3', note: 'Vector & brand color match' },
    { name: 'Pinterest & Behance', note: 'Universal reference ingest' },
  ];

  return (
    <section 
      aria-label="Platform Compatibility and Trust Signals" 
      className="w-full border-y border-white/10 bg-slate-950/80 backdrop-blur-md py-10 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Metric Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div 
                key={i} 
                className="flex flex-col items-center sm:items-start p-4 rounded-2xl bg-black/40 border border-white/10 shadow-lg hover:border-cyan-400/40 transition-colors"
              >
                <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span className="font-tight font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-slate-400 font-medium text-center sm:text-left">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Compatible Generation Engines */}
        <div className="pt-2 text-center">
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Engineered for pure prompt compatibility with world-class image models
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {platforms.map((p, i) => (
              <div 
                key={i}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 text-xs font-mono shadow-sm hover:border-white/20 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                <span className="font-semibold text-white">{p.name}</span>
                <span className="text-slate-400 hidden sm:inline">• {p.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
