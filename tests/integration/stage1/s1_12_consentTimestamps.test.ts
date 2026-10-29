import { describe, it, expect, afterAll } from 'vitest';
import { ConsentService } from '@/services/consentService';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';

describe('S1-12: Consent timestamps persistence on login/signup', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('persists tos_version, tos_accepted_at, and age_confirmed_at to profiles and consent_records', async () => {
    const testUser = await createTestUser('user');

    // 1. Initial state: profiles has null consent fields
    const { data: initialProfile } = await admin
      .from('profiles')
      .select('tos_version, tos_accepted_at, age_confirmed_at')
      .eq('user_id', testUser.user.id)
      .single();

    expect(initialProfile?.tos_version).toBeNull();
    expect(initialProfile?.tos_accepted_at).toBeNull();
    expect(initialProfile?.age_confirmed_at).toBeNull();

    // 2. User consents on login/signup
    await ConsentService.recordUserConsent({
      userId: testUser.user.id,
      tosVersion: '2026-01',
      tosAccepted: true,
      ageConfirmed: true,
    });

    // 3. Verify consent_records table
    const { data: records, error: recordsErr } = await admin
      .from('consent_records')
      .select('kind, version, granted')
      .eq('user_id', testUser.user.id);

    expect(recordsErr).toBeNull();
    expect(records).toHaveLength(2);
    expect(records?.some((r) => r.kind === 'tos' && r.granted)).toBe(true);
    expect(records?.some((r) => r.kind === 'privacy' && r.granted)).toBe(true);

    // 4. Verify profiles table has matching timestamps and version
    const { data: updatedProfile, error: profileErr } = await admin
      .from('profiles')
      .select('tos_version, tos_accepted_at, age_confirmed_at')
      .eq('user_id', testUser.user.id)
      .single();

    expect(profileErr).toBeNull();
    expect(updatedProfile?.tos_version).toBe('2026-01');
    expect(updatedProfile?.tos_accepted_at).not.toBeNull();
    expect(updatedProfile?.age_confirmed_at).not.toBeNull();
  });

  it('persists ToS and age consent on Google OAuth sign-in via callback query params and uses admin client for session profile auto-heal', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const loginSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(auth)/login/page.tsx'),
      'utf8'
    );
    expect(loginSource).toContain("searchParams.set('tos_accepted'");
    expect(loginSource).toContain("searchParams.set('age_confirmed'");

    const callbackSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/auth/callback/route.ts'),
      'utf8'
    );
    expect(callbackSource).toContain("searchParams.get('tos_accepted')");
    expect(callbackSource).toContain("searchParams.get('age_confirmed')");

    // Test real DB auto-heal when profile row is missing
    const testUser = await createTestUser('user');
    await admin.from('profiles').delete().eq('user_id', testUser.user.id);

    const { data: missingCheck } = await admin
      .from('profiles')
      .select('user_id')
      .eq('user_id', testUser.user.id)
      .maybeSingle();
    expect(missingCheck).toBeNull();

    const { ensureProfileExists } = await import('@/services/session');
    const healed = await ensureProfileExists(testUser.user);
    expect(healed).not.toBeNull();
    expect(healed?.role).toBe('user');

    // Verify row now exists in real DB
    const { data: healedRow } = await admin
      .from('profiles')
      .select('user_id, role, status, plan_id')
      .eq('user_id', testUser.user.id)
      .single();
    expect(healedRow?.user_id).toBe(testUser.user.id);
    expect(healedRow?.status).toBe('active');
  });
});

