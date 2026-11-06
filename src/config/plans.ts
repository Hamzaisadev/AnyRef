/**
 * Authoritative Plan Limits and Tier Definitions for Anyref.
 * Single source of truth shared by backend entitlement engine, billing, and admin settings.
 * All assumptions marked [A] are owner-configurable financial and risk parameters.
 */

export interface PlanLimits {
  max_brands: number | null;
  max_entries: number | null;
  max_storage_mb: number | null;
  generate_per_day: number | null;
  autofill_per_day: number | null;
  batch_max: number | null;
  brand_draft_per_day: number | null;
  monthly_ai_budget_usd: number | null;
}

export interface PlanConfig {
  id: 'free' | 'pro' | 'studio' | 'plus';
  name: string;
  tagline: string;
  isAvailable: boolean;
  priceUsdMonth: number;
  priceUsdYear: number;
  limits: PlanLimits;
}

export interface PlanEconomicsConfig {
  paymentFeePercent: number; // [A] 5% payment gateway fee
  paymentFeeFixedUsd: number; // [A] $0.50 fixed per-transaction fee
  minPlanMargin: number; // 0.55 floor (55% budget-capped gross margin)
  maxFreeBudgetUsd: number; // $0.50 ceiling for free tier monthly AI spend
  typicalUtilizationRatio: number; // [A] 30% typical usage ratio
}

export const DEFAULT_PLAN_ECONOMICS: PlanEconomicsConfig = {
  paymentFeePercent: 0.05,
  paymentFeeFixedUsd: 0.50,
  minPlanMargin: 0.55,
  maxFreeBudgetUsd: 0.50,
  typicalUtilizationRatio: 0.30,
};

export const DEFAULT_FREE_LIMITS: PlanLimits = {
  max_brands: 2,
  max_entries: 50,
  max_storage_mb: 200,
  generate_per_day: 5,
  autofill_per_day: 5,
  brand_draft_per_day: 2,
  batch_max: 1,
  monthly_ai_budget_usd: 0.40, // [A]
};

export const DEFAULT_PRO_LIMITS: PlanLimits = {
  max_brands: 5,
  max_entries: 1000,
  max_storage_mb: 2000,
  generate_per_day: 20,
  autofill_per_day: 40,
  brand_draft_per_day: 5,
  batch_max: 5,
  monthly_ai_budget_usd: 4.00, // [A]
};

export const DEFAULT_STUDIO_LIMITS: PlanLimits = {
  max_brands: 25,
  max_entries: 5000,
  max_storage_mb: 10000,
  generate_per_day: 60,
  autofill_per_day: 120,
  brand_draft_per_day: 20,
  batch_max: 10,
  monthly_ai_budget_usd: 12.00, // [A]
};

export const DEFAULT_PLUS_LIMITS: PlanLimits = {
  max_brands: 10,
  max_entries: 2000,
  max_storage_mb: 5000,
  generate_per_day: 50,
  autofill_per_day: 100,
  batch_max: 10,
  brand_draft_per_day: 20,
  monthly_ai_budget_usd: 4.00, // Legacy fallback
};

export const PLANS_CONFIG: Record<'free' | 'pro' | 'studio' | 'plus', PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Essential reference prompt extraction with standard daily quotas.',
    isAvailable: true,
    priceUsdMonth: 0,
    priceUsdYear: 0,
    limits: DEFAULT_FREE_LIMITS,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'High-capacity prompt studio for active creators and growing brands.',
    isAvailable: false,
    priceUsdMonth: 19, // [A]
    priceUsdYear: 190, // [A]
    limits: DEFAULT_PRO_LIMITS,
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    tagline: 'Dedicated creative workspace with extended brand libraries and high-throughput allowances.',
    isAvailable: false,
    priceUsdMonth: 49, // [A]
    priceUsdYear: 490, // [A]
    limits: DEFAULT_STUDIO_LIMITS,
  },
  plus: {
    id: 'plus',
    name: 'Plus (Legacy)',
    tagline: 'Legacy inactive tier.',
    isAvailable: false,
    priceUsdMonth: 19,
    priceUsdYear: 190,
    limits: DEFAULT_PLUS_LIMITS,
  },
};
