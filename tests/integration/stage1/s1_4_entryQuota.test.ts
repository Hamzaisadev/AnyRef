import { describe, it, expect, afterAll } from 'vitest';
import { EntryService, entryService } from '@/services/entryService';
import { SupabaseEntryRepo } from '@/data/entryRepo';
import { SupabaseBrandRepo } from '@/data/brandRepo';
import { QuotaService } from '@/services/quotaService';
import { QuotaExceededError } from '@/lib/errors';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';

describe('S1-4: checkEntryQuota enforcement and DB trigger limits', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('enforces DB trigger for max_brands on brands table', async () => {
    const testUser = await createTestUser('user');
    const client = testUser.client;

    // Free tier max_brands = 2
    // 1. Create brand 1
    const { error: b1Err } = await client.from('brands').insert({
      user_id: testUser.user.id,
      name: 'Brand Alpha',
      colors: [],
      default_values: {},
    });
    expect(b1Err).toBeNull();

    // 2. Create brand 2
    const { error: b2Err } = await client.from('brands').insert({
      user_id: testUser.user.id,
      name: 'Brand Beta',
      colors: [],
      default_values: {},
    });
    expect(b2Err).toBeNull();

    // 3. Create brand 3 -> DB trigger brands_limit must raise LIMIT_MAX_BRANDS
    const { error: b3Err } = await client.from('brands').insert({
      user_id: testUser.user.id,
      name: 'Brand Gamma',
      colors: [],
      default_values: {},
    });
    expect(b3Err).not.toBeNull();
    expect(b3Err?.message).toContain('LIMIT_MAX_BRANDS');
  });

  it('enforces checkEntryQuota in entryService.createEntry', async () => {
    const testUser = await createTestUser('user');
    const admin = adminClient();

    // Create a brand for this user
    const { data: brand, error: bErr } = await admin
      .from('brands')
      .insert({
        user_id: testUser.user.id,
        name: 'Brand For Entries',
        colors: [],
        default_values: {},
      })
      .select()
      .single();

    expect(bErr).toBeNull();
    expect(brand).toBeDefined();

    // Set a quota override for this user with max_entries = 1
    await admin.from('quota_overrides').insert({
      user_id: testUser.user.id,
      limits: { max_entries: 1 },
      reason: 'Testing entry quota boundary',
      set_by: testUser.user.id, // For test setup
    });

    const validEntry = {
      brand_id: brand!.id,
      prompt_template: 'A poster for {{product}} with clean light',
      slots: [
        {
          key: 'product',
          label: 'Product',
          type: 'short_text',
          source: 'user',
          required: true,
          brand_field: null,
          optional_block: false,
          never_invent: false,
        },
      ],
    };

    const userEntryService = new EntryService(
      new SupabaseEntryRepo(() => testUser.client),
      new SupabaseBrandRepo(() => testUser.client)
    );

    // 1. First entry must succeed
    const created = await userEntryService.createEntry(testUser.user.id, validEntry);
    expect(created.id).toBeDefined();

    // 2. Second entry must throw QuotaExceededError because max_entries (1) is reached
    await expect(
      userEntryService.createEntry(testUser.user.id, validEntry)
    ).rejects.toThrow(QuotaExceededError);
  });
});
