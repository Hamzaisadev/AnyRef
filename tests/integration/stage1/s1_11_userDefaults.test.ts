import { describe, it, expect, afterAll } from 'vitest';
import { ensureUserSeeded } from '@/services/accountService';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';

describe('S1-11: Default sample brand and starter entries seeding', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('seeds a default sample brand and two starter entries for new user idempotently', async () => {
    const testUser = await createTestUser('user');

    // 1. Initial state: ensureUserSeeded provisions defaults
    await ensureUserSeeded(testUser.user.id);

    // 2. Verify brand created
    const { data: brands, error: brandErr } = await admin
      .from('brands')
      .select('*')
      .eq('user_id', testUser.user.id);

    expect(brandErr).toBeNull();
    expect(brands).toHaveLength(1);
    const sampleBrand = brands![0];
    expect(sampleBrand).toBeDefined();
    if (!sampleBrand) throw new Error('sampleBrand missing');
    expect(sampleBrand.name).toBe('Acme Sample Brand');
    expect(sampleBrand.what_you_sell).toContain('drinkware');
    expect(sampleBrand.colors).toContain('#0EA5E9');

    // 3. Verify entries created and reference brand
    const { data: entries, error: entryErr } = await admin
      .from('entries')
      .select('*')
      .eq('user_id', testUser.user.id)
      .order('poster_type', { ascending: true });

    expect(entryErr).toBeNull();
    expect(entries).toHaveLength(2);

    const festiveEntry = entries?.find((e) => e.poster_type === 'festive');
    const launchEntry = entries?.find((e) => e.poster_type === 'launch');

    expect(festiveEntry).toBeDefined();
    expect(festiveEntry?.brand_id).toBe(sampleBrand.id);
    expect(festiveEntry?.note).toContain('Sample');

    expect(launchEntry).toBeDefined();
    expect(launchEntry?.brand_id).toBe(sampleBrand.id);
    expect(launchEntry?.note).toContain('Sample');

    // 4. Verify idempotency
    await ensureUserSeeded(testUser.user.id);

    const { data: brandsAfter } = await admin
      .from('brands')
      .select('id')
      .eq('user_id', testUser.user.id);
    expect(brandsAfter).toHaveLength(1);

    const { data: entriesAfter } = await admin
      .from('entries')
      .select('id')
      .eq('user_id', testUser.user.id);
    expect(entriesAfter).toHaveLength(2);
  });
});
