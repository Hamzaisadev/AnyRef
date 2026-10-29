import { createClient, createAdminClient } from '../lib/supabaseServer';
import type { AppRole } from './authz';

export interface PlanLimits {
  max_brands: number | null;
  max_entries: number | null;
  max_storage_mb: number | null;
  generate_per_day: number | null;
  autofill_per_day: number | null;
  batch_max: number | null;
}

export interface Entitlements {
  role: AppRole;
  planId: string;
  limits: PlanLimits;
  features: {
    batch_autofill: boolean;
    custom_export: boolean;
    unlimited_ai: boolean;
  };
  showAds: boolean;
}

const DEFAULT_FREE_LIMITS: PlanLimits = {
  max_brands: 2,
  max_entries: 50,
  max_storage_mb: 200,
  generate_per_day: 5,
  autofill_per_day: 5,
  batch_max: 1,
};

const UNLIMITED_STAFF_LIMITS: PlanLimits = {
  max_brands: null,
  max_entries: null,
  max_storage_mb: null,
  generate_per_day: null,
  autofill_per_day: null,
  batch_max: null,
};

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const supabase = createAdminClient();

  // 1. Fetch user profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, plan_id, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileErr || !profile) {
    // Default safe fallback if profile not yet provisioned
    return {
      role: 'user',
      planId: 'free',
      limits: DEFAULT_FREE_LIMITS,
      features: {
        batch_autofill: false,
        custom_export: false,
        unlimited_ai: false,
      },
      showAds: true,
    };
  }

  const role = profile.role as AppRole;
  const planId = profile.plan_id || 'free';

  // 2. Staff (Owner / Admin) has UNLIMITED limits and NO ads
  if (role === 'owner' || role === 'admin') {
    return {
      role,
      planId,
      limits: UNLIMITED_STAFF_LIMITS,
      features: {
        batch_autofill: true,
        custom_export: true,
        unlimited_ai: true,
      },
      showAds: false,
    };
  }

  // 3. Standard user: fetch active plan details
  const { data: plan } = await supabase
    .from('plans')
    .select('limits, show_ads')
    .eq('id', planId)
    .maybeSingle();

  const baseLimits: PlanLimits = (plan?.limits as unknown as PlanLimits) || DEFAULT_FREE_LIMITS;
  const showAds = plan?.show_ads ?? (planId === 'free');

  // 4. Check for active unexpired quota overrides
  const { data: override } = await supabase
    .from('quota_overrides')
    .select('limits, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  let mergedLimits = { ...baseLimits };
  if (override && (!override.expires_at || new Date(override.expires_at) > new Date())) {
    mergedLimits = {
      ...mergedLimits,
      ...(override.limits as Record<string, number>),
    };
  }

  return {
    role: 'user',
    planId,
    limits: mergedLimits,
    features: {
      batch_autofill: (mergedLimits.batch_max ?? 1) > 1,
      custom_export: planId === 'plus',
      unlimited_ai: false,
    },
    showAds,
  };
}
