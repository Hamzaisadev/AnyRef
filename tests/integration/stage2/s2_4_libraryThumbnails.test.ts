import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';
import { EntryService } from '@/services/entryService';
import { SupabaseEntryRepo } from '@/data/entryRepo';
import { SupabaseBrandRepo } from '@/data/brandRepo';

describe('S2-4 & S2-6: Library filtering by activeBrandId and thumbnail persistence', () => {
  afterAll(async () => {
    await resetDb();
  });

  it('filters entries by brand_id and preserves reference and result thumbnail paths', async () => {
    const testUser = await createTestUser('user');
    const admin = adminClient();

    // 1. Create two distinct brands for testUser
    const { data: brand1 } = await admin
      .from('brands')
      .insert({
        user_id: testUser.user.id,
        name: 'Brand Alpha',
        colors: ['#000000'],
        default_values: {},
      })
      .select()
      .single();

    const { data: brand2 } = await admin
      .from('brands')
      .insert({
        user_id: testUser.user.id,
        name: 'Brand Beta',
        colors: ['#ffffff'],
        default_values: {},
      })
      .select()
      .single();

    const userEntryService = new EntryService(
      new SupabaseEntryRepo(() => testUser.client),
      new SupabaseBrandRepo(() => testUser.client)
    );

    // 2. Create entries for both brands
    const refPath = `/api/assets/references/${testUser.user.id}/ref-alpha.png`;
    const resultPath = `/api/assets/results/${testUser.user.id}/res-alpha.png`;

    const entry1 = await userEntryService.createEntry(testUser.user.id, {
      brand_id: brand1!.id,
      prompt_template: 'Alpha sale poster with full visual comparison',
      slots: [],
      reference_path: refPath,
      result_path: resultPath,
      status: 'winner',
      note: 'Alpha Winner',
    });

    const entry2 = await userEntryService.createEntry(testUser.user.id, {
      brand_id: brand2!.id,
      prompt_template: 'Beta announcement poster text only',
      slots: [],
      status: 'draft',
      note: 'Beta Draft',
    });

    const { GET: listHandler } = await import('@/app/api/entries/route');

    // 3. Query filtered by Brand Alpha
    const reqAlpha = new Request(`http://localhost:3000/api/entries?brand_id=${brand1!.id}`, {
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    const resAlpha = await listHandler(reqAlpha as any);
    expect(resAlpha.status).toBe(200);
    const bodyAlpha = await resAlpha.json();

    expect(bodyAlpha.entries).toHaveLength(1);
    expect(bodyAlpha.entries[0].id).toBe(entry1.id);
    expect(bodyAlpha.entries[0].reference_path).toBe(refPath);
    expect(bodyAlpha.entries[0].result_path).toBe(resultPath);

    // 4. Query filtered by Brand Beta
    const reqBeta = new Request(`http://localhost:3000/api/entries?brand_id=${brand2!.id}`, {
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    const resBeta = await listHandler(reqBeta as any);
    expect(resBeta.status).toBe(200);
    const bodyBeta = await resBeta.json();

    expect(bodyBeta.entries).toHaveLength(1);
    expect(bodyBeta.entries[0].id).toBe(entry2.id);
    expect(bodyBeta.entries[0].reference_path).toBeNull();
    expect(bodyBeta.entries[0].result_path).toBeNull();
  });
});
