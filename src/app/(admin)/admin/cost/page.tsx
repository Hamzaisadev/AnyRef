import { requireAdmin } from '@/services/session';
import { createClient } from '@/lib/supabaseServer';
import { DollarSign, BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react';

export default async function AdminCostPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch AI usage metrics
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const { data: usageToday } = await supabase
    .from('ai_usage')
    .select('user_id, model, input_tokens, output_tokens, cost_usd, created_at')
    .gte('created_at', todayMidnight.toISOString());

  const todayCost = (usageToday || []).reduce((sum, r) => sum + Number(r.cost_usd || 0), 0);
  const totalCalls = usageToday?.length || 0;
  const totalTokens = (usageToday || []).reduce(
    (sum, r) => sum + Number(r.input_tokens || 0) + Number(r.output_tokens || 0),
    0
  );

  // Daily cost cap setting
  const { data: capSetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'global_daily_cost_cap_usd')
    .maybeSingle();

  const dailyCap = Number(capSetting?.value ?? 10.0);
  const capPct = Math.min(100, Math.round((todayCost / dailyCap) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
          <DollarSign className="w-6 h-6 text-emerald-400" />
          <span>Global Cost & Limit Protection</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Automated circuit breakers monitor daily model inference spend against the global daily cost cap.
        </p>
      </div>

      {/* Daily Cap Progress Card */}
      <div className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Daily Spend Circuit Breaker
          </span>
          <span className="text-xs text-slate-400">
            ${todayCost.toFixed(3)} / ${dailyCap.toFixed(2)} USD Cap ({capPct}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              capPct > 90 ? 'bg-red-500' : capPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(4, capPct)}%` }}
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center space-x-2 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            If daily model cost reaches 100% of the cap, the system automatically activates the AI Kill Switch.
          </span>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Generations Today
          </span>
          <span className="text-2xl font-bold text-white tracking-tight">{totalCalls}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Tokens Processed
          </span>
          <span className="text-2xl font-bold text-white tracking-tight">
            {totalTokens.toLocaleString()}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Average Cost per Request
          </span>
          <span className="text-2xl font-bold text-white tracking-tight">
            ${totalCalls > 0 ? (todayCost / totalCalls).toFixed(4) : '0.0000'}
          </span>
        </div>
      </div>
    </div>
  );
}
