import { describe, it, expect, afterAll } from 'vitest';
import { QuotaService } from '@/services/quotaService';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';

describe('S1-1: QuotaService.recordAiUsage database alignment', () => {
  afterAll(async () => {
    await resetDb();
  });

  it('successfully inserts ai_usage record into real database and does not swallow errors', async () => {
    const testUser = await createTestUser('user');
    const admin = adminClient();

    // Call recordAiUsage
    await QuotaService.recordAiUsage({
      userId: testUser.user.id,
      kind: 'generate',
      inputTokens: 150,
      outputTokens: 50,
      costUsd: 0.0025,
    });

    // Check that ai_usage row actually exists in the database
    const { data, error } = await admin
      .from('ai_usage')
      .select('*')
      .eq('user_id', testUser.user.id);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    const row = data?.[0];
    expect(row).toBeDefined();
    expect(row?.kind).toBe('generate');
    expect(row?.input_tokens).toBe(150);
    expect(row?.output_tokens).toBe(50);
    expect(Number(row?.est_cost_usd)).toBeCloseTo(0.0025);
  });

  it('throws an error and does not swallow failures when insert fails', async () => {
    // Non-existent user UUID violates auth.users foreign key
    const nonExistentUserId = '00000000-0000-0000-0000-000000000000';

    await expect(
      QuotaService.recordAiUsage({
        userId: nonExistentUserId,
        kind: 'generate',
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
        requestId: 'req-test-fail-1',
      })
    ).rejects.toThrow(/Failed to record AI telemetry/i);
  });
});
