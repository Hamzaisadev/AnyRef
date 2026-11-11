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
  /**
   * In-app image renders per day. Rendering is ~40x the cost of a text call
   * ($0.134/image vs ~$0.003/call), so this is the dominant cost driver and is
   * budgeted separately from the text quotas above.
   */
  render_per_day: number | null;
  /** Max renders per month. Hard stop independent of the daily cap. */
  render_per_month: number | null;
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
  // [A] Relaxed 0.55 -> 0.50 when in-app rendering shipped. Image generation costs
  // ~40x a text call ($0.134/image vs $0.003/call), so a 55% WORST-CASE floor would
  // have capped Pro at 9 renders/month — not a sellable product. 50% worst case with
  // ~79% typical-case margin is the deliberate trade. Revisit if render prices fall.
  minPlanMargin: 0.50,
  // [A] Raised 0.50 -> 0.60 to fit 3 free renders, which is the single thing that
  // gets a new user to the aha moment. Text quotas were trimmed to keep it near $0.50.
  maxFreeBudgetUsd: 0.60,
  typicalUtilizationRatio: 0.30,
};

/**
 * Free tier is deliberately tighter than before on brands (1, was 2) because
 * multi-brand is the paid trigger for the real buyer (freelancers running several
 * clients). Renders are capped at 3/month: enough to reach the aha moment once,
 * not enough to serve an ongoing workflow for free.
 * Worst-case free AI exposure: 3 renders x $0.134 = $0.40 + text calls.
 */
export const DEFAULT_FREE_LIMITS: PlanLimits = {
  max_brands: 1,
  max_entries: 25,
  max_storage_mb: 200,
  // Text quotas trimmed from 5/5 to 3/3 so the 3 free renders fit inside the
  // free exposure ceiling. Worst case: 30*(3*0.003493 + 3*0.001675 + 2*0.001125)
  // + 3*0.134 = $0.55.
  generate_per_day: 3,
  autofill_per_day: 3,
  brand_draft_per_day: 2,
  batch_max: 1,
  render_per_day: 2,
  render_per_month: 3, // [A] aha-moment allowance only
  monthly_ai_budget_usd: 0.58, // [A] covers 3 renders + trimmed text quotas
};

/**
 * Pro at $15/mo, 30 renders/mo (~1/day).
 * Worst case: $2.15 text + 30*$0.134 = $6.17 against $13.75 net revenue
 * = 50.5% worst-case margin, 79.3% typical. Text quotas are deliberately lower
 * than the old $19 tier because rendering, not prompt generation, is now the
 * thing users actually consume.
 */
export const DEFAULT_PRO_LIMITS: PlanLimits = {
  max_brands: 5,
  max_entries: 1000,
  max_storage_mb: 2000,
  generate_per_day: 10,
  autofill_per_day: 20,
  brand_draft_per_day: 3,
  batch_max: 5,
  render_per_day: 5,
  render_per_month: 30, // [A] $4.02 worst-case render spend
  monthly_ai_budget_usd: 6.20, // [A] renders + text, slight headroom
};

/**
 * Studio at $49/mo for small agencies, 100 renders/mo.
 * Worst case: $6.50 text + 100*$0.134 = $19.90 against $46.05 net revenue
 * = 53.4% worst-case margin, 81.8% typical.
 */
export const DEFAULT_STUDIO_LIMITS: PlanLimits = {
  max_brands: 25,
  max_entries: 5000,
  max_storage_mb: 10000,
  generate_per_day: 30,
  autofill_per_day: 60,
  brand_draft_per_day: 10,
  batch_max: 10,
  render_per_day: 15,
  render_per_month: 100, // [A] $13.40 worst-case render spend
  monthly_ai_budget_usd: 20.00, // [A]
};

export const DEFAULT_PLUS_LIMITS: PlanLimits = {
  max_brands: 10,
  max_entries: 2000,
  max_storage_mb: 5000,
  generate_per_day: 50,
  autofill_per_day: 100,
  batch_max: 10,
  brand_draft_per_day: 20,
  render_per_day: 5,
  render_per_month: 30,
  monthly_ai_budget_usd: 6.20, // Legacy fallback
};

export const PLANS_CONFIG: Record<'free' | 'pro' | 'studio' | 'plus', PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Render 3 on-brand posters free. One brand, no card required.',
    isAvailable: true,
    priceUsdMonth: 0,
    priceUsdYear: 0,
    limits: DEFAULT_FREE_LIMITS,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For freelancers running several clients. 30 renders and 5 brands a month.',
    isAvailable: true,
    // [A] $15 sits at parity with Canva Pro deliberately: with no brand equity yet,
    // price should not be an objection. Was $19.
    priceUsdMonth: 15,
    priceUsdYear: 150, // [A] 2 months free
    limits: DEFAULT_PRO_LIMITS,
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    tagline: 'For small agencies. 25 brands, 100 renders, client-ready exports.',
    // [A] Deliberately NOT purchasable: selling a $49 tier at zero customers signals
    // delusion. Flip to true once 10+ Pro users ask for more brands.
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
