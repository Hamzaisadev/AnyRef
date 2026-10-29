import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requestAccountDeletion,
  cancelAccountDeletion,
  getAccountDeletionStatus,
} from '../../src/services/accountService';
import { isDisposableEmail } from '../../src/lib/disposableEmail';
import { createClient, createAdminClient } from '../../src/lib/supabaseServer';

vi.mock('../../src/lib/supabaseServer', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock('../../src/data/auditRepo', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Account Service & Signup Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Disposable Email Filter', () => {
    it('blocks known disposable email providers', () => {
      expect(isDisposableEmail('spammer@tempmail.com')).toBe(true);
      expect(isDisposableEmail('user@10minutemail.com')).toBe(true);
      expect(isDisposableEmail('test@mailinator.com')).toBe(true);
      expect(isDisposableEmail('anon@throwawaymail.com')).toBe(true);
    });

    it('allows legitimate email domains', () => {
      expect(isDisposableEmail('alex@gmail.com')).toBe(false);
      expect(isDisposableEmail('sarah@outlook.com')).toBe(false);
      expect(isDisposableEmail('designer@studio.design')).toBe(false);
      expect(isDisposableEmail('owner@anyref.io')).toBe(false);
    });

    it('handles malformed inputs safely', () => {
      expect(isDisposableEmail('')).toBe(false);
      expect(isDisposableEmail('invalid-string')).toBe(false);
    });
  });

  describe('Account Deletion Lifecycle', () => {
    it('requests account deletion and transitions status to pending_deletion', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn((col: string, val: string) => {
                return {
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { status: 'active', role: 'user' },
                    error: null,
                  }),
                  update: mockUpdate,
                };
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
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const res = await requestAccountDeletion('user-del-1');
      expect(res.isPendingDeletion).toBe(true);
      expect(res.daysRemaining).toBe(14);
      expect(res.deletionRequestedAt).toBeDefined();
    });

    it('prevents platform owner from deleting account directly', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { status: 'active', role: 'owner' },
            error: null,
          }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      await expect(requestAccountDeletion('owner-id')).rejects.toThrow(
        /platform owner cannot delete their account directly/i
      );
    });

    it('cancels pending deletion and restores active status', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { status: 'pending_deletion', deletion_requested_at: '2026-10-20T00:00:00Z' },
              error: null,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: mockUpdate,
          }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const res = await cancelAccountDeletion('user-del-1');
      expect(res.isPendingDeletion).toBe(false);
      expect(res.daysRemaining).toBeNull();
    });

    it('calculates remaining days accurately in getAccountDeletionStatus', async () => {
      // 5 days ago
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { status: 'pending_deletion', deletion_requested_at: fiveDaysAgo },
              error: null,
            }),
          }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const res = await getAccountDeletionStatus('user-del-2');
      expect(res.isPendingDeletion).toBe(true);
      expect(res.daysRemaining).toBe(9); // 14 - 5 = 9
    });
  });
});
