import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuotaService } from '@/services/quotaService';
import { createAdminClient } from '@/lib/supabaseServer';
import { getEntitlements } from '@/services/entitlements';
import { QuotaExceededError } from '@/lib/errors';

vi.mock('@/lib/supabaseServer', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock('@/services/entitlements', () => ({
  getEntitlements: vi.fn(),
}));

vi.mock('@/data/auditRepo', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('QuotaService.checkMonthlyBudget — Monthly AI Dollar Budget Enforcement', () => {
  const userId = 'usr-test-123';
  const staffUserId = 'usr-staff-owner';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows user when month-to-date AI cost is comfortably within budget', async () => {
    (getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      planId: 'free',
      role: 'user',
      limits: {
        monthly_ai_budget_usd: 0.40,
        generate_per_day: 5,
        autofill_per_day: 5,
        brand_draft_per_day: 2,
      },
    });

    const mockAdminClient = {
      from: vi.fn((table: string) => {
        if (table === 'ai_usage') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({
              data: [{ est_cost_usd: 0.10 }, { est_cost_usd: 0.05 }], // Total $0.15 < $0.40
            }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ est_cost_usd: 0.0035 }],
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };

    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);

    await expect(
      QuotaService.checkMonthlyBudget(userId, 'generate')
    ).resolves.toBeUndefined();
  });

  it('blocks user with MONTHLY_BUDGET_EXCEEDED (HTTP 429) when month-to-date cost reaches budget', async () => {
    (getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      planId: 'free',
      role: 'user',
      limits: {
        monthly_ai_budget_usd: 0.40,
        generate_per_day: 5,
        autofill_per_day: 5,
        brand_draft_per_day: 2,
      },
    });

    const mockAdminClient = {
      from: vi.fn((table: string) => {
        if (table === 'ai_usage') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({
              data: [{ est_cost_usd: 0.25 }, { est_cost_usd: 0.15 }], // Total $0.40 == budget
            }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ est_cost_usd: 0.0035 }],
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };

    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);

    try {
      await QuotaService.checkMonthlyBudget(userId, 'generate');
      expect.fail('Should have thrown QuotaExceededError');
    } catch (err) {
      expect(err).toBeInstanceOf(QuotaExceededError);
      const qe = err as QuotaExceededError;
      expect(qe.statusCode).toBe(429);
      expect(qe.code).toBe('MONTHLY_BUDGET_EXCEEDED');
      // Names the plan
      expect(qe.message).toContain('Free plan');
      // States reset is on 1st of next month
      expect(qe.message).toContain('first of next month');
      // Never mentions dollar amounts or token counts to user
      expect(qe.message).not.toMatch(/\$\d+/);
      expect(qe.message).not.toMatch(/tokens?/i);
    }
  });

  it('prevents overshoot beyond one call by anticipating next call cost', async () => {
    (getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      planId: 'pro',
      role: 'user',
      limits: {
        monthly_ai_budget_usd: 4.00,
        generate_per_day: 20,
        autofill_per_day: 40,
        brand_draft_per_day: 5,
      },
    });

    // Current spend is $3.998, next call costs $0.0035 -> projected is $4.0015 >= $4.00
    const mockAdminClient = {
      from: vi.fn((table: string) => {
        if (table === 'ai_usage') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({
              data: [{ est_cost_usd: 3.998 }],
            }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ est_cost_usd: 0.0035 }],
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };

    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);

    await expect(
      QuotaService.checkMonthlyBudget(userId, 'generate')
    ).rejects.toThrow(QuotaExceededError);
  });

  it('never blocks staff members (owner or admin) but allows unlimited usage', async () => {
    (getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      planId: 'pro',
      role: 'owner',
      limits: {
        monthly_ai_budget_usd: null, // Unlimited for staff
        generate_per_day: null,
        autofill_per_day: null,
        brand_draft_per_day: null,
      },
    });

    const mockAdminClient = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: [{ est_cost_usd: 50.0 }], // Far exceeds any plan budget
        }),
      })),
    };

    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);

    // Should resolve without error
    await expect(
      QuotaService.checkMonthlyBudget(staffUserId, 'generate')
    ).resolves.toBeUndefined();
  });

  it('correctly calculates UTC start of current calendar month for billing reset', async () => {
    (getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      planId: 'studio',
      role: 'user',
      limits: {
        monthly_ai_budget_usd: 12.00,
      },
    });

    let capturedGteIso: string | undefined;

    const mockAdminClient = {
      from: vi.fn((table: string) => {
        if (table === 'ai_usage') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn((_col: string, isoDate: string) => {
              capturedGteIso = isoDate;
              return Promise.resolve({ data: [] });
            }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };

    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);

    await QuotaService.checkMonthlyBudget(userId, 'autofill');

    expect(capturedGteIso).toBeDefined();
    const gteDate = new Date(capturedGteIso!);
    expect(gteDate.getUTCDate()).toBe(1);
    expect(gteDate.getUTCHours()).toBe(0);
    expect(gteDate.getUTCMinutes()).toBe(0);
    expect(gteDate.getUTCSeconds()).toBe(0);
  });
});
