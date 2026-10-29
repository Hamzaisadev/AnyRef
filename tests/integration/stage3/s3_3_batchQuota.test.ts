import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';
import { QuotaService } from '@/services/quotaService';
import { autofillService } from '@/services/autofillService';
import { QuotaExceededError } from '@/lib/errors';

describe('S3-3: Batch autofill quota and limit enforcement', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('blocks free user from exceeding batch_max limit (batch_max = 1 on free plan)', async () => {
    const testUser = await createTestUser('user');

    // Free user has batch_max = 1
    // Calling checkBatchQuota with batchSize = 2 must throw QuotaExceededError
    await expect(
      QuotaService.checkBatchQuota(testUser.user.id, 2)
    ).rejects.toThrow(QuotaExceededError);

    // Calling with batchSize = 1 must be permitted
    await expect(
      QuotaService.checkBatchQuota(testUser.user.id, 1)
    ).resolves.toBeUndefined();
  });

  it('prevents daily autofill limit bypass via batch requests', async () => {
    const testUser = await createTestUser('user');

    // Free user has autofill_per_day = 5.
    // Insert 4 ai_usage records today
    const today = new Date().toISOString();
    for (let i = 0; i < 4; i++) {
      await admin.from('ai_usage').insert({
        user_id: testUser.user.id,
        kind: 'autofill',
        input_tokens: 100,
        output_tokens: 50,
        est_cost_usd: 0.001,
        created_at: today,
      });
    }

    // Now used is 4. Requesting a single autofill (1) should succeed: 4 + 1 <= 5
    const singleCheck = await QuotaService.checkDailyQuota(testUser.user.id, 'autofill_per_day', 1);
    expect(singleCheck.allowed).toBe(true);

    // Requesting a batch of 2 items must be rejected: 4 + 2 = 6 > 5
    await expect(
      QuotaService.checkDailyQuota(testUser.user.id, 'autofill_per_day', 2)
    ).rejects.toThrow(QuotaExceededError);
  });

  it('blocks batch autofill method when items exceed batch_max', async () => {
    const testUser = await createTestUser('user');

    const fakePng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
    ]);

    const batchItems = [
      {
        entryId: '00000000-0000-0000-0000-000000000001',
        imageBuffer: fakePng,
        mimeType: 'image/png',
      },
      {
        entryId: '00000000-0000-0000-0000-000000000002',
        imageBuffer: fakePng,
        mimeType: 'image/png',
      },
    ];

    // Free user calling autofillBatch with 2 items must reject with QuotaExceededError
    await expect(
      autofillService.autofillBatch(testUser.user.id, batchItems)
    ).rejects.toThrow(QuotaExceededError);
  });

  it('enforces checkEntryQuota per item in batch', async () => {
    const testUser = await createTestUser('user');

    // Override max_entries = 5 for this testUser
    await admin.from('quota_overrides').insert({
      user_id: testUser.user.id,
      limits: { max_entries: 5 },
      reason: 'Batch entry limit test',
      set_by: testUser.user.id,
    });

    // Create a brand
    const { data: brand } = await admin
      .from('brands')
      .insert({
        user_id: testUser.user.id,
        name: 'Batch Entry Brand',
        colors: [],
        default_values: {},
      })
      .select()
      .single();

    // Insert 4 existing entries (used = 4, limit = 5)
    for (let i = 0; i < 4; i++) {
      await admin.from('entries').insert({
        user_id: testUser.user.id,
        brand_id: brand!.id,
        prompt_template: `Template ${i}`,
        slots: [],
        status: 'draft',
        poster_type: 'horizontal',
        intended_product_shape: 'square',
      });
    }

    // Adding 1 entry is permitted (4 + 1 <= 5)
    await expect(
      QuotaService.checkEntryQuota(testUser.user.id, 1)
    ).resolves.toBeUndefined();

    // Adding a batch of 2 entries must be rejected (4 + 2 = 6 > 5)
    await expect(
      QuotaService.checkEntryQuota(testUser.user.id, 2)
    ).rejects.toThrow(QuotaExceededError);
  });
});
