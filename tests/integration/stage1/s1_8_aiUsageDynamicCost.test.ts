import { describe, it, expect, afterAll } from 'vitest';
import { QuotaService } from '@/services/quotaService';
import { computeAiCost } from '@/ai/pricing';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';

describe('S1-8: Dynamic AI tokens and computed cost persistence', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('records exact tokens and computed cost to ai_usage in database', async () => {
    const testUser = await createTestUser('user');
    const inputTokens = 1500;
    const outputTokens = 350;
    const expectedCost = computeAiCost(inputTokens, outputTokens);

    await QuotaService.recordAiUsage({
      userId: testUser.user.id,
      kind: 'generate',
      inputTokens,
      outputTokens,
      costUsd: expectedCost,
    });

    const { data: usageRows, error } = await admin
      .from('ai_usage')
      .select('kind, input_tokens, output_tokens, est_cost_usd')
      .eq('user_id', testUser.user.id)
      .eq('kind', 'generate');

    expect(error).toBeNull();
    expect(usageRows).toHaveLength(1);
    expect(usageRows![0]).toMatchObject({
      kind: 'generate',
      input_tokens: 1500,
      output_tokens: 350,
    });
    expect(Number(usageRows![0].est_cost_usd)).toBeCloseTo(expectedCost, 5);
  });
});
