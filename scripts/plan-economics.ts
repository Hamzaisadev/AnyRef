import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { calculatePlanEconomics, type PlanEconomicsResult, type EconomicsSummary } from '../src/lib/planEconomics';
import { DEFAULT_PLAN_ECONOMICS } from '../src/config/plans';

export { calculatePlanEconomics, type PlanEconomicsResult, type EconomicsSummary };

async function main() {
  const summary = await calculatePlanEconomics();

  console.log('=============================================================================');
  console.log(`Anyref Plan Economics & Unit Cost Analysis (Model: ${summary.modelName})`);
  console.log(`Cost Ground Truth: ${summary.costSource} (${summary.costSource === 'cost_benchmark_json' ? '25 verified spike runs' : 'Live database telemetry'})`);
  console.log('-----------------------------------------------------------------------------');
  console.log(`Per-Call Costs: generate=$${summary.costsPerCall.generate.toFixed(6)} | autofill=$${summary.costsPerCall.autofill.toFixed(6)} | brand_draft=$${summary.costsPerCall.brand_draft.toFixed(6)} | reuse=$0.000000`);
  console.log(`Fee Assumptions [A]: ${DEFAULT_PLAN_ECONOMICS.paymentFeePercent * 100}% + $${DEFAULT_PLAN_ECONOMICS.paymentFeeFixedUsd.toFixed(2)} fixed | Typical Usage [A]: ${DEFAULT_PLAN_ECONOMICS.typicalUtilizationRatio * 100}%`);
  console.log('=============================================================================');

  console.log(
    '| Plan    | Price/Mo | Net Rev | Worst Quota AI | Budget Cap AI | Worst Margin | Typical AI | Typical Margin |'
  );
  console.log(
    '|---------|----------|---------|----------------|---------------|--------------|------------|----------------|'
  );

  for (const p of summary.plans) {
    const pad = (s: string | number, n: number) => String(s).padEnd(n);
    console.log(
      `| ${pad(p.name, 7)} | ${pad('$' + p.priceMonth.toFixed(2), 8)} | ${pad('$' + p.netRevenueAfterFees.toFixed(2), 7)} | ${pad('$' + p.worstCaseDailyQuotaAiCost.toFixed(2), 14)} | ${pad('$' + p.budgetCappedAiCost.toFixed(2), 13)} | ${pad((p.worstCaseMargin * 100).toFixed(1) + '%', 12)} | ${pad('$' + p.typicalAiCost.toFixed(2), 10)} | ${pad((p.typicalCaseMargin * 100).toFixed(1) + '%', 14)} |`
    );
  }

  console.log('=============================================================================');
  console.log(`Free Tier Maximum Spend Exposure (per user/mo): $${summary.freeTierWorstCaseExposure.toFixed(2)}`);
  console.log('=============================================================================\n');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Plan economics calculation failed:', err);
    process.exit(1);
  });
}
