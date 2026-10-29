import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, createTestUser, resetDb, asUser } from '../helpers/dbHarness';
import { assetService } from '@/services/assetService';

describe('S2-3: Authenticated asset route with ownership verification and signed URL generation', () => {
  afterAll(async () => {
    await resetDb();
  });

  it('allows owner to access their assets and blocks unauthorized cross-user access with 403', async () => {
    const userA = await createTestUser('user');
    const userB = await createTestUser('user');

    // 1. Upload a valid test image for User A
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const upload = await assetService.uploadImage(
      userA.user.id,
      'references',
      validPngBuffer,
      'image/png'
    );

    // upload.path is `${userA.user.id}/${filename}`
    const filename = upload.path.split('/')[1]!;
    expect(filename).toBeDefined();

    // Import the asset route handler directly
    const { GET } = await import('@/app/api/assets/[...path]/route');

    // 2. User A accesses their own asset with JSON request
    const reqA = new Request(`http://localhost:3000/api/assets/references/${userA.user.id}/${filename}?json=true`, {
      headers: {
        Authorization: `Bearer ${userA.token}`,
      },
    });

    const resA = await GET(reqA as any, {
      params: Promise.resolve({ path: ['references', userA.user.id, filename] }),
    });

    expect(resA.status).toBe(200);
    const bodyA = await resA.json();
    expect(bodyA.signed_url).toBeDefined();
    expect(bodyA.signed_url).toContain('https://');

    // 3. User B attempts to access User A's asset -> Must return 403 Forbidden
    const reqB = new Request(`http://localhost:3000/api/assets/references/${userA.user.id}/${filename}?json=true`, {
      headers: {
        Authorization: `Bearer ${userB.token}`,
      },
    });

    const resB = await GET(reqB as any, {
      params: Promise.resolve({ path: ['references', userA.user.id, filename] }),
    });

    expect(resB.status).toBe(403);
    const bodyB = await resB.json();
    expect(bodyB.error?.code).toBe('FORBIDDEN');

    // 4. User A requests non-existent file -> 404
    const reqNotFound = new Request(`http://localhost:3000/api/assets/references/${userA.user.id}/missing-${filename}?json=true`, {
      headers: {
        Authorization: `Bearer ${userA.token}`,
      },
    });

    const resNotFound = await GET(reqNotFound as any, {
      params: Promise.resolve({ path: ['references', userA.user.id, `missing-${filename}`] }),
    });

    expect(resNotFound.status).toBe(404);

    // 5. Invalid bucket -> 400
    const reqBadBucket = new Request(`http://localhost:3000/api/assets/invalid-bucket/${userA.user.id}/${filename}`, {
      headers: {
        Authorization: `Bearer ${userA.token}`,
      },
    });

    const resBadBucket = await GET(reqBadBucket as any, {
      params: Promise.resolve({ path: ['invalid-bucket', userA.user.id, filename] }),
    });

    expect(resBadBucket.status).toBe(400);
  });
});
