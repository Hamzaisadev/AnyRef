import { requireUser } from '@/services/session';
import { getEntitlements } from '@/services/entitlements';
import { Sparkles, Check, Clock } from 'lucide-react';

export default async function BillingPage() {
  const profile = await requireUser();
  const entitlements = await getEntitlements(profile.id);
  const isPlus = entitlements.planId === 'plus';
  const isStaff = entitlements.role === 'owner' || entitlements.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="font-tight font-bold text-2xl sm:text-3xl text-ink tracking-tight">
          Subscription & Plans
        </h1>
        <p className="text-layout-layer text-sm font-sans mt-1">
          Manage your Anyref studio membership, quotas, and account limits.
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
                  isPlus || isStaff
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'bg-surface-muted text-layout-layer border border-border-subtle'
                }`}
              >
                {isStaff ? 'Staff Unlimited' : isPlus ? 'Active Subscriber' : 'Standard Tier'}
              </span>
            </div>
          </div>

          {!isPlus && !isStaff && (
            <div className="px-3.5 py-1.5 rounded-xl bg-surface-muted border border-border-subtle text-layout-layer text-xs font-semibold self-start sm:self-auto flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Plus is coming soon</span>
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
            <span className="text-xs text-layout-layer block mb-1">Saved Templates</span>
            <span className="text-lg font-bold text-ink">
              {entitlements.limits.max_entries === null
                ? 'Unlimited'
                : `Up to ${entitlements.limits.max_entries}`}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Comparison Grid */}
      <div id="pricing-comparison" className="space-y-4 pt-4">
        <h2 className="text-xl font-bold font-tight text-ink">Compare Studio Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className="p-6 rounded-3xl bg-surface border border-border-subtle space-y-5">
            <div>
              <h3 className="font-tight font-bold text-xl text-ink">Free Tier</h3>
              <p className="text-xs text-layout-layer mt-0.5">
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
                <span>Up to 2 active brands</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-layout-layer shrink-0" />
                <span>50 saved template entries</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-layout-layer shrink-0" />
                <span>Standard prompt export (JSON)</span>
              </li>
            </ul>
          </div>

          {/* Plus Tier */}
          <div className="p-6 rounded-3xl bg-surface border-2 border-primary shadow-sm space-y-5 relative">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-primary text-primary-fg text-xs font-bold uppercase tracking-wider">
              Coming Soon
            </span>

            <div>
              <h3 className="font-tight font-bold text-xl text-ink">Plus Tier</h3>
              <p className="text-xs text-layout-layer mt-0.5">
                High-capacity prompt studio for active creators and marketing teams.
              </p>
              <div className="mt-4 flex items-baseline space-x-1">
                <span className="text-3xl font-extrabold text-ink">$5</span>
                <span className="text-xs text-layout-layer">/ month (planned)</span>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-ink pt-2 border-t border-border-subtle">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>
                  <strong>50 prompt deconstructions</strong> per day
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>
                  <strong>100 product autofills</strong> per day
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Up to 10 brand profiles</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>2,000 saved template entries</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Batch processing & priority model inference</span>
              </li>
            </ul>

            <div className="pt-2">
              {isPlus ? (
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
                  <span>Plus is coming soon</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
