import { requireAdmin } from '@/services/session';
import { createClient } from '@/lib/supabaseServer';
import { can } from '@/services/authz';
import { ForbiddenError } from '@/lib/errors';
import { CreditCard, Check, AlertCircle } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/data/auditRepo';

interface PlanRow {
  id: string;
  name: string;
  price_usd_month: number;
  price_usd_year: number;
  limits: Record<string, number>;
  show_ads: boolean;
  is_active: boolean;
}

export default async function AdminPlansPage() {
  const profile = await requireAdmin();

  if (!can({ id: profile.id, role: profile.role, status: profile.status }, 'edit_plans')) {
    throw new ForbiddenError('Owner privileges required to view or edit platform plans.');
  }

  const supabase = await createClient();
  const { data: plans } = await supabase.from('plans').select('*').order('price_usd_month', { ascending: true });

  async function updatePlanAction(formData: FormData) {
    'use server';
    const currentProfile = await requireAdmin();
    if (!can({ id: currentProfile.id, role: currentProfile.role, status: currentProfile.status }, 'edit_plans')) {
      throw new ForbiddenError('Only the platform owner can update plan tiers.');
    }

    const planId = formData.get('planId') as string;
    const priceMonth = Number(formData.get('priceMonth') || 0);
    const priceYear = Number(formData.get('priceYear') || 0);
    const generatePerDay = Number(formData.get('generatePerDay') || 5);
    const maxBrands = Number(formData.get('maxBrands') || 2);
    const maxEntries = Number(formData.get('maxEntries') || 50);
    const monthlyAiBudgetRaw = formData.get('monthlyAiBudget');
    const monthlyAiBudget = monthlyAiBudgetRaw !== null && monthlyAiBudgetRaw !== '' ? Number(monthlyAiBudgetRaw) : null;
    const showAds = formData.get('showAds') === 'on';

    const client = await createClient();
    const { data: oldPlan } = await client.from('plans').select('*').eq('id', planId).maybeSingle();

    const newLimits = {
      ...(oldPlan?.limits || {}),
      generate_per_day: generatePerDay,
      max_brands: maxBrands,
      max_entries: maxEntries,
      monthly_ai_budget_usd: monthlyAiBudget,
    };

    await client
      .from('plans')
      .update({
        price_usd_month: priceMonth,
        price_usd_year: priceYear,
        limits: newLimits,
        show_ads: showAds,
      })
      .eq('id', planId);

    await logAuditEvent({
      actor_id: currentProfile.id,
      action: 'plan_updated',
      target_type: 'plan',
      target_id: planId,
      before: oldPlan,
      after: { price_usd_month: priceMonth, price_usd_year: priceYear, limits: newLimits, show_ads: showAds },
      reason: 'Owner updated plan limits/pricing',
    });

    revalidatePath('/admin/plans');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
          <CreditCard className="w-6 h-6 text-emerald-400" />
          <span>Plans, Pricing & Tier Quotas</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Owner-only tier configuration. Changes are automatically versioned in the audit log and propagate instantly to user quotas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(plans as PlanRow[] || []).map((plan) => (
          <form
            key={plan.id}
            action={updatePlanAction}
            className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-4"
          >
            <input type="hidden" name="planId" value={plan.id} />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white capitalize">{plan.name} Tier</h2>
                <span className="text-xs text-slate-400 font-mono">ID: {plan.id}</span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  plan.id === 'plus'
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {plan.show_ads ? 'Ad-Supported' : 'Ad-Free'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Price ($/mo)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="priceMonth"
                  defaultValue={plan.price_usd_month}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Price ($/yr)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="priceYear"
                  defaultValue={plan.price_usd_year}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Usage Quotas
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Generations/day</label>
                  <input
                    type="number"
                    name="generatePerDay"
                    defaultValue={plan.limits.generate_per_day}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Max Brands</label>
                  <input
                    type="number"
                    name="maxBrands"
                    defaultValue={plan.limits.max_brands}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Max Entries</label>
                  <input
                    type="number"
                    name="maxEntries"
                    defaultValue={plan.limits.max_entries}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Monthly AI Budget ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monthlyAiBudget"
                    defaultValue={plan.limits.monthly_ai_budget_usd ?? ''}
                    placeholder="Unlimited"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="showAds"
                    defaultChecked={plan.show_ads}
                    className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-primary"
                  />
                  <span>Show advertisements on this tier</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Save {plan.name} Tier Changes
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
