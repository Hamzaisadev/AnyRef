import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEntitlements } from '../../src/services/entitlements';
import { createClient } from '../../src/lib/supabaseServer';

vi.mock('../../src/lib/supabaseServer', () => ({
  createClient: vi.fn(),
}));

describe('Entitlements Engine (getEntitlements)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves UNLIMITED limits (null) and NO ADS (false) for owner', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'owner', plan_id: 'free', status: 'active' },
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const entitlements = await getEntitlements('owner-uuid-1');

    expect(entitlements.role).toBe('owner');
    expect(entitlements.showAds).toBe(false);
    expect(entitlements.limits.max_brands).toBeNull();
    expect(entitlements.limits.max_entries).toBeNull();
    expect(entitlements.limits.max_storage_mb).toBeNull();
    expect(entitlements.limits.generate_per_day).toBeNull();
    expect(entitlements.limits.autofill_per_day).toBeNull();
    expect(entitlements.limits.batch_max).toBeNull();
    expect(entitlements.features.batch_autofill).toBe(true);
    expect(entitlements.features.unlimited_ai).toBe(true);
  });

  it('resolves UNLIMITED limits (null) and NO ADS (false) for admin', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin', plan_id: 'free', status: 'active' },
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const entitlements = await getEntitlements('admin-uuid-1');

    expect(entitlements.role).toBe('admin');
    expect(entitlements.showAds).toBe(false);
    expect(entitlements.limits.max_brands).toBeNull();
    expect(entitlements.limits.generate_per_day).toBeNull();
  });

  it('resolves Free tier limits and showAds=true for normal user', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'user', plan_id: 'free', status: 'active' },
              error: null,
            }),
          };
        }
        if (table === 'plans') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                limits: {
                  max_brands: 2,
                  max_entries: 50,
                  max_storage_mb: 200,
                  generate_per_day: 5,
                  autofill_per_day: 5,
                  batch_max: 1,
                },
                show_ads: true,
              },
              error: null,
            }),
          };
        }
        if (table === 'quota_overrides') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const entitlements = await getEntitlements('user-uuid-free');

    expect(entitlements.role).toBe('user');
    expect(entitlements.planId).toBe('free');
    expect(entitlements.showAds).toBe(true);
    expect(entitlements.limits.max_brands).toBe(2);
    expect(entitlements.limits.max_entries).toBe(50);
    expect(entitlements.limits.generate_per_day).toBe(5);
    expect(entitlements.limits.autofill_per_day).toBe(5);
    expect(entitlements.limits.batch_max).toBe(1);
    expect(entitlements.features.batch_autofill).toBe(false);
  });

  it('resolves Plus tier limits and showAds=false for upgraded user', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'user', plan_id: 'plus', status: 'active' },
              error: null,
            }),
          };
        }
        if (table === 'plans') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                limits: {
                  max_brands: 10,
                  max_entries: 2000,
                  max_storage_mb: 5000,
                  generate_per_day: 50,
                  autofill_per_day: 100,
                  batch_max: 10,
                },
                show_ads: false,
              },
              error: null,
            }),
          };
        }
        if (table === 'quota_overrides') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const entitlements = await getEntitlements('user-uuid-plus');

    expect(entitlements.role).toBe('user');
    expect(entitlements.planId).toBe('plus');
    expect(entitlements.showAds).toBe(false);
    expect(entitlements.limits.max_brands).toBe(10);
    expect(entitlements.limits.generate_per_day).toBe(50);
    expect(entitlements.limits.batch_max).toBe(10);
    expect(entitlements.features.batch_autofill).toBe(true);
    expect(entitlements.features.custom_export).toBe(true);
  });

  it('merges active unexpired quota overrides over base plan', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'user', plan_id: 'free', status: 'active' },
              error: null,
            }),
          };
        }
        if (table === 'plans') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                limits: {
                  max_brands: 2,
                  max_entries: 50,
                  max_storage_mb: 200,
                  generate_per_day: 5,
                  autofill_per_day: 5,
                  batch_max: 1,
                },
                show_ads: true,
              },
              error: null,
            }),
          };
        }
        if (table === 'quota_overrides') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                limits: { generate_per_day: 20, max_brands: 5 },
                expires_at: new Date(Date.now() + 86400000).toISOString(), // expires tomorrow
              },
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const entitlements = await getEntitlements('user-with-override');

    expect(entitlements.limits.generate_per_day).toBe(20);
    expect(entitlements.limits.max_brands).toBe(5);
    expect(entitlements.limits.max_entries).toBe(50); // Unchanged base limit
  });
});
