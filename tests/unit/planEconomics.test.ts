import { describe, it, expect } from 'vitest';
import {
  calculatePlanEconomics,
  loadBenchmarkReport,
  DEFAULT_BENCHMARK_COSTS,
} from '@/lib/planEconomics';
import { DEFAULT_PLAN_ECONOMICS } from '@/config/plans';

describe('Plan Unit Economics Calculations', () => {
  it('loads empirical benchmark ground truth from JSON', () => {
    const report = loadBenchmarkReport();
    expect(report.modelTested).toBe('gemini-3.5-flash-lite');
    expect(report.summaries.generate.avgCostLiteUsd).toBeCloseTo(0.003493, 5);
    expect(report.summaries.autofill.avgCostLiteUsd).toBeCloseTo(0.001675, 5);
    expect(report.summaries.brand_draft.avgCostLiteUsd).toBeCloseTo(0.001125, 5);
  });

  it('calculates worst-case and typical-case economics for Free, Pro, and Studio', async () => {
    const economics = await calculatePlanEconomics({
      useBenchmarkFile: true,
      feePercent: DEFAULT_PLAN_ECONOMICS.paymentFeePercent,
      feeFixedUsd: DEFAULT_PLAN_ECONOMICS.paymentFeeFixedUsd,
      typicalUtilization: DEFAULT_PLAN_ECONOMICS.typicalUtilizationRatio,
    });

    const free = economics.plans.find((p) => p.planId === 'free');
    const pro = economics.plans.find((p) => p.planId === 'pro');
    const studio = economics.plans.find((p) => p.planId === 'studio');

    expect(free).toBeDefined();
    expect(pro).toBeDefined();
    expect(studio).toBeDefined();

    // Free plan: 3 gen, 3 autofill, 2 draft per day -> 90/90/60 per mo, + 3 renders
    // Worst-case = 90*0.003493 + 90*0.001675 + 60*0.001125 + 3*0.134 = ~$0.93
    expect(free!.worstCaseDailyQuotaAiCost).toBeCloseTo(0.93, 1);
    expect(free!.budgetCappedAiCost).toBe(0.58);
    expect(free!.budgetCappedAiCost).toBeLessThanOrEqual(DEFAULT_PLAN_ECONOMICS.maxFreeBudgetUsd);

    // Pro: 10 gen, 20 autofill, 3 draft per day + 30 renders/mo
    // Worst-case = 30*(10*0.003493 + 20*0.001675 + 3*0.001125) + 30*0.134 = ~$6.17
    // Renders alone are $4.02 of that — the dominant line item.
    expect(pro!.worstCaseDailyQuotaAiCost).toBeCloseTo(6.17, 1);
    expect(pro!.priceMonth).toBe(15);
    // Net revenue: 15 - (15*0.05 + 0.50) = 15 - 1.25 = $13.75
    expect(pro!.netRevenueAfterFees).toBeCloseTo(13.75, 2);
    // Worst-case margin: (13.75 - 6.17) / 15 = 50.5%
    expect(pro!.worstCaseMarginPct).toBeGreaterThanOrEqual(DEFAULT_PLAN_ECONOMICS.minPlanMargin * 100);
    expect(pro!.worstCaseMarginPct).toBeCloseTo(50.5, 1);
    expect(pro!.typicalMarginPct).toBeCloseTo(79.3, 1);

    // Studio: 30 gen, 60 autofill, 10 draft per day + 100 renders/mo
    // Worst-case = 30*(30*0.003493 + 60*0.001675 + 10*0.001125) + 100*0.134 = ~$19.90
    expect(studio!.worstCaseDailyQuotaAiCost).toBeCloseTo(19.90, 1);
    expect(studio!.priceMonth).toBe(49);
    // Net revenue: 49 - (49*0.05 + 0.50) = 49 - 2.95 = $46.05
    expect(studio!.netRevenueAfterFees).toBeCloseTo(46.05, 2);
    // Worst-case margin: (46.05 - 19.90) / 49 = 53.4%
    expect(studio!.worstCaseMarginPct).toBeGreaterThanOrEqual(DEFAULT_PLAN_ECONOMICS.minPlanMargin * 100);
    expect(studio!.worstCaseMarginPct).toBeCloseTo(53.4, 1);
    expect(studio!.typicalMarginPct).toBeCloseTo(81.8, 1);
  });

  it('counts render spend as the dominant cost driver on every paid plan', async () => {
    const economics = await calculatePlanEconomics({ useBenchmarkFile: true });

    for (const plan of economics.plans.filter((p) => p.priceMonth > 0)) {
      const renderSpend = (plan.limits.render_per_month ?? 0) * economics.costsPerCall.render;
      // Renders must account for more than half of worst-case AI spend; if they
      // ever don't, the text quotas have drifted too high.
      expect(
        renderSpend / plan.worstCaseDailyQuotaAiCost,
        `${plan.name}: renders should dominate worst-case AI cost`
      ).toBeGreaterThan(0.5);
    }
  });

  it('demonstrates that the legacy Plus plan without budget cap is economically non-viable', () => {
    // 50 gen, 100 auto, 20 draft per day -> 1500 gen, 3000 auto, 600 draft per month
    const genCost = 1500 * DEFAULT_BENCHMARK_COSTS.generate;
    const autoCost = 3000 * DEFAULT_BENCHMARK_COSTS.autofill;
    const draftCost = 600 * DEFAULT_BENCHMARK_COSTS.brand_draft;
    const worstCaseCost = genCost + autoCost + draftCost; // ~$10.94

    const price = 5.00;
    const fee = price * 0.05 + 0.50; // $0.75
    const netRev = price - fee; // $4.25

    const worstCaseLoss = netRev - worstCaseCost; // -$6.69
    expect(worstCaseCost).toBeCloseTo(10.94, 1);
    expect(worstCaseLoss).toBeLessThan(0); // Loses money!
  });
});
