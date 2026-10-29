import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';
import { logAuditEvent } from '@/data/auditRepo';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Enforce CRON_SECRET authorization header
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  interface CronSummary {
    purgedAccounts: number;
    downgradedComps: number;
    expiredOverrides: number;
  }
  const summary: CronSummary = {
    purgedAccounts: 0,
    downgradedComps: 0,
    expiredOverrides: 0,
  };

  try {
    // 1. Purge expired pending_deletion accounts (after 14-day grace period)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiredAccounts } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('status', 'pending_deletion')
      .lte('deletion_requested_at', fourteenDaysAgo);

    if (expiredAccounts && expiredAccounts.length > 0) {
      for (const account of expiredAccounts) {
        // Remove user data rows (brands, entries, profiles)
        await supabase.from('brands').delete().eq('user_id', account.user_id);
        await supabase.from('entries').delete().eq('user_id', account.user_id);
        await supabase.from('profiles').delete().eq('user_id', account.user_id);

        await logAuditEvent({
          action: 'account_hard_deleted_cron',
          target_user_id: account.user_id,
          reason: '14-day deletion grace period expired; data permanently erased.',
        });
        summary.purgedAccounts++;
      }
    }

    // 2. Downgrade expired comp plans
    const { data: expiredComps } = await supabase
      .from('profiles')
      .select('user_id, plan_id')
      .eq('plan_source', 'comp')
      .not('comp_until', 'is', null)
      .lte('comp_until', now);

    if (expiredComps && expiredComps.length > 0) {
      for (const comp of expiredComps) {
        await supabase
          .from('profiles')
          .update({ plan_id: 'free', plan_source: 'default', comp_until: null })
          .eq('user_id', comp.user_id);

        await logAuditEvent({
          action: 'comp_plan_expired',
          target_user_id: comp.user_id,
          reason: 'Complimentary Plus duration expired; reverted to Free tier.',
        });
        summary.downgradedComps++;
      }
    }

    // 3. Remove expired quota overrides
    const { data: expiredOverrides } = await supabase
      .from('quota_overrides')
      .select('user_id')
      .not('expires_at', 'is', null)
      .lte('expires_at', now);

    if (expiredOverrides && expiredOverrides.length > 0) {
      for (const override of expiredOverrides) {
        await supabase.from('quota_overrides').delete().eq('user_id', override.user_id);
        summary.expiredOverrides++;
      }
    }

    return NextResponse.json({ ok: true, timestamp: now, summary }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cron execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
