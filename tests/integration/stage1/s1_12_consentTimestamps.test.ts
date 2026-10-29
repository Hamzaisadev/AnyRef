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
});
