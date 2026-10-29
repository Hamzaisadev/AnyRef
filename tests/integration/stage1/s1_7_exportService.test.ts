import { describe, it, expect, afterAll } from 'vitest';
import { exportUserData } from '@/services/exportService';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';
import { TooManyRequestsError } from '@/lib/errors';

describe('S1-7: Export service matches schema and respects rate limit & user isolation', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('exports user data matching real schema and fails on un-fixed non-existent columns', async () => {
    const testUser = await createTestUser('user');

    // Create a brand for testUser
    const { data: brand, error: brandErr } = await admin
      .from('brands')
      .insert({
        user_id: testUser.user.id,
        name: 'Export Test Brand',
        what_you_sell: 'Watches',
        why: 'Precision',
        tone: 'Luxury',
        colors: ['#000000', '#ffffff'],
        wordmark: 'Chrono',
        slogan: 'Timeless luxury',
        never_do_rules: 'No cheap discounts',
        default_values: { style: 'classic' },
      })
      .select()
      .single();

    expect(brandErr).toBeNull();

    // Create an entry for testUser
    const { data: entry, error: entryErr } = await admin
      .from('entries')
      .insert({
        user_id: testUser.user.id,
        brand_id: brand!.id,
        prompt_template: 'A luxury watch advert for {{brand}}',
        reference_path: 'uploads/ref-1.jpg',
        slots: [],
        status: 'winner',
        poster_type: 'horizontal',
        intended_product_shape: 'square',
        note: 'High priority',
      })
      .select()
      .single();

    expect(entryErr).toBeNull();

    // Call exportUserData
    const exportResult = await exportUserData(testUser.user.id, { client: testUser.client });

    expect(exportResult.user.id).toBe(testUser.user.id);
    expect(exportResult.brands).toHaveLength(1);
    expect(exportResult.brands[0]).toMatchObject({
      id: brand!.id,
      name: 'Export Test Brand',
      what_you_sell: 'Watches',
      colors: ['#000000', '#ffffff'],
    });

    expect(exportResult.entries).toHaveLength(1);
    expect(exportResult.entries[0]).toMatchObject({
      id: entry!.id,
      prompt_template: 'A luxury watch advert for {{brand}}',
      reference_path: 'uploads/ref-1.jpg',
    });

    // 2. Second export within 24h should throw TooManyRequestsError (429)
    await expect(
      exportUserData(testUser.user.id, { client: testUser.client })
    ).rejects.toThrow(TooManyRequestsError);
  });

  it('user A client cannot access user B data in export', async () => {
    const userA = await createTestUser('user');
    const userB = await createTestUser('user');

    // Seed User B brand
    await admin.from('brands').insert({
      user_id: userB.user.id,
      name: 'User B Private Brand',
      colors: [],
      default_values: {},
    });

    // User A attempts to export using User A client for User B ID
    // RLS on brands/entries will return empty for User B's rows when queried with User A's token
    const result = await exportUserData(userB.user.id, { client: userA.client });
    expect(result.brands).toHaveLength(0);
    expect(result.entries).toHaveLength(0);
  });
});
