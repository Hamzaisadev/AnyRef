import { describe, it, expect, afterAll } from 'vitest';
import { QuotaService } from '@/services/quotaService';
import { QuotaExceededError } from '@/lib/errors';
import { createTestUser, resetDb } from '../helpers/dbHarness';

describe('S1-2: checkDailyQuota distinct counters per kind', () => {
  afterAll(async () => {
    await resetDb();
  });

  it('free user blocked after daily limit for generate is still allowed autofill', async () => {
    const testUser = await createTestUser('user');
    const userId = testUser.user.id;

    // Record 5 generate calls (hitting Free plan generate_per_day = 5)
    for (let i = 0; i < 5; i++) {
      await QuotaService.recordAiUsage({
        userId,
        kind: 'generate',
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
      });
    }

    // 1. Generate quota must be exceeded
    await expect(
      QuotaService.checkDailyQuota(userId, 'generate_per_day')
    ).rejects.toThrow(QuotaExceededError);

    // 2. Autofill quota MUST be allowed (used = 0) because kinds are independent counters
    const autofillQuota = await QuotaService.checkDailyQuota(userId, 'autofill_per_day');
    expect(autofillQuota.allowed).toBe(true);
    expect(autofillQuota.used).toBe(0);
    expect(autofillQuota.remaining).toBe(5);
  });
});
