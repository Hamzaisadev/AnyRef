import * as fs from 'fs';
import { resolve } from 'path';
import { PLANS_CONFIG, DEFAULT_PLAN_ECONOMICS, type PlanLimits } from '../config/plans';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const DEFAULT_BENCHMARK_COSTS = {
  generate: 0.003493,
  autofill: 0.001675,
  brand_draft: 0.001125,
  // Nano Banana Pro 1K/2K flat output rate. Not a token benchmark: image models
  // bill per image, so this is a published list price rather than a measured average.
  // Source: https://aistudio.google.com/docs/pricing (retrieved 2026-11-07)
  render: 0.134,
  reuse: 0.0,
};

export function loadBenchmarkReport() {
  const benchmarkPath = resolve(process.cwd(), 'docs/spike/cost_benchmark_25_runs.json');
  if (!fs.existsSync(benchmarkPath)) {
    throw new Error(`Benchmark report not found at ${benchmarkPath}`);
  }
  return JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
}

export interface PlanEconomicsResult {
  planId: string;
  name: string;
  priceMonth: number;
  priceYear: number;
  worstCaseDailyQuotaAiCost: number;
  budgetCappedAiCost: number;
  netRevenueAfterFees: number;
  worstCaseMargin: number;
  worstCaseMarginPct: number;
  typicalAiCost: number;
  typicalCaseMargin: number;
  typicalMarginPct: number;
  limits: PlanLimits;
}

export interface EconomicsSummary {
  modelName: string;
  costSource: 'ai_usage_database' | 'cost_benchmark_json';
  costsPerCall: {
    generate: number;
    autofill: number;
    brand_draft: number;
    /** Flat per-image render cost. Dominates every other line item. */
    render: number;
    reuse: number;
  };
  plans: PlanEconomicsResult[];
  freeTierWorstCaseExposure: number;
}

export interface CalculatePlanEconomicsOptions {
  useBenchmarkFile?: boolean;
  feePercent?: number;
  feeFixedUsd?: number;
  typicalUtilization?: number;
}

