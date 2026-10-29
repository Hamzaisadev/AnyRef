import { createClient, createAdminClient } from '../lib/supabaseServer';
import { logAuditEvent } from '../data/auditRepo';
import { TooManyRequestsError, NotFoundError } from '../lib/errors';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserExportData {
  exported_at: string;
  user: {
    id: string;
    role: string;
    plan_id: string;
    status: string;
    created_at: string;
  };
  brands: Array<{
    id: string;
    name: string;
    what_you_sell: string | null;
    why: string | null;
    tone: string | null;
    colors: string[];
    wordmark: string | null;
    logo_path: string | null;
    footer_text: string | null;
    slogan: string | null;
    never_do_rules: string | null;
    default_values: Record<string, unknown>;
    created_at: string;
  }>;
  entries: Array<{
    id: string;
    brand_id: string;
    reference_path: string;
    result_path: string | null;
    prompt_template: string;
    slots: unknown[];
    status: string;
    poster_type: string | null;
    intended_product_shape: string | null;
    note: string | null;
    created_at: string;
  }>;
}

const EXPORT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generates an export bundle of all user-owned data in GDPR/privacy compliant JSON format.
 * Rate-limited to once per 24 hours per account.
 */
export async function exportUserData(
  userId: string,
  context?: { ip?: string; userAgent?: string; client?: SupabaseClient }
): Promise<UserExportData> {
  const admin = createAdminClient();
  const db = context?.client ?? (await createClient());

  // 1. Verify user profile using admin client
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('role, plan_id, status, created_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileErr || !profile) {
    throw new NotFoundError('User profile not found.');
  }

  // 2. Check rate limit from audit_log using admin client (RLS blocks standard users from reading audit_log)
  const oneDayAgo = new Date(Date.now() - EXPORT_COOLDOWN_MS).toISOString();
  const { data: recentExports } = await admin
    .from('audit_log')
    .select('created_at')
    .eq('actor_id', userId)
    .eq('action', 'user_data_exported')
    .gt('created_at', oneDayAgo)
    .limit(1);

  if (recentExports && recentExports.length > 0) {
    throw new TooManyRequestsError('You can only export your data once every 24 hours.');
  }

  // 3. Fetch user brands
  const { data: brands, error: brandsErr } = await db
    .from('brands')
    .select(
      'id, name, what_you_sell, why, tone, colors, wordmark, logo_path, footer_text, slogan, never_do_rules, default_values, created_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (brandsErr) {
    throw new Error(`Failed to fetch brands for export: ${brandsErr.message}`);
  }

  // 4. Fetch user entries
  const { data: entries, error: entriesErr } = await db
    .from('entries')
    .select(
      'id, brand_id, reference_path, result_path, prompt_template, slots, status, poster_type, intended_product_shape, note, created_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (entriesErr) {
    throw new Error(`Failed to fetch entries for export: ${entriesErr.message}`);
  }

  const exportPayload: UserExportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: userId,
      role: profile.role,
      plan_id: profile.plan_id,
      status: profile.status,
      created_at: profile.created_at,
    },
    brands: (brands as unknown as UserExportData['brands']) || [],
    entries: (entries as unknown as UserExportData['entries']) || [],
  };

  // 5. Audit log event
  await logAuditEvent({
    actor_id: userId,
    action: 'user_data_exported',
    target_user_id: userId,
    target_type: 'data_export',
    target_id: userId,
    ip: context?.ip,
    user_agent: context?.userAgent,
  });

  return exportPayload;
}
