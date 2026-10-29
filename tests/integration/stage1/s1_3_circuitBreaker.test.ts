import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { QuotaService } from '@/services/quotaService';
import { ForbiddenError } from '@/lib/errors';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';

describe('S1-3: QuotaService.checkCircuitBreaker column and kill switch enforcement', () => {
  const admin = adminClient();

  beforeEach(async () => {
    // Reset circuit breaker settings in app_settings
    await admin.from('app_settings').upsert([
      { key: 'ai_kill_switch', value: false },
      { key: 'global_daily_cost_cap_usd', value: 1.0 }, // Set low threshold ($1.00) for testing
    ]);
  });

  afterAll(async () => {
    // Restore default cap
    await admin.from('app_settings').upsert([
      { key: 'ai_kill_switch', value: false },
      { key: 'global_daily_cost_cap_usd', value: 50.0 },
    ]);
    await resetDb();
  });

  it('queries est_cost_usd accurately and trips kill switch when cumulative cost exceeds cap', async () => {
    const testUser = await createTestUser('user');
    const actor = { id: testUser.user.id, role: 'user' as const, status: 'active' as const };

    // Before exceeding cap, checkCircuitBreaker passes
    await expect(QuotaService.checkCircuitBreaker(actor)).resolves.toBeUndefined();

    // Insert AI usage with est_cost_usd exceeding the $1.00 threshold ($1.50)
    await QuotaService.recordAiUsage({
      userId: testUser.user.id,
      kind: 'generate',
      inputTokens: 50000,
      outputTokens: 25000,
      costUsd: 1.5,
    });

    // checkCircuitBreaker must calculate cumulative cost from est_cost_usd and throw ForbiddenError
    await expect(QuotaService.checkCircuitBreaker(actor)).rejects.toThrow(ForbiddenError);

    // Verify ai_kill_switch was flipped to true in app_settings
    const { data: setting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'ai_kill_switch')
      .single();

    expect(setting?.value).toBe(true);

    // Owner test runs are permitted even during active kill switch
    const ownerActor = { id: 'owner-test-id', role: 'owner' as const, status: 'active' as const };
    await expect(QuotaService.checkCircuitBreaker(ownerActor)).resolves.toBeUndefined();
  });
});
