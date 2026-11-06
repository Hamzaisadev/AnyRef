import { requireUser } from '@/services/session';
import { getEntitlements } from '@/services/entitlements';
import { createAdminClient } from '@/lib/supabaseServer';
import { PLANS_CONFIG } from '@/config/plans';
import { Sparkles, Check, Clock } from 'lucide-react';

export default async function BillingPage() {
  const profile = await requireUser();
  const entitlements = await getEntitlements(profile.id);
  const isPaid = entitlements.planId === 'pro' || entitlements.planId === 'studio';
  const isStaff = entitlements.role === 'owner' || entitlements.role === 'admin';

  // Read show_prices setting and plans from authoritative database
  const supabase = createAdminClient();
  const { data: settingRow } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'show_prices')
    .maybeSingle();

  const showPrices = Boolean(settingRow?.value === true || settingRow?.value === 'true');

  const { data: dbPlans } = await supabase
    .from('plans')
    .select('*')
    .in('id', ['free', 'pro', 'studio'])
    .order('price_usd_month', { ascending: true });

  // Calculate UTC first-of-next-month reset date
  const now = new Date();
  const nextMonthReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const resetDateStr = nextMonthReset.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const proDb = dbPlans?.find((p) => p.id === 'pro');
  const studioDb = dbPlans?.find((p) => p.id === 'studio');

  const proPrice = proDb ? Number(proDb.price_usd_month) : PLANS_CONFIG.pro.priceUsdMonth;
  const studioPrice = studioDb ? Number(studioDb.price_usd_month) : PLANS_CONFIG.studio.priceUsdMonth;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="font-tight font-bold text-2xl sm:text-3xl text-ink tracking-tight">
          Subscription & Plans
        </h1>
        <p className="text-layout-layer text-sm font-sans mt-1">
          Manage your Anyref workspace membership, quotas, and account limits.
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border-subtle shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-5">
          <div>
            <span className="text-xs font-semibold text-layout-layer uppercase tracking-wider block">
              Active Tier
            </span>
            <div className="flex items-center space-x-2.5 mt-1">
              <h2 className="text-2xl font-bold font-tight text-ink capitalize">
                {entitlements.planId} Plan
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  isPaid || isStaff
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'bg-surface-muted text-layout-layer border border-border-subtle'
                }`}
              >
                {isStaff ? 'Staff Unlimited' : isPaid ? 'Active Subscriber' : 'Standard Tier'}
              </span>
            </div>
          </div>

          {!isPaid && !isStaff && (
            <div className="px-3.5 py-1.5 rounded-xl bg-surface-muted border border-border-subtle text-layout-layer text-xs font-semibold self-start sm:self-auto flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Paid plans are coming soon</span>
            </div>
          )}
        </div>

        {/* Quotas Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle">
            <span className="text-xs text-layout-layer block mb-1">Daily Generations</span>
            <span className="text-lg font-bold text-ink">
              {entitlements.limits.generate_per_day === null
                ? 'Unlimited'
                : `${entitlements.limits.generate_per_day} / day`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle">
            <span className="text-xs text-layout-layer block mb-1">Daily Autofills</span>
            <span className="text-lg font-bold text-ink">
              {entitlements.limits.autofill_per_day === null
                ? 'Unlimited'
                : `${entitlements.limits.autofill_per_day} / day`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle">
            <span className="text-xs text-layout-layer block mb-1">Brand Profiles</span>
            <span className="text-lg font-bold text-ink">
              {entitlements.limits.max_brands === null
                ? 'Unlimited'
                : `Up to ${entitlements.limits.max_brands}`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle">
            <span className="text-xs text-layout-layer block mb-1">Monthly Allowance</span>
            <span className="text-lg font-bold text-ink">
              {isStaff ? 'Unlimited' : 'Included'}
            </span>
            <span className="text-[11px] text-layout-layer block mt-0.5">
              Resets {resetDateStr}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Comparison Grid */}
      <div id="pricing-comparison" className="space-y-4 pt-4">
        <h2 className="text-xl font-bold font-tight text-ink">Compare Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Free Tier */}
          <div className="p-6 rounded-3xl bg-surface border border-border-subtle space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="font-tight font-bold text-xl text-ink">Free Tier</h3>
                <p className="text-xs text-layout-layer mt-1">
                  Essential reference prompt extraction with standard daily quotas.
                </p>
                <div className="mt-4 flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-ink">$0</span>
                  <span className="text-xs text-layout-layer">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-ink pt-2 border-t border-border-subtle">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-layout-layer shrink-0" />
                  <span>5 prompt deconstructions per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-layout-layer shrink-0" />
                  <span>5 product autofills per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-layout-layer shrink-0" />
                  <span>2 brand drafts per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-layout-layer shrink-0" />
                  <span>Up to 2 active brands</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-layout-layer shrink-0" />
                  <span>50 saved template entries</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-layout-layer shrink-0" />
                  <span>Standard monthly AI allowance</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              {entitlements.planId === 'free' && !isStaff ? (
                <div className="py-2.5 text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  Current Active Plan
                </div>
              ) : (
                <div className="py-2.5 text-center text-xs font-semibold text-layout-layer bg-surface-muted rounded-xl border border-border-subtle">
                  Standard Tier
                </div>
              )}
            </div>
          </div>

          {/* 2. Pro Tier */}
          <div className="p-6 rounded-3xl bg-surface border-2 border-primary/60 shadow-sm space-y-5 flex flex-col justify-between relative">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-primary text-primary-fg text-xs font-bold uppercase tracking-wider">
              {showPrices ? 'Recommended' : 'Coming Soon'}
            </span>

            <div className="space-y-4">
              <div>
                <h3 className="font-tight font-bold text-xl text-ink">Pro Tier</h3>
                <p className="text-xs text-layout-layer mt-1">
                  High-capacity prompt studio for active creators and growing brands.
                </p>
                <div className="mt-4 flex items-baseline space-x-1">
                  {showPrices ? (
                    <>
                      <span className="text-3xl font-extrabold text-ink">${proPrice}</span>
                      <span className="text-xs text-layout-layer">/ month</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-layout-layer">Coming Soon</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 text-sm text-ink pt-2 border-t border-border-subtle">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span><strong>20 prompt deconstructions</strong> per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span><strong>40 product autofills</strong> per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>5 brand drafts per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Up to 5 brand profiles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>1,000 saved template entries</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Larger monthly AI allowance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Batch processing (up to 5)</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              {entitlements.planId === 'pro' ? (
                <div className="py-2.5 text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  Current Active Plan
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 bg-surface-muted text-layout-layer border border-border-subtle font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 cursor-not-allowed opacity-80"
                  aria-disabled="true"
                >
                  <Sparkles className="w-4 h-4 text-layout-layer" />
                  <span>Pro is coming soon</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Studio Tier */}
          <div className="p-6 rounded-3xl bg-surface border border-border-subtle shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="font-tight font-bold text-xl text-ink">Studio Tier</h3>
                <p className="text-xs text-layout-layer mt-1">
                  Dedicated creative workspace with extended brand libraries and high-throughput allowances.
                </p>
                <div className="mt-4 flex items-baseline space-x-1">
                  {showPrices ? (
                    <>
                      <span className="text-3xl font-extrabold text-ink">${studioPrice}</span>
                      <span className="text-xs text-layout-layer">/ month</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-layout-layer">Coming Soon</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 text-sm text-ink pt-2 border-t border-border-subtle">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span><strong>60 prompt deconstructions</strong> per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span><strong>120 product autofills</strong> per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>20 brand drafts per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Up to 25 brand profiles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>5,000 saved template entries</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Maximum monthly AI allowance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>High-throughput batch (up to 10) & custom export</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              {entitlements.planId === 'studio' ? (
                <div className="py-2.5 text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  Current Active Plan
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 bg-surface-muted text-layout-layer border border-border-subtle font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 cursor-not-allowed opacity-80"
                  aria-disabled="true"
                >
                  <Sparkles className="w-4 h-4 text-layout-layer" />
                  <span>Studio is coming soon</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
