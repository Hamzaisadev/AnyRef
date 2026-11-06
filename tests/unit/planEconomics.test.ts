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

    // Free plan: 5 gen, 5 autofill, 2 draft per day -> 150/150/60 per mo
    // Worst-case AI cost = 150*0.003493 + 150*0.001675 + 60*0.001125 = ~$0.84
    expect(free!.worstCaseDailyQuotaAiCost).toBeCloseTo(0.84, 1);
    expect(free!.budgetCappedAiCost).toBe(0.40);
    expect(free!.budgetCappedAiCost).toBeLessThanOrEqual(DEFAULT_PLAN_ECONOMICS.maxFreeBudgetUsd);

    // Pro plan: 20 gen, 40 autofill, 5 draft per day -> 600/1200/150 per mo
    // Worst-case AI cost = 600*0.003493 + 1200*0.001675 + 150*0.001125 = ~$4.27
    expect(pro!.worstCaseDailyQuotaAiCost).toBeCloseTo(4.27, 1);
    expect(pro!.budgetCappedAiCost).toBe(4.00);
    expect(pro!.priceMonth).toBe(19);
    // Net revenue: 19 - (19*0.05 + 0.50) = 19 - 1.45 = $17.55
    expect(pro!.netRevenueAfterFees).toBeCloseTo(17.55, 2);
    // Worst-case margin: (17.55 - 4.00) / 19 = 13.55 / 19 = 71.3%
    expect(pro!.worstCaseMarginPct).toBeGreaterThanOrEqual(DEFAULT_PLAN_ECONOMICS.minPlanMargin * 100);
    expect(pro!.worstCaseMarginPct).toBeCloseTo(71.3, 1);
    // Typical margin (at 30% utilization): ~85.6%
    expect(pro!.typicalMarginPct).toBeCloseTo(85.6, 1);

    // Studio plan: 60 gen, 120 autofill, 20 draft per day -> 1800/3600/600 per mo
    // Worst-case AI cost = 1800*0.003493 + 3600*0.001675 + 600*0.001125 = ~$12.99
    expect(studio!.worstCaseDailyQuotaAiCost).toBeCloseTo(12.99, 1);
    expect(studio!.budgetCappedAiCost).toBe(12.00);
    expect(studio!.priceMonth).toBe(49);
    // Net revenue: 49 - (49*0.05 + 0.50) = 49 - 2.95 = $46.05
    expect(studio!.netRevenueAfterFees).toBeCloseTo(46.05, 2);
    // Worst-case margin: (46.05 - 12.00) / 49 = 34.05 / 49 = 69.5%
    expect(studio!.worstCaseMarginPct).toBeGreaterThanOrEqual(DEFAULT_PLAN_ECONOMICS.minPlanMargin * 100);
    expect(studio!.worstCaseMarginPct).toBeCloseTo(69.5, 1);
    // Typical margin (at 30% utilization): ~86.0%
    expect(studio!.typicalMarginPct).toBeCloseTo(86.0, 1);
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
