import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';
import { entryService } from '@/services/entryService';

describe('S2-1: Reference image upload and persistence on entry save', () => {
  afterAll(async () => {
    await resetDb();
  });

  it('uploads reference image to references bucket and persists reference_path on entry', async () => {
    const testUser = await createTestUser('user');
    const admin = adminClient();

    // 1. Create a test brand
    const { data: brand, error: brandErr } = await admin
      .from('brands')
      .insert({
        user_id: testUser.user.id,
        name: 'Upload Test Brand',
        colors: ['#000000'],
        default_values: {},
      })
      .select()
      .single();

    expect(brandErr).toBeNull();
    expect(brand).toBeDefined();

    // 2. Perform upload via POST /api/upload
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
    formData.append('file', blob, 'ref-test.png');
    formData.append('bucket', 'references');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
      body: formData,
    });

    const uploadRes = await uploadHandler(req as any);
    expect(uploadRes.status).toBe(201);
    const uploadBody = await uploadRes.json();

    expect(uploadBody.path).toBeDefined();
    expect(uploadBody.path).toContain(testUser.user.id);

    // 3. Save entry with reference_path
    const { SupabaseEntryRepo } = await import('@/data/entryRepo');
    const { SupabaseBrandRepo } = await import('@/data/brandRepo');
    const { EntryService } = await import('@/services/entryService');

    const userEntryService = new EntryService(
      new SupabaseEntryRepo(() => testUser.client),
      new SupabaseBrandRepo(() => testUser.client)
    );

    const referenceAssetPath = `/api/assets/references/${uploadBody.path}`;
    const entry = await userEntryService.createEntry(testUser.user.id, {
      brand_id: brand!.id,
      prompt_template: 'A minimal sale poster for our luxury collection',
      slots: [],
      reference_path: referenceAssetPath,
      poster_type: 'sale',
      status: 'draft',
      note: 'Reference upload test',
    });

    expect(entry.id).toBeDefined();
    expect(entry.reference_path).toBe(referenceAssetPath);

    // 4. Verify entry in Supabase database has reference_path
    const { data: dbEntry, error: entryErr } = await admin
      .from('entries')
      .select('reference_path')
      .eq('id', entry.id)
      .single();

    expect(entryErr).toBeNull();
    expect(dbEntry?.reference_path).toBe(referenceAssetPath);
  });
});
