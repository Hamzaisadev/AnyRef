import { AlertOctagon, Flame, FileWarning, Clock, RefreshCw, XCircle } from 'lucide-react';

export default function ProblemAgitationSection() {
  const problems = [
    {
      icon: Flame,
      title: 'The 50-Reroll Black Hole',
      description:
        'You find a stunning Pinterest poster. You spend 45 minutes typing ad-hoc prompts into Discord, burning GPU credits while the composition, camera angle, and focal depth morph unpredictably with every single reroll.',
      stat: '45+ mins',
      statLabel: 'lost per poster experiment',
    },
    {
      icon: FileWarning,
      title: 'Catastrophic Brand Drift',
      description:
        'Generative models have zero loyalty to your brand guidelines. You end up with off-brand neon hex colors, mismatched typography, and chaotic visual styles that look like they were generated for five different competitors.',
      stat: '70%',
      statLabel: 'of raw outputs rejected by design leads',
    },
    {
      icon: AlertOctagon,
      title: 'Hallucinated Promotions & Legal Traps',
      description:
        'Generative models love making up random badges like "70% OFF TODAY", gibberish phone numbers, and fabricated claims. Feeding unchecked AI outputs into live ad campaigns invites immediate compliance penalties.',
      stat: '100%',
      statLabel: 'preventable with strict guardrails',
    },
  ];

  const agitationPoints = [
    {
      pain: 'Starting from scratch on every campaign',
      detail:
        'You cracked a winning prompt last month for a summer drop. But because the parameters were never modularized, you cannot swap products without breaking the whole composition.',
    },
    {
      pain: 'Aspect ratio and composition clashing',
      detail:
        'Feeding a vertical beverage can into a widescreen 16:9 banner prompt warps the product or cuts off the branding. You burn 10 rerolls before realizing the physical geometries clash.',
    },
    {
      pain: 'Uncontrolled prompt sprawling across notepads and Slack',
      detail:
        'Your team stores prompts in Apple Notes, Google Docs, and messy Slack threads. No one knows which prompt version actually produced the approved high-converting asset.',
    },
  ];

  return (
    <section 
      id="problem" 
      aria-labelledby="problem-heading" 
      className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full"
    >
      {/* Problem Header (PAS: Problem) */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-rose-950/60 text-rose-400 border border-rose-500/30">
          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>The Prompt Engineering Trap</span>
        </div>

        <h2 
          id="problem-heading" 
          className="font-tight font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight"
        >
          Finding the reference is easy.{' '}
          <span className="text-rose-400 block sm:inline">
            Getting AI to respect your brand is a nightmare.
          </span>
        </h2>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          You spot an award-winning marketing poster. You want that exact lighting, depth, and layout for your product. But when you feed it to Midjourney or ChatGPT, you get generic AI soup.
        </p>
      </div>

      {/* 3 Core Pain Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {problems.map((prob, i) => {
          const Icon = prob.icon;
          return (
            <div 
              key={i} 
              className="p-6 sm:p-7 rounded-3xl border border-white/10 bg-slate-950/80 shadow-xl hover:border-rose-500/40 transition-all space-y-4 relative flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="font-tight font-bold text-xl text-white">
                  {prob.title}
                </h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  {prob.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-baseline justify-between">
                <span className="font-mono font-extrabold text-2xl text-rose-400">
                  {prob.stat}
                </span>
                <span className="text-xs text-slate-500 font-medium text-right max-w-[150px]">
                  {prob.statLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agitation Container (PAS: Agitate) */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-950/90 to-black p-6 sm:p-10 shadow-xl">
        <div className="max-w-2xl mb-8 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-mono font-semibold text-xs tracking-wider uppercase">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>The Compounding Cost of Inaction</span>
          </div>
          <h3 className="font-tight font-bold text-2xl sm:text-3xl text-white tracking-tight">
            How much time, budget, and brand equity are you losing each week?
          </h3>
          <p className="text-slate-400 text-sm sm:text-base">
            Every unorganized prompt experiment compounds your team's creative debt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agitationPoints.map((pt, i) => (
            <div 
              key={i} 
              className="p-5 rounded-2xl bg-black/50 border border-white/5 space-y-2 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm">
                <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="text-slate-200">{pt.pain}</span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {pt.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
