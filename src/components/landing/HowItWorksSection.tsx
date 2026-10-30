import { UploadCloud, Sparkles, SlidersHorizontal, Trophy } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      actionVerb: 'Drop Reference Poster',
      icon: UploadCloud,
      summary: 'Extract structural layout & lighting in seconds.',
      details:
        'Upload any marketing poster from Pinterest, Instagram, or Behance. Vision AI analyzes composition geometry, focal length, depth of field, and hierarchy into modular Layout Text and Slots.',
    },
    {
      step: '02',
      actionVerb: 'Inject Brand DNA',
      icon: Sparkles,
      summary: 'Auto-bind visual identity and negative rules.',
      details:
        'Select your Brand. Stored brand guidelines—wordmarks, exact hex color codes, typography hierarchy, and negative constraints—instantly populate Brand Slots without manual typing.',
    },
    {
      step: '03',
      actionVerb: 'Autofill & Validate Layout Fit',
      icon: SlidersHorizontal,
      summary: 'Fill campaign details with zero hallucination.',
      details:
        'Drop your product shot. Vision AI infers campaign descriptors in volatile RAM. Real-time Layout-Fit Warnings alert you if your product aspect ratio clashes with the poster framing.',
    },
    {
      step: '04',
      actionVerb: 'Prompt & Vault Your Winners',
      icon: Trophy,
      summary: 'One-click copy and zero-cost infinite reuse.',
      details:
        'Copy the formatted prompt and ordered asset checklist into Midjourney v6 or Flux. Grade your result poster side-by-side, mark it as a "Winner", and remix it for future campaigns at $0.00 in AI tokens.',
    },
  ];

  return (
    <section 
      id="how-it-works" 
      aria-labelledby="how-it-works-heading" 
      className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full"
    >
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-cyan-950/60 text-cyan-300 border border-cyan-400/30">
          <span>Streamlined Workflow</span>
        </div>

        <h2 
          id="how-it-works-heading" 
          className="font-tight font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight"
        >
          From Pinterest reference to <br className="hidden sm:inline" />
          <span className="text-cyan-300">brand-locked prompt in 60 seconds.</span>
        </h2>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          Four structured steps designed to eliminate prompt guessing and protect your brand consistency.
        </p>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map((st, i) => {
          const Icon = st.icon;
          return (
            <div 
              key={i} 
              className="p-6 sm:p-7 rounded-3xl border border-white/10 bg-slate-950/80 shadow-xl hover:border-cyan-400/40 transition-all flex flex-col justify-between space-y-5 relative group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-400/30">
                    STEP {st.step}
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-400/30 transition-all">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-tight font-bold text-lg text-white">
                    {st.actionVerb}
                  </h3>
                  <p className="text-xs font-mono font-semibold text-cyan-400">
                    {st.summary}
                  </p>
                </div>

                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {st.details}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                <span>Deterministic</span>
                <span className="text-emerald-400 font-semibold">Zero Prompt Drift</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
