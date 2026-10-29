import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';
import { EntryService } from '@/services/entryService';
import { SupabaseEntryRepo } from '@/data/entryRepo';
import { SupabaseBrandRepo } from '@/data/brandRepo';

describe('S2-2: Result image upload and result_path persistence on compare/save', () => {
  afterAll(async () => {
    await resetDb();
  });

  it('uploads pasted/selected result image to results bucket and updates entry with result_path and winner status', async () => {
    const testUser = await createTestUser('user');
    const admin = adminClient();

    // 1. Create a test brand and entry
    const { data: brand } = await admin
      .from('brands')
      .insert({
        user_id: testUser.user.id,
        name: 'Result Upload Test Brand',
        colors: ['#123456'],
        default_values: {},
      })
      .select()
      .single();

    const userEntryService = new EntryService(
      new SupabaseEntryRepo(() => testUser.client),
      new SupabaseBrandRepo(() => testUser.client)
    );

    const initialEntry = await userEntryService.createEntry(testUser.user.id, {
      brand_id: brand!.id,
      prompt_template: 'A poster with winner result',
      slots: [],
      status: 'draft',
      note: 'Initial draft before comparison',
    });

    expect(initialEntry.result_path).toBeNull();

    // 2. Upload result image via POST /api/upload
    const { POST: uploadHandler } = await import('@/app/api/upload/route');

    const validPngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const formData = new FormData();
    const blob = new Blob([validPngBytes], { type: 'image/png' });
    formData.append('file', blob, 'result-render.png');
    formData.append('bucket', 'results');

    const uploadReq = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
      body: formData,
    });

    const uploadRes = await uploadHandler(uploadReq as any);
    expect(uploadRes.status).toBe(201);
    const uploadBody = await uploadRes.json();
    expect(uploadBody.path).toBeDefined();

    const resultAssetPath = `/api/assets/results/${uploadBody.path}`;

    // 3. Update entry via PATCH /api/entries/[id]
    const { PATCH: updateHandler } = await import('@/app/api/entries/[id]/route');

    const patchReq = new Request(`http://localhost:3000/api/entries/${initialEntry.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.token}`,
      },
      body: JSON.stringify({
        status: 'winner',
        note: 'High converting ad test winner',
        result_path: resultAssetPath,
      }),
    });

    const patchRes = await updateHandler(patchReq as any, {
      params: Promise.resolve({ id: initialEntry.id }),
    });

    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.entry.status).toBe('winner');
    expect(patchBody.entry.result_path).toBe(resultAssetPath);

    // 4. Verify in Supabase database directly
    const { data: dbEntry, error: fetchErr } = await admin
      .from('entries')
      .select('status, result_path, note')
      .eq('id', initialEntry.id)
      .single();

    expect(fetchErr).toBeNull();
    expect(dbEntry?.status).toBe('winner');
    expect(dbEntry?.result_path).toBe(resultAssetPath);
    expect(dbEntry?.note).toBe('High converting ad test winner');
  });
});
