import { describe, it, expect, afterAll } from 'vitest';
import { createTestUser, resetDb } from '../helpers/dbHarness';

describe('S2-8: Brand edit, delete, logo upload, and default_values management', () => {
  afterAll(async () => {
    await resetDb();
  });

  it('supports full lifecycle of brand editing, logo upload, default_values, and deletion with dependent-entry awareness', async () => {
    const testUser = await createTestUser('user');

    // 1. Upload logo to /api/upload
    const { POST: uploadHandler } = await import('@/app/api/upload/route');
    const fakeLogoContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
    const logoFile = new File([fakeLogoContent], 'brand-logo.png', { type: 'image/png' });

    const uploadFormData = new FormData();
    uploadFormData.append('file', logoFile);
    uploadFormData.append('bucket', 'logos');

    const uploadReq = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
      body: uploadFormData,
    });

    const uploadRes = await uploadHandler(uploadReq as any);
    expect(uploadRes.status).toBe(201);
    const uploadData = await uploadRes.json();
    const logoAssetPath = uploadData.path.startsWith('/api/assets/')
      ? uploadData.path
      : `/api/assets/logos/${uploadData.path}`;
    expect(logoAssetPath).toMatch(/^\/api\/assets\/logos\//);

    // 2. Create brand with raw storage path (as returned by /api/upload) and verify consistent normalization to /api/assets/logos/...
    const { POST: createBrandHandler } = await import('@/app/api/brands/route');
    const createReq = new Request('http://localhost:3000/api/brands', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Nexus Dynamics',
        what_you_sell: 'Next-gen robotics',
        why: 'Accelerate autonomy',
        tone: 'Precise and visionary',
        colors: ['#0F1020', '#3B82F6'],
        wordmark: 'NEXUS',
        slogan: 'Precision in Motion',
        footer_text: '© 2026 Nexus Dynamics',
        never_do_rules: 'Never use blurry graphics',
        logo_path: uploadData.path,
        default_values: {
          headline: 'Intelligent Robotics',
          cta_button: 'Explore Hardware',
        },
      }),
    });

    const createRes = await createBrandHandler(createReq as any);
    expect(createRes.status).toBe(201);
    const { brand: createdBrand } = await createRes.json();
    expect(createdBrand.id).toBeDefined();
    expect(createdBrand.logo_path).toBe(logoAssetPath);
    expect(createdBrand.default_values).toEqual({
      headline: 'Intelligent Robotics',
      cta_button: 'Explore Hardware',
    });

    // 3. Update brand (edit name, colors, default_values) via PATCH /api/brands/[id]
    const { PATCH: updateBrandHandler, GET: getBrandHandler, DELETE: deleteBrandHandler } = await import('@/app/api/brands/[id]/route');
    const patchReq = new Request(`http://localhost:3000/api/brands/${createdBrand.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Nexus Dynamics Rebranded',
        colors: ['#000000', '#10B981', '#F59E0B'],
        default_values: {
          headline: 'Autonomous Systems Redefined',
          cta_button: 'Deploy Now',
          announcement: 'Version 2.0 Live',
        },
      }),
    });

    const patchRes = await updateBrandHandler(patchReq as any, {
      params: Promise.resolve({ id: createdBrand.id }),
    });
    expect(patchRes.status).toBe(200);
    const { brand: updatedBrand } = await patchRes.json();
    expect(updatedBrand.name).toBe('Nexus Dynamics Rebranded');
    expect(updatedBrand.colors).toEqual(['#000000', '#10B981', '#F59E0B']);
    expect(updatedBrand.default_values).toEqual({
      headline: 'Autonomous Systems Redefined',
      cta_button: 'Deploy Now',
      announcement: 'Version 2.0 Live',
    });
    // logo_path remains unchanged
    expect(updatedBrand.logo_path).toBe(logoAssetPath);

    // 4. Verify GET returns updated data
    const getReq = new Request(`http://localhost:3000/api/brands/${createdBrand.id}`, {
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });
    const getRes = await getBrandHandler(getReq as any, {
      params: Promise.resolve({ id: createdBrand.id }),
    });
    expect(getRes.status).toBe(200);
    const { brand: fetchedBrand } = await getRes.json();
    expect(fetchedBrand.name).toBe('Nexus Dynamics Rebranded');

    // 5. Create a dependent entry under this brand
    const { POST: createEntryHandler } = await import('@/app/api/entries/route');
    const entryReq = new Request('http://localhost:3000/api/entries', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand_id: createdBrand.id,
        prompt_template: 'Poster for {{headline}}',
        slots: [
          {
            key: 'headline',
            label: 'Headline',
            type: 'short_text',
            required: true,
            optional_block: false,
            brand_field: null,
          },
        ],
        status: 'draft',
        note: 'Dependent entry test',
      }),
    });

    const entryRes = await createEntryHandler(entryReq as any);
    expect(entryRes.status).toBe(201);

    // 6. Check dependent entries count
    const { GET: listEntriesHandler } = await import('@/app/api/entries/route');
    const listEntriesReq = new Request(`http://localhost:3000/api/entries?brand_id=${createdBrand.id}`, {
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });
    const listEntriesRes = await listEntriesHandler(listEntriesReq as any);
    const entriesData = await listEntriesRes.json();
    expect(entriesData.entries).toHaveLength(1);

    // 7. Delete brand via DELETE /api/brands/[id]
    const deleteReq = new Request(`http://localhost:3000/api/brands/${createdBrand.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });
    const deleteRes = await deleteBrandHandler(deleteReq as any, {
      params: Promise.resolve({ id: createdBrand.id }),
    });
    expect(deleteRes.status).toBe(200);

    // 8. Verify GET returns 404
    const getDeletedRes = await getBrandHandler(getReq as any, {
      params: Promise.resolve({ id: createdBrand.id }),
    });
    expect(getDeletedRes.status).toBe(404);
  });
});
