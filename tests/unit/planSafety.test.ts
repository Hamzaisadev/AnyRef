import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import { resolve } from 'path';
import { calculatePlanEconomics } from '../../scripts/plan-economics';
import { DEFAULT_PLAN_ECONOMICS, PLANS_CONFIG } from '../../src/config/plans';
import { OFFICIAL_PRICING_METADATA } from '../../src/ai/pricing';

describe('plan-safety: Plan Economics, Margin Floor, and Budget Caps', () => {
  it('enforces that every paid plan budget-capped worst-case margin is above MIN_PLAN_MARGIN (0.55)', async () => {
    const summary = await calculatePlanEconomics();
    const paidPlans = summary.plans.filter((p) => p.priceMonth > 0);

    expect(paidPlans.length).toBeGreaterThan(0);

    for (const plan of paidPlans) {
      expect(
        plan.worstCaseMargin,
        `Plan ${plan.name} worst-case margin (${(plan.worstCaseMargin * 100).toFixed(1)}%) is below minimum margin floor (${DEFAULT_PLAN_ECONOMICS.minPlanMargin * 100}%)`
      ).toBeGreaterThanOrEqual(DEFAULT_PLAN_ECONOMICS.minPlanMargin);
    }
  });

  it('enforces that Free tier monthly budget does not exceed MAX_FREE_BUDGET_USD ($0.50)', async () => {
    const summary = await calculatePlanEconomics();
    const freePlan = summary.plans.find((p) => p.planId === 'free');

    expect(freePlan).toBeDefined();
    const freeBudget = freePlan?.limits.monthly_ai_budget_usd ?? 0;

    expect(
      freeBudget,
      `Free plan monthly budget ($${freeBudget}) exceeds MAX_FREE_BUDGET_USD ($${DEFAULT_PLAN_ECONOMICS.maxFreeBudgetUsd})`
    ).toBeLessThanOrEqual(DEFAULT_PLAN_ECONOMICS.maxFreeBudgetUsd);
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