export async function calculatePlanEconomics(
  options?: CalculatePlanEconomicsOptions
): Promise<EconomicsSummary> {
  const modelName = process.env.AI_MODEL || 'gemini-3.5-flash-lite';

  let dbPlans: Array<{ id: string; name: string; price_usd_month: number; price_usd_year: number; limits: PlanLimits }> | null = null;
  let aiUsageCount = 0;
  const dynamicCosts: {
    generate?: number;
    autofill?: number;
    brand_draft?: number;
    render?: number;
  } = {};

  if (!options?.useBenchmarkFile) {
    try {
      const sb = getSupabaseClient();
      if (sb) {
        const { data: plansData } = await sb
          .from('plans')
          .select('id, name, price_usd_month, price_usd_year, limits, is_active')
          .eq('is_active', true);

        if (plansData && plansData.length > 0) {
          dbPlans = plansData as any;
        }

        // Check count of ai_usage rows
        const { count } = await sb.from('ai_usage').select('*', { count: 'exact', head: true });
        aiUsageCount = count || 0;

        if (aiUsageCount >= 50) {
          for (const kind of ['generate', 'autofill', 'brand_draft', 'render'] as const) {
            const { data: rows } = await sb
              .from('ai_usage')
              .select('est_cost_usd')
              .eq('kind', kind);

            if (rows && rows.length > 0) {
              const sum = rows.reduce((acc, r) => acc + Number(r.est_cost_usd || 0), 0);
              dynamicCosts[kind] = sum / rows.length;
            }
          }
        }
      }
    } catch {
      // Fallback to static config if DB is unreachable
    }
  }

  // Load benchmark costs from JSON
  let benchmarkCosts = { ...DEFAULT_BENCHMARK_COSTS };

  try {
    const bench = loadBenchmarkReport();
    benchmarkCosts = {
      generate: bench.summaries?.generate?.avgCostLiteUsd ?? DEFAULT_BENCHMARK_COSTS.generate,
      autofill: bench.summaries?.autofill?.avgCostLiteUsd ?? DEFAULT_BENCHMARK_COSTS.autofill,
      brand_draft: bench.summaries?.brand_draft?.avgCostLiteUsd ?? DEFAULT_BENCHMARK_COSTS.brand_draft,
      // Renders are priced from the published per-image rate, not the token benchmark.
      render: DEFAULT_BENCHMARK_COSTS.render,
      reuse: 0.0,
    };
  } catch {
    // fallback
  }

  const useDynamicCosts =
    !options?.useBenchmarkFile &&
    aiUsageCount >= 50 &&
    dynamicCosts.generate !== undefined &&
    dynamicCosts.autofill !== undefined;

  const costsPerCall = useDynamicCosts
    ? {
        generate: dynamicCosts.generate!,
        autofill: dynamicCosts.autofill!,
        brand_draft: dynamicCosts.brand_draft ?? benchmarkCosts.brand_draft,
        render: dynamicCosts.render ?? benchmarkCosts.render,
        reuse: 0.0,
      }
    : benchmarkCosts;

  // Plan source
  const targetPlans: Array<{ id: string; name: string; price_usd_month: number; price_usd_year: number; limits: PlanLimits }> =
    dbPlans && dbPlans.length > 0
      ? dbPlans.filter((p) => p.id !== 'plus')
      : [
          {
            id: 'free',
            name: PLANS_CONFIG.free.name,
            price_usd_month: PLANS_CONFIG.free.priceUsdMonth,
            price_usd_year: PLANS_CONFIG.free.priceUsdYear,
            limits: PLANS_CONFIG.free.limits,
          },
          {
            id: 'pro',
            name: PLANS_CONFIG.pro.name,
            price_usd_month: PLANS_CONFIG.pro.priceUsdMonth,
            price_usd_year: PLANS_CONFIG.pro.priceUsdYear,
            limits: PLANS_CONFIG.pro.limits,
          },
          {
            id: 'studio',
            name: PLANS_CONFIG.studio.name,
            price_usd_month: PLANS_CONFIG.studio.priceUsdMonth,
            price_usd_year: PLANS_CONFIG.studio.priceUsdYear,
            limits: PLANS_CONFIG.studio.limits,
          },
        ];

  // Fee model [A]
  const feePct = options?.feePercent ?? DEFAULT_PLAN_ECONOMICS.paymentFeePercent;
  const feeFixed = options?.feeFixedUsd ?? DEFAULT_PLAN_ECONOMICS.paymentFeeFixedUsd;
  const typicalRatio = options?.typicalUtilization ?? DEFAULT_PLAN_ECONOMICS.typicalUtilizationRatio;

  const planResults: PlanEconomicsResult[] = [];

  for (const plan of targetPlans) {
    const limits = plan.limits;
    const genPerDay = limits.generate_per_day || 0;
    const autoPerDay = limits.autofill_per_day || 0;
    const draftPerDay = limits.brand_draft_per_day || 0;
    const monthlyBudget = limits.monthly_ai_budget_usd ?? Infinity;

    // Renders are capped per MONTH, not per day, so they are added as a monthly
    // term rather than multiplied by 30. The monthly cap is the binding constraint:
    // render_per_day * 30 would wildly overstate the real worst case.
    const rendersPerMonth = Math.min(
      limits.render_per_month ?? 0,
      (limits.render_per_day ?? 0) * 30
    );
    const worstCaseRenderCost = rendersPerMonth * costsPerCall.render;

    // 30-day worst-case daily quota AI cost, plus the monthly render allowance
    const worstCaseDailyQuotaAiCost =
      30 *
        (genPerDay * costsPerCall.generate +
          autoPerDay * costsPerCall.autofill +
          draftPerDay * costsPerCall.brand_draft) +
      worstCaseRenderCost;

    // Budget-capped AI cost
    const budgetCappedAiCost = Math.min(worstCaseDailyQuotaAiCost, monthlyBudget);

    // Typical-case AI cost (30% utilization)
    const typicalAiCost = worstCaseDailyQuotaAiCost * typicalRatio;

    const priceMonth = plan.price_usd_month;
    const fee = priceMonth > 0 ? priceMonth * feePct + feeFixed : 0;
    const netRevenue = Math.max(0, priceMonth - fee);

    // Margins
    const worstCaseMargin =
      priceMonth > 0 ? (netRevenue - budgetCappedAiCost) / priceMonth : 0;
    const typicalCaseMargin =
      priceMonth > 0 ? (netRevenue - typicalAiCost) / priceMonth : 0;

    planResults.push({
      planId: plan.id,
      name: plan.name,
      priceMonth,
      priceYear: plan.price_usd_year,
      worstCaseDailyQuotaAiCost: Number(worstCaseDailyQuotaAiCost.toFixed(4)),
      budgetCappedAiCost: Number(budgetCappedAiCost.toFixed(4)),
      netRevenueAfterFees: Number(netRevenue.toFixed(2)),
      worstCaseMargin: Number(worstCaseMargin.toFixed(4)),
      worstCaseMarginPct: Number((worstCaseMargin * 100).toFixed(1)),
      typicalAiCost: Number(typicalAiCost.toFixed(4)),
      typicalCaseMargin: Number(typicalCaseMargin.toFixed(4)),
      typicalMarginPct: Number((typicalCaseMargin * 100).toFixed(1)),
      limits,
    });
  }

  const freePlan = planResults.find((p) => p.planId === 'free');
  const freeTierWorstCaseExposure = freePlan ? freePlan.budgetCappedAiCost : 0.40;

  return {
    modelName,
    costSource: useDynamicCosts ? 'ai_usage_database' : 'cost_benchmark_json',
    costsPerCall,
    plans: planResults,
    freeTierWorstCaseExposure,
  };
}
