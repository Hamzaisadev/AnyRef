import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';
import { GET as getAccount, DELETE as deleteAccount, POST as cancelDeletion } from '@/app/api/account/route';
import { GET as exportAccount } from '@/app/api/account/export/route';
import { NextRequest } from 'next/server';

describe('S2-14: Settings & Account Management API', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('GET /api/account returns user profile and deletion status when authenticated', async () => {
    const testUser = await createTestUser('user');
    const req = new NextRequest('http://localhost:3000/api/account', {
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    const res = await getAccount(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.profile).toBeDefined();
    expect(data.profile.email).toBe(testUser.user.email);
    expect(data.profile.role).toBe('user');
    expect(data.deletionStatus).toBeDefined();
    expect(data.deletionStatus.isPendingDeletion).toBe(false);
  });

  it('DELETE /api/account schedules deletion with 14-day grace period', async () => {
    const testUser = await createTestUser('user');
    const req = new NextRequest('http://localhost:3000/api/account', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    const res = await deleteAccount(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.deletionStatus.isPendingDeletion).toBe(true);
    expect(data.deletionStatus.daysRemaining).toBe(14);
    expect(data.deletionStatus.deletionRequestedAt).toBeDefined();

    // Verify profile in database
    const { data: profile } = await admin
      .from('profiles')
      .select('status, deletion_requested_at')
      .eq('user_id', testUser.user.id)
      .single();

    expect(profile?.status).toBe('pending_deletion');
    expect(profile?.deletion_requested_at).toBeDefined();
  });

  it('POST /api/account with action=cancel restores account to active', async () => {
    const testUser = await createTestUser('user');

    // First request deletion
    const delReq = new NextRequest('http://localhost:3000/api/account', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });
    await deleteAccount(delReq);

    // Now cancel
    const cancelReq = new NextRequest('http://localhost:3000/api/account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'cancel' }),
    });

    const res = await cancelDeletion(cancelReq);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.deletionStatus.isPendingDeletion).toBe(false);
    expect(data.deletionStatus.daysRemaining).toBeNull();

    // Verify profile in database is active again
    const { data: profile } = await admin
      .from('profiles')
      .select('status, deletion_requested_at')
      .eq('user_id', testUser.user.id)
      .single();

    expect(profile?.status).toBe('active');
    expect(profile?.deletion_requested_at).toBeNull();
  });

  it('GET /api/account/export works with Bearer token authentication', async () => {
    const testUser = await createTestUser('user');
    const req = new NextRequest('http://localhost:3000/api/account/export', {
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    const res = await exportAccount(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('content-disposition')).toContain('attachment; filename=');

    const json = await res.json();
    expect(json.user.id).toBe(testUser.user.id);
  });
});
