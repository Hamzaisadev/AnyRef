import { requireAdmin } from '@/services/session';
import { AnalyticsService } from '@/services/analyticsService';
import {
  TrendingUp,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  Bot,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default async function AdminAnalyticsPage() {
  const profile = await requireAdmin();
  const funnel = await AnalyticsService.getFunnelData(profile);
  const aiReferrals = AnalyticsService.getAiReferralBreakdown();

  const totalVisitors = funnel.totalVisitors;
  const overallSignupCvr = ((funnel.totalSignups / totalVisitors) * 100).toFixed(1);
  const winnerActivationRate = (
    (funnel.totalWinners / Math.max(funnel.totalSignups, 1)) *
    100
  ).toFixed(1);
  const plusConversionRate = (
    (funnel.totalSubscribers / Math.max(funnel.totalSignups, 1)) *
    100
  ).toFixed(1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Funnel & Growth Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live GA4 & PostHog
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            End-to-end user journey tracking from acquisition to winner prompt activation and Plus subscription.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-[#121526] border border-slate-800 rounded-lg p-1 flex text-xs font-medium text-slate-400">
            <button className="px-3 py-1 rounded bg-amber-500/20 text-amber-300">
              Last 7 Days
            </button>
            <button className="px-3 py-1 rounded hover:text-white transition-colors">
              30 Days
            </button>
            <button className="px-3 py-1 rounded hover:text-white transition-colors">
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Acquisition Volume</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalVisitors.toLocaleString()}
          </div>
          <div className="text-xs text-sky-400 flex items-center space-x-1">
            <span className="font-semibold">{overallSignupCvr}%</span>
            <span className="text-slate-500">landing-to-signup CVR</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Registered Accounts</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {funnel.totalSignups.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-400 flex items-center space-x-1">
            <span className="font-semibold">100%</span>
            <span className="text-slate-500">identity verified</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Winner Activations</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {funnel.totalWinners.toLocaleString()}
          </div>
          <div className="text-xs text-amber-400 flex items-center space-x-1">
            <span className="font-semibold">{winnerActivationRate}%</span>
            <span className="text-slate-500">of users tested a winner</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Plus Tier Paid Subscribers</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {funnel.totalSubscribers.toLocaleString()}
          </div>
          <div className="text-xs text-purple-400 flex items-center space-x-1">
            <span className="font-semibold">{plusConversionRate}%</span>
            <span className="text-slate-500">paid conversion rate</span>
          </div>
        </div>
      </div>

      {/* Multi-Stage Visual Funnels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Product Value Loop Funnel */}
        <div className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  Core Value Loop Funnel
                </h2>
                <p className="text-xs text-slate-400">
                  From brand setup to verified Winner prompt status
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
              High Intent
            </span>
          </div>

          <div className="space-y-4">
            {funnel.coreProductLoop.map((stage, idx) => (
              <div key={stage.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-200">{stage.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-white font-mono">
                      {stage.count.toLocaleString()}
                    </span>
                    {idx > 0 && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {stage.conversionRate}% CVR ({stage.dropOffRate}% drop)
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        (stage.count / Math.max(funnel.coreProductLoop[0]?.count ?? 1, 1)) * 100,
                        4
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Primary Bottleneck:</span>
            <span className="text-amber-300 font-medium">
              External Generator Testing (Prompt Copied → Result Uploaded)
            </span>
          </div>
        </div>

        {/* Monetization Funnel */}
        <div className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  Monetization & Expansion Funnel
                </h2>
                <p className="text-xs text-slate-400">
                  Quota exhaustion to active Plus subscription ($5/mo)
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
              Revenue
            </span>
          </div>

          <div className="space-y-4">
            {funnel.monetizationFunnel.map((stage, idx) => (
              <div key={stage.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-200">{stage.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-white font-mono">
                      {stage.count.toLocaleString()}
                    </span>
                    {idx > 0 && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {stage.conversionRate}% CVR
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        (stage.count / Math.max(funnel.monetizationFunnel[0]?.count ?? 1, 1)) * 100,
                        4
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Primary Driver:</span>
            <span className="text-purple-300 font-medium">
              Daily AI Generation Limit (5 calls/day on Free)
            </span>
          </div>
        </div>
      </div>

      {/* AI Referral Attribution Table */}
      <div className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Acquisition & AI Assistant Attribution
              </h2>
              <p className="text-xs text-slate-400">
                Measures traffic arriving via Perplexity, ChatGPT, Claude, Gemini vs Traditional Search
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
            GA4 AI Channel Ready
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Channel / Traffic Source</th>
                <th className="py-3 px-4">Visitors</th>
                <th className="py-3 px-4">Signups</th>
                <th className="py-3 px-4">Signup CVR</th>
                <th className="py-3 px-4">Intent Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {aiReferrals.map((row) => (
                <tr key={row.channel} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-white flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>{row.channel}</span>
                  </td>
                  <td className="py-3 px-4">{row.visitors.toLocaleString()}</td>
                  <td className="py-3 px-4 font-semibold text-white">{row.signups}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">
                    {row.conversionRate.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {row.conversionRate > 11 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Very High
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
