import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuotaService } from '../../src/services/quotaService';
import { createClient, createAdminClient } from '../../src/lib/supabaseServer';
import { getEntitlements } from '../../src/services/entitlements';
import { QuotaExceededError, ForbiddenError } from '../../src/lib/errors';
import type { ActorProfile } from '../../src/services/authz';

vi.mock('../../src/lib/supabaseServer', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock('../../src/services/entitlements', () => ({
  getEntitlements: vi.fn(),
}));

vi.mock('../../src/data/auditRepo', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('QuotaService - Limits, Circuit Breakers & Staff Bypass', () => {
  const normalUserActor: ActorProfile = { id: 'u-norm', role: 'user', status: 'active' };
  const ownerActor: ActorProfile = { id: 'u-owner', role: 'owner', status: 'active' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Circuit Breaker (Kill Switch & Cost Cap)', () => {
    it('blocks regular user when AI kill switch is active', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ key: 'ai_kill_switch', value: true }],
          }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      await expect(QuotaService.checkCircuitBreaker(normalUserActor)).rejects.toThrow(
        /AI generation is temporarily paused/i
      );
    });

    it('allows platform owner test run even when AI kill switch is active', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'app_settings') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({
                data: [{ key: 'ai_kill_switch', value: true }],
              }),
            };
          }
          if (table === 'ai_usage') {
            return {
              select: vi.fn().mockReturnThis(),
              gte: vi.fn().mockResolvedValue({ data: [] }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      // Does not throw for owner
      await expect(QuotaService.checkCircuitBreaker(ownerActor)).resolves.toBeUndefined();
    });

    it('automatically trips kill switch when cumulative spend exceeds cost cap', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'app_settings') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({
                data: [
                  { key: 'ai_kill_switch', value: false },
                  { key: 'global_daily_cost_cap_usd', value: 5.0 },
                ],
              }),
              upsert: mockUpsert,
            };
          }
          if (table === 'ai_usage') {
            return {
              select: vi.fn().mockReturnThis(),
              gte: vi.fn().mockResolvedValue({
                data: [{ est_cost_usd: 3.5 }, { est_cost_usd: 2.0 }], // Total $5.50 > $5.00
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      await expect(QuotaService.checkCircuitBreaker(normalUserActor)).rejects.toThrow(
        /daily system capacity limits/i
      );
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'ai_kill_switch', value: true })
      );
    });
  });

  describe('Daily AI Quotas', () => {
    it('bypasses daily limits completely for staff accounts (null limit)', async () => {
      (getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: 'owner',
        planId: 'free',
        limits: { generate_per_day: null, autofill_per_day: null },
      });

      const res = await QuotaService.checkDailyQuota('owner-id', 'generate_per_day');
      expect(res.allowed).toBe(true);
      expect(res.limit).toBeNull();
    });

    it('allows free user under daily quota (e.g. 2/5 used)', async () => {
      (getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: 'user',
        planId: 'free',
        limits: { generate_per_day: 5 },
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ count: 2 }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const res = await QuotaService.checkDailyQuota('user-free', 'generate_per_day');
      expect(res.allowed).toBe(true);
      expect(res.used).toBe(2);
      expect(res.remaining).toBe(3);
    });

    it('throws QuotaExceededError when user hits daily limit (5/5 used)', async () => {
      (getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: 'user',
        planId: 'free',
        limits: { generate_per_day: 5 },
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ count: 5 }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      await expect(
        QuotaService.checkDailyQuota('user-free', 'generate_per_day')
      ).rejects.toThrow(QuotaExceededError);
    });
  });

  describe('Resource Capacity Quotas', () => {
    it('throws QuotaExceededError when user reaches brand limit', async () => {
      (getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: 'user',
        planId: 'free',
        limits: { max_brands: 2 },
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ count: 2 }),
        })),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      await expect(QuotaService.checkBrandQuota('user-free')).rejects.toThrow(
        /Brand limit reached/i
      );
    });
  });
});
