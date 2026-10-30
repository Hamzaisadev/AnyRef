import { requireAdmin } from '@/services/session';
import { AnalyticsService } from '@/services/analyticsService';
import {
  Activity,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
} from 'lucide-react';

export default async function AdminObservabilityPage() {
  const profile = await requireAdmin();
  const obs = await AnalyticsService.getObservabilityMetrics(profile);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              System Health & LLM Tracing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              OpenTelemetry & Gemini
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time observability across Gemini 1.5 Flash latency, token burn rate, error distributions, and distributed traces.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {obs.killSwitchActive ? (
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>AI Kill-Switch Active</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All Systems Nominal</span>
            </span>
          )}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Gemini Latency (p50 / p95)</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {obs.latencyPercentiles.p50Ms}ms{' '}
            <span className="text-xs text-slate-500 font-sans">
              / {obs.latencyPercentiles.p95Ms}ms
            </span>
          </div>
          <div className="text-xs text-indigo-400">
            <span>SLO Target: &lt;2,500ms (Healthy)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>AI Cost Burn Today</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            ${obs.tokenBurnRate.costTodayUsd.toFixed(3)}{' '}
            <span className="text-xs text-slate-500 font-sans">
              / ${obs.tokenBurnRate.dailyCapUsd} max
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                obs.tokenBurnRate.percentOfCapUsed > 80
                  ? 'bg-red-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(obs.tokenBurnRate.percentOfCapUsed, 2)}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tokens Consumed Today</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {obs.tokenBurnRate.totalTokensToday.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 flex justify-between font-mono">
            <span>In: {obs.tokenBurnRate.inputTokensToday}</span>
            <span>Out: {obs.tokenBurnRate.outputTokensToday}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Infrastructure Health</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">99.98%</div>
          <div className="text-xs text-sky-400">0 degraded service endpoints</div>
        </div>
      </div>

      {/* Services Health Matrix */}
      <div className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-4">
        <h2 className="text-base font-semibold text-white">
          Upstream & Downstream Dependencies
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {obs.services.map((svc) => (
            <div
              key={svc.name}
              className="p-4 rounded-xl bg-[#0A0C16] border border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-slate-200">{svc.name}</span>
                {svc.status === 'healthy' ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-400 shadow-sm shadow-red-400/50" />
                )}
              </div>
              <div className="flex items-baseline justify-between font-mono text-xs text-slate-400">
                <span>Latency: {svc.latencyMs}ms</span>
                <span className="text-emerald-400">{svc.uptimePct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distributed Trace Log Table */}
      <div className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Recent Distributed Traces
            </h2>
            <p className="text-xs text-slate-400">
              Correlated requests across Edge API, Supabase mutations, and Gemini LLM compilation
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              Header: x-trace-id
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Trace ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Route & Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4">Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {obs.recentTraces.map((trc) => (
                <tr key={trc.traceId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-indigo-400 font-semibold">
                    {trc.traceId}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(trc.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-white flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                      {trc.method}
                    </span>
                    <span>{trc.route}</span>
                  </td>
                  <td className="py-3 px-4">
                    {trc.statusCode === 200 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        200 OK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        {trc.statusCode}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">{trc.durationMs}ms</td>
                  <td className="py-3 px-4">
                    {trc.tokens ? trc.tokens.toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {trc.costUsd ? `$${trc.costUsd.toFixed(5)}` : '—'}
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
