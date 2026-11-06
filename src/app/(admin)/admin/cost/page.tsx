import { requireAdmin } from '@/services/session';
import { createClient } from '@/lib/supabaseServer';
import { DollarSign, ShieldCheck, Layers, Users } from 'lucide-react';
import { calculatePlanEconomics } from '@/lib/planEconomics';

export default async function AdminCostPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch AI usage metrics today
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const { data: usageToday } = await supabase
    .from('ai_usage')
    .select('user_id, kind, input_tokens, output_tokens, est_cost_usd, created_at')
    .gte('created_at', todayMidnight.toISOString());

  const todayCost = (usageToday || []).reduce((sum: number, r: any) => sum + Number(r.est_cost_usd || 0), 0);
  const totalCalls = usageToday?.length || 0;
  const totalTokens = (usageToday || []).reduce(
    (sum: number, r: any) => sum + Number(r.input_tokens || 0) + Number(r.output_tokens || 0),
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

  // --- Monthly Plan Economics & Exposure Analysis ---
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, plan_id');

  const userCountsByPlan: Record<string, number> = {};
  for (const prof of profiles || []) {
    const plan = prof.plan_id || 'free';
    userCountsByPlan[plan] = (userCountsByPlan[plan] || 0) + 1;
  }

  // Month-to-date user spend
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const { data: monthUsage } = await supabase
    .from('ai_usage')
    .select('user_id, est_cost_usd')
    .gte('created_at', monthStart.toISOString());

  const userSpendMonth: Record<string, number> = {};
  for (const row of monthUsage || []) {
    userSpendMonth[row.user_id] = (userSpendMonth[row.user_id] || 0) + Number(row.est_cost_usd || 0);
  }

  const planSpendMap: Record<string, { totalSpend: number; userCount: number }> = {};
  for (const prof of profiles || []) {
    const plan = prof.plan_id || 'free';
    const spend = userSpendMonth[prof.user_id] || 0;
    if (!planSpendMap[plan]) planSpendMap[plan] = { totalSpend: 0, userCount: 0 };
    planSpendMap[plan].totalSpend += spend;
    planSpendMap[plan].userCount += 1;
  }

  const economics = await calculatePlanEconomics();

  const freeUserCount = userCountsByPlan['free'] || 0;
  const freePlanData = economics.plans.find((p) => p.planId === 'free');
  const freeBudgetPerUser = freePlanData?.limits.monthly_ai_budget_usd ?? 0.40;
  const freeWorstCaseExposure = freeUserCount * freeBudgetPerUser;

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

      {/* Plan Economics Exposure & Margin Visibility Table */}
      <div className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Plan Exposure & Unit Economics</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Model: {economics.modelName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-900/50">
              <tr>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Users</th>
                <th className="py-3 px-4">Avg Cost (This Mo)</th>
                <th className="py-3 px-4">Monthly Budget</th>
                <th className="py-3 px-4">Worst-Case Exposure</th>
                <th className="py-3 px-4">Worst Margin</th>
                <th className="py-3 px-4">Typical Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-xs">
              {economics.plans.map((p) => {
                const userCount = userCountsByPlan[p.planId] || 0;
                const planStats = planSpendMap[p.planId];
                const avgSpendThisMonth =
                  planStats && planStats.userCount > 0
                    ? planStats.totalSpend / planStats.userCount
                    : 0;
                const worstCaseExposure = userCount * p.budgetCappedAiCost;

                return (
                  <tr key={p.planId} className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 font-sans font-semibold text-white capitalize">
                      {p.name}
                    </td>
                    <td className="py-3 px-4">{userCount}</td>
                    <td className="py-3 px-4">${avgSpendThisMonth.toFixed(4)}</td>
                    <td className="py-3 px-4">${p.budgetCappedAiCost.toFixed(2)}</td>
                    <td className="py-3 px-4 font-semibold text-amber-400">
                      ${worstCaseExposure.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {p.priceMonth > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          {(p.worstCaseMargin * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.priceMonth > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          {(p.typicalCaseMargin * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Free-tier exposure statement */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Free-tier maximum liability:</span>
          </span>
          <span className="font-mono font-semibold text-white">
            If every free user ({freeUserCount}) used their full budget (${freeBudgetPerUser.toFixed(2)}):{' '}
            <span className="text-amber-400">${freeWorstCaseExposure.toFixed(2)} USD</span>
          </span>
        </div>
      </div>
    </div>
  );
}
