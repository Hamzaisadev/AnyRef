import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  processWebhookEvent,
  syncPlan,
  StandardMoRBillingProvider,
} from '../../src/services/billingService';
import { createClient } from '../../src/lib/supabaseServer';
import { logAuditEvent } from '../../src/data/auditRepo';

vi.mock('../../src/lib/supabaseServer', () => ({
  createClient: vi.fn(),
}));

vi.mock('../../src/data/auditRepo', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Billing Service - Webhook Ingestion, Idempotency & Ordering', () => {
  const secret = 'super_secure_billing_secret_123';
  const provider = 'mor_standard';

  function createSignedPayload(payloadObj: Record<string, unknown>) {
    const rawBody = JSON.stringify(payloadObj);
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return { rawBody, signature };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Signature Verification', () => {
    it('rejects webhooks with forged or invalid signatures with 400', async () => {
      const { rawBody } = createSignedPayload({ test: 'event' });
      const badSignature = 'invalid_tampered_signature_hex';

      await expect(
        processWebhookEvent({
          provider,
          rawBody,
          signature: badSignature,
          secret,
        })
      ).rejects.toThrow(/invalid webhook signature/i);
    });

    it('verifies genuine HMAC signatures accurately', () => {
      const morProvider = new StandardMoRBillingProvider();
      const { rawBody, signature } = createSignedPayload({ event_id: 'evt_1' });
      expect(morProvider.verifyWebhookSignature(rawBody, signature, secret)).toBe(true);
    });
  });

  describe('Idempotency & Replay Protection', () => {
    it('returns already_processed on duplicate event_id replay and skips mutations', async () => {
      // Mock insert failure with PostgreSQL unique violation 23505
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'webhook_events') {
            return {
              insert: vi.fn().mockResolvedValue({
                error: { code: '23505', message: 'duplicate key value violates unique constraint' },
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      const payload = {
        event_id: 'evt_duplicate_100',
        type: 'subscription.created',
        data: {
          user_id: 'usr_dup_1',
          customer_id: 'cus_1',
          id: 'sub_1',
          plan_id: 'plus',
          status: 'active',
        },
      };
      const { rawBody, signature } = createSignedPayload(payload);

      const result = await processWebhookEvent({
        provider,
        rawBody,
        signature,
        secret,
      });

      expect(result.status).toBe('already_processed');
      expect(logAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('Out-of-Order Event Protection', () => {
    it('ignores stale events arriving after newer events have been processed', async () => {
      const newerTimestamp = '2026-10-29T10:00:00Z';
      const olderTimestamp = '2026-10-29T09:00:00Z'; // Stale event

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'webhook_events') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === 'subscriptions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { last_event_at: newerTimestamp },
                  error: null,
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      const stalePayload = {
        event_id: 'evt_stale_1',
        created_at: olderTimestamp,
        data: {
          user_id: 'usr_order_1',
          customer_id: 'cus_1',
          id: 'sub_1',
          plan_id: 'free',
          status: 'canceled',
        },
      };
      const { rawBody, signature } = createSignedPayload(stalePayload);

      const result = await processWebhookEvent({
        provider,
        rawBody,
        signature,
        secret,
      });

      expect(result.status).toBe('ignored_out_of_order');
    });
  });

  describe('Plan Synchronization (syncPlan)', () => {
    it('upgrades user profile plan and logs an audit record', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { plan_id: 'free', plan_source: 'default' },
                  error: null,
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: mockUpdate,
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      await syncPlan('usr_upgrade_1', 'plus', 'subscription');

      expect(mockUpdate).toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plan_synced',
          target_user_id: 'usr_upgrade_1',
          before: { plan_id: 'free', plan_source: 'default' },
          after: { plan_id: 'plus', plan_source: 'subscription' },
        })
      );
    });
  });
});
