import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../../src/services/adminService';
import { createClient } from '../../src/lib/supabaseServer';
import { logAuditEvent } from '../../src/data/auditRepo';
import type { ActorProfile } from '../../src/services/authz';

vi.mock('../../src/lib/supabaseServer', () => ({
  createClient: vi.fn(),
}));

vi.mock('../../src/data/auditRepo', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('AdminService - Authorization & Audit Guarantees', () => {
  const normalUser: ActorProfile = { id: 'u-1', role: 'user', status: 'active' };
  const adminActor: ActorProfile = { id: 'a-1', role: 'admin', status: 'active', aal: 'aal2' };
  const ownerActor: ActorProfile = { id: 'o-1', role: 'owner', status: 'active', aal: 'aal2' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Non-Staff Access Denial', () => {
    it('rejects normal user from accessing overview metrics', async () => {
      await expect(AdminService.getOverviewMetrics(normalUser)).rejects.toThrow(
        /access denied/i
      );
    });

    it('rejects normal user from listing users', async () => {
      await expect(AdminService.listUsers(normalUser)).rejects.toThrow(
        /access denied/i
      );
    });

    it('rejects normal user from suspending any user', async () => {
      await expect(AdminService.suspendUser(normalUser, 'target-id', 'test')).rejects.toThrow(
        /access denied/i
      );
    });
  });

  describe('Admin Role Boundaries', () => {
    it('blocks admin from suspending the platform owner', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'owner', status: 'active' },
              error: null,
            }),
          }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      await expect(
        AdminService.suspendUser(adminActor, 'owner-id', 'testing violation')
      ).rejects.toThrow(/admins cannot suspend other admins or the platform owner/i);
      expect(logAuditEvent).not.toHaveBeenCalled();
    });

    it('blocks admin from suspending another admin', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin', status: 'active' },
              error: null,
            }),
          }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      await expect(
        AdminService.suspendUser(adminActor, 'admin-2', 'testing violation')
      ).rejects.toThrow(/admins cannot suspend other admins or the platform owner/i);
      expect(logAuditEvent).not.toHaveBeenCalled();
    });

    it('allows admin to suspend a regular user and creates an audit row', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'user', status: 'active' },
              error: null,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: mockUpdate,
          }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      await AdminService.suspendUser(adminActor, 'user-bad', 'Abusive content generation');

      expect(mockUpdate).toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: adminActor.id,
          action: 'user_suspended',
          target_user_id: 'user-bad',
          reason: 'Abusive content generation',
        })
      );
    });

    it('blocks admin from promoting/demoting other users', async () => {
      await expect(
        AdminService.promoteDemoteAdmin(adminActor, 'user-2', 'admin', 'granting access')
      ).rejects.toThrow(/access denied/i);
    });
  });

  describe('Owner Capabilities', () => {
    it('allows owner to suspend an admin account', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin', status: 'active' },
              error: null,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: mockUpdate,
          }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      await AdminService.suspendUser(ownerActor, 'admin-compromised', 'Compromised credentials');

      expect(mockUpdate).toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: ownerActor.id,
          action: 'user_suspended',
          target_user_id: 'admin-compromised',
          reason: 'Compromised credentials',
        })
      );
    });

    it('allows owner to promote a user to admin with audit logging', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: mockUpdate,
          }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      await AdminService.promoteDemoteAdmin(ownerActor, 'trusted-user', 'admin', 'New moderator');

      expect(mockUpdate).toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: ownerActor.id,
          action: 'admin_promoted',
          target_user_id: 'trusted-user',
          reason: 'New moderator',
        })
      );
    });
  });

  describe('Abuse Review Protection', () => {
    it('requires a mandatory reason before exposing user content', async () => {
      await expect(
        AdminService.conductAbuseReview(adminActor, 'reported-user', '')
      ).rejects.toThrow(/specific investigation reason/i);
      expect(logAuditEvent).not.toHaveBeenCalled();
    });

    it('logs an audit record before returning user content for valid reason', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'brands') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: [{ id: 'b1', name: 'Brand 1' }] }),
            };
          }
          if (table === 'entries') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: [{ id: 'e1', title: 'Poster 1' }] }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      const result = await AdminService.conductAbuseReview(
        adminActor,
        'reported-user',
        'Ticket #4092: DMCA copyright infringement notice'
      );

      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: adminActor.id,
          action: 'abuse_review_conducted',
          target_user_id: 'reported-user',
          reason: 'Ticket #4092: DMCA copyright infringement notice',
        })
      );

      expect(result.brands).toHaveLength(1);
      expect(result.entries).toHaveLength(1);
    });
  });
});
