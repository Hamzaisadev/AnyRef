import { createClient } from '../lib/supabaseServer';
import { logAuditEvent } from '../data/auditRepo';
import { TooManyRequestsError, NotFoundError } from '../lib/errors';

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
    description: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    accent_color: string | null;
    font_primary: string | null;
    font_secondary: string | null;
    tagline: string | null;
    tone_of_voice: string | null;
    target_audience: string | null;
    do_rules: string[];
    never_do_rules: string[];
    created_at: string;
  }>;
  entries: Array<{
    id: string;
    brand_id: string;
    title: string;
    summary: string | null;
    prompt_template: string;
    category: string;
    tags: string[];
    slots: unknown[];
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
  context?: { ip?: string; userAgent?: string }
): Promise<UserExportData> {
  const supabase = await createClient();

  // 1. Verify user profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, plan_id, status, created_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileErr || !profile) {
    throw new NotFoundError('User profile not found.');
  }

  // 2. Check rate limit from audit_log
  const oneDayAgo = new Date(Date.now() - EXPORT_COOLDOWN_MS).toISOString();
  const { data: recentExports } = await supabase
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
  const { data: brands, error: brandsErr } = await supabase
    .from('brands')
    .select('id, name, description, primary_color, secondary_color, accent_color, font_primary, font_secondary, tagline, tone_of_voice, target_audience, do_rules, never_do_rules, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (brandsErr) {
    throw new Error(`Failed to fetch brands for export: ${brandsErr.message}`);
  }

  // 4. Fetch user entries
  const { data: entries, error: entriesErr } = await supabase
    .from('entries')
    .select('id, brand_id, title, summary, prompt_template, category, tags, slots, created_at')
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
    brands: brands || [],
    entries: entries || [],
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
