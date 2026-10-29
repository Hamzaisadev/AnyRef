import { describe, it, expect, afterAll } from 'vitest';
import { syncPlan } from '@/services/billingService';
import { logAuditEvent } from '@/data/auditRepo';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';

describe('S1-5: Service role client vs user client permissions boundary', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('user client is denied updating profiles or inserting audit_log, while admin client succeeds', async () => {
    const testUser = await createTestUser('user');
    const userClient = testUser.client;

    // 1. Regular user client attempts to update profiles.plan_id directly
    const { data: userUpdateData, error: userUpdateErr } = await userClient
      .from('profiles')
      .update({ plan_id: 'plus' })
      .eq('user_id', testUser.user.id)
      .select();

    // RLS policy prevents standard users from updating profiles: 0 rows returned
    expect(userUpdateData || []).toHaveLength(0);

    // Verify profile plan_id was NOT changed
    const { data: profileBefore } = await admin
      .from('profiles')
      .select('plan_id')
      .eq('user_id', testUser.user.id)
      .single();
    expect(profileBefore?.plan_id).toBe('free');

    // 2. Regular user client attempts to insert into audit_log directly
    const { error: auditInsertErr } = await userClient
      .from('audit_log')
      .insert({
        action: 'unauthorized_client_tamper',
        actor_id: testUser.user.id,
      } as any);

    // RLS policy denies insert to public/anon/authenticated
    expect(auditInsertErr).not.toBeNull();

    // 3. Privileged syncPlan (using admin client) succeeds
    await syncPlan(testUser.user.id, 'plus', 'subscription');

    const { data: profileAfter } = await admin
      .from('profiles')
      .select('plan_id, plan_source')
      .eq('user_id', testUser.user.id)
      .single();

    expect(profileAfter?.plan_id).toBe('plus');
    expect(profileAfter?.plan_source).toBe('subscription');

    // 4. Privileged logAuditEvent (using admin client) succeeds
    await logAuditEvent({
      action: 'service_role_authorized_test',
      target_user_id: testUser.user.id,
    });

    const { data: auditRows } = await admin
      .from('audit_log')
      .select('action')
      .eq('target_user_id', testUser.user.id)
      .eq('action', 'service_role_authorized_test');

    expect(auditRows).toHaveLength(1);
  });
});
