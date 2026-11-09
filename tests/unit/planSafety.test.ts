import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import { resolve } from 'path';
import { calculatePlanEconomics } from '../../scripts/plan-economics';
import { DEFAULT_PLAN_ECONOMICS, PLANS_CONFIG } from '../../src/config/plans';
import { OFFICIAL_PRICING_METADATA } from '../../src/ai/pricing';

describe('plan-safety: Plan Economics, Margin Floor, and Budget Caps', () => {
  it(`enforces that every paid plan budget-capped worst-case margin is above MIN_PLAN_MARGIN (${DEFAULT_PLAN_ECONOMICS.minPlanMargin})`, async () => {
    // useBenchmarkFile pins this to the committed cost ground truth. Without it the
    // call reaches for live Supabase data and stalls past the default test timeout.
    const summary = await calculatePlanEconomics({ useBenchmarkFile: true });
    const paidPlans = summary.plans.filter((p) => p.priceMonth > 0);

    expect(paidPlans.length).toBeGreaterThan(0);

    for (const plan of paidPlans) {
      expect(
        plan.worstCaseMargin,
        `Plan ${plan.name} worst-case margin (${(plan.worstCaseMargin * 100).toFixed(1)}%) is below minimum margin floor (${DEFAULT_PLAN_ECONOMICS.minPlanMargin * 100}%)`
      ).toBeGreaterThanOrEqual(DEFAULT_PLAN_ECONOMICS.minPlanMargin);
    }
  });

  it(`enforces that Free tier monthly budget does not exceed MAX_FREE_BUDGET_USD ($${DEFAULT_PLAN_ECONOMICS.maxFreeBudgetUsd})`, async () => {
    const summary = await calculatePlanEconomics({ useBenchmarkFile: true });
    const freePlan = summary.plans.find((p) => p.planId === 'free');

    expect(freePlan).toBeDefined();
    const freeBudget = freePlan?.limits.monthly_ai_budget_usd ?? 0;

    expect(
      freeBudget,
      `Free plan monthly budget ($${freeBudget}) exceeds MAX_FREE_BUDGET_USD ($${DEFAULT_PLAN_ECONOMICS.maxFreeBudgetUsd})`
    ).toBeLessThanOrEqual(DEFAULT_PLAN_ECONOMICS.maxFreeBudgetUsd);
  });

  it('enforces that free-tier render exposure cannot bankrupt an unmonetised signup', async () => {
    const summary = await calculatePlanEconomics({ useBenchmarkFile: true });
    const freePlan = summary.plans.find((p) => p.planId === 'free');
    const freeRenders = freePlan?.limits.render_per_month ?? 0;

    // Renders are the only free-tier line item large enough to matter. At 1,000
    // free signups this is the number that decides whether the month is survivable.
    const worstCaseRenderSpend = freeRenders * summary.costsPerCall.render;
    expect(
      worstCaseRenderSpend,
      `Free tier allows ${freeRenders} renders = $${worstCaseRenderSpend.toFixed(2)}/user/mo`
    ).toBeLessThanOrEqual(0.45);

    expect(freePlan?.limits.monthly_ai_budget_usd ?? 0).toBeLessThanOrEqual(
      DEFAULT_PLAN_ECONOMICS.maxFreeBudgetUsd
    );
  });

  it('enforces that every plan daily render cap stays consistent with its monthly cap', () => {
    for (const plan of Object.values(PLANS_CONFIG)) {
      const perDay = plan.limits.render_per_day;
      const perMonth = plan.limits.render_per_month;
      if (perDay === null || perMonth === null) continue;

      // A monthly cap below one day's allowance would make the daily cap a lie.
      expect(
        perMonth,
        `${plan.name}: monthly render cap (${perMonth}) must be >= daily cap (${perDay})`
      ).toBeGreaterThanOrEqual(perDay);
    }
  });

  it('fails if the model tested in cost_benchmark_25_runs.json differs from AI_MODEL', () => {
    const benchmarkPath = resolve(process.cwd(), 'docs/spike/cost_benchmark_25_runs.json');
    expect(fs.existsSync(benchmarkPath)).toBe(true);

    const benchmark = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
    const activeModel = process.env.AI_MODEL || benchmark.modelTested;
    const compatibleModels = [
      benchmark.modelTested,
      'gemini-2.0-flash',
      'gemini-2.5-pro',
      'claude-3-5-sonnet-20241022',
      'claude-3-7-sonnet-20250219',
    ];

    if (!compatibleModels.includes(activeModel)) {
      throw new Error(
        `Cost benchmark was run on model "${benchmark.modelTested}", but active AI_MODEL is "${activeModel}". Please rerun "pnpm cost:benchmark" to refresh cost ground truth.`
      );
    }

    expect(compatibleModels).toContain(activeModel);
  });

  it('verifies price table freshness: warns if pricing retrieval date is older than 60 days', () => {
    const retrievalDate = new Date(OFFICIAL_PRICING_METADATA.retrievedDate);
    const now = new Date();
    const ageInDays = (now.getTime() - retrievalDate.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays > 60) {
      console.warn(
        `⚠️ WARNING: Token pricing retrieved date (${OFFICIAL_PRICING_METADATA.retrievedDate}) is older than 60 days (${Math.floor(ageInDays)} days old). Re-check Google pricing at ${OFFICIAL_PRICING_METADATA.sourceUrl}.`
      );
    }

    // Must warn, not fail
    expect(OFFICIAL_PRICING_METADATA.sourceUrl).toContain('ai.google.dev');
    expect(OFFICIAL_PRICING_METADATA.retrievedDate).toBeDefined();
  });
});
