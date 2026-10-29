import { createAdminClient } from '../lib/supabaseServer';
import { can, type ActorProfile, type TargetProfile, type Action } from './authz';
import { logAuditEvent } from '../data/auditRepo';
import { ForbiddenError, NotFoundError, BadRequestError } from '../lib/errors';
import type { PlanLimits } from './entitlements';

export interface AdminUserListItem {
  user_id: string;
  role: string;
  status: string;
  plan_id: string;
  plan_source: string;
  comp_until: string | null;
  created_at: string;
  total_ai_calls?: number;
}

export interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  plusSubscribers: number;
  aiCallsToday: number;
  estimatedCostTodayUsd: number;
  aiCalls7d: number;
  estimatedCost7dUsd: number;
  aiKillSwitch: boolean;
  signupsEnabled: boolean;
  maintenanceMode: boolean;
  adsEnabledGlobal: boolean;
}

/**
 * Ensures the actor has active staff permissions for an action and optional target.
 */
function assertCan(
  actor: ActorProfile,
  action: Action,
  target?: TargetProfile | null,
  contextMessage?: string
): void {
  if (!can(actor, action, target)) {
    throw new ForbiddenError(
      contextMessage || `Access denied: you do not have permission to perform '${action}'.`
    );
  }
}

/**
 * Admin Panel Service
 * Centralizes all admin capabilities, enforces the permission matrix, and guarantees
 * audit logging for every mutation.
 */
export class AdminService {
  /**
   * Fetches high-level metrics for the Admin Overview dashboard.
   */
  static async getOverviewMetrics(actor: ActorProfile): Promise<OverviewMetrics> {
    assertCan(actor, 'open_admin_panel');
    const supabase = createAdminClient();

    // 1. User counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: plusSubscribers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', 'plus');

    // 2. Settings / toggles
    const { data: settings } = await supabase.from('app_settings').select('key, value');
    const settingsMap = new Map(settings?.map((s) => [s.key, s.value]) || []);

    const aiKillSwitch = Boolean(settingsMap.get('ai_kill_switch') ?? false);
    const signupsEnabled = Boolean(settingsMap.get('signups_enabled') ?? true);
    const maintenanceMode = Boolean(settingsMap.get('maintenance_mode') ?? false);
    const adsEnabledGlobal = Boolean(settingsMap.get('ads_enabled_global') ?? true);

    // 3. AI usage aggregate (today & 7d)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { data: usageToday } = await supabase
      .from('ai_usage')
      .select('est_cost_usd')
      .gte('created_at', todayMidnight.toISOString());

    const { data: usage7d } = await supabase
      .from('ai_usage')
      .select('est_cost_usd')
      .gte('created_at', sevenDaysAgo.toISOString());

    const aiCallsToday = usageToday?.length || 0;
    const estimatedCostTodayUsd = (usageToday || []).reduce(
      (acc, row) => acc + Number((row as { est_cost_usd: number | null }).est_cost_usd || 0),
      0
    );

    const aiCalls7d = usage7d?.length || 0;
    const estimatedCost7dUsd = (usage7d || []).reduce(
      (acc, row) => acc + Number((row as { est_cost_usd: number | null }).est_cost_usd || 0),
      0
    );

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      plusSubscribers: plusSubscribers || 0,
      aiCallsToday,
      estimatedCostTodayUsd: Math.round(estimatedCostTodayUsd * 1000) / 1000,
      aiCalls7d,
      estimatedCost7dUsd: Math.round(estimatedCost7dUsd * 1000) / 1000,
      aiKillSwitch,
      signupsEnabled,
      maintenanceMode,
      adsEnabledGlobal,
    };
  }

  /**
   * Lists and searches users with filtering by role, status, and plan.
   */
  static async listUsers(
    actor: ActorProfile,
    filters?: {
      role?: string;
      status?: string;
      planId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ users: AdminUserListItem[]; total: number }> {
    assertCan(actor, 'list_search_users');
    const supabase = createAdminClient();

    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.planId) query = query.eq('plan_id', filters.planId);

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(`Failed to list users: ${error.message}`);

    return {
      users: (data as AdminUserListItem[]) || [],
      total: count || 0,
    };
  }

  /**
   * Suspends a user account.
   */
  static async suspendUser(
    actor: ActorProfile,
    targetUserId: string,
    reason: string,
    context?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    assertCan(actor, 'suspend_user');

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('A specific reason is required to suspend a user.');
    }

    const supabase = createAdminClient();
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id:user_id, role, status')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetProfile) throw new NotFoundError('Target user not found.');

    assertCan(
      actor,
      'suspend_user',
      {
        id: targetUserId,
        role: targetProfile.role,
        status: targetProfile.status,
      },
      'Admins cannot suspend other admins or the platform owner.'
    );

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('user_id', targetUserId);

    if (error) throw new Error(`Failed to suspend user: ${error.message}`);

    await logAuditEvent({
      actor_id: actor.id,
      action: 'user_suspended',
      target_user_id: targetUserId,
      target_type: 'profile',
      target_id: targetUserId,
      before: { status: targetProfile.status },
      after: { status: 'suspended' },
      reason,
      ip: context?.ip,
      user_agent: context?.userAgent,
    });
  }

  /**
   * Unsuspends a previously suspended user account.
   */
  static async unsuspendUser(
    actor: ActorProfile,
    targetUserId: string,
    reason: string,
    context?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    assertCan(actor, 'unsuspend_user');

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('A specific reason is required to unsuspend a user.');
    }

    const supabase = createAdminClient();
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id:user_id, role, status')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetProfile) throw new NotFoundError('Target user not found.');

    assertCan(
      actor,
      'unsuspend_user',
      {
        id: targetUserId,
        role: targetProfile.role,
        status: targetProfile.status,
      }
    );

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('user_id', targetUserId);

    if (error) throw new Error(`Failed to unsuspend user: ${error.message}`);

    await logAuditEvent({
      actor_id: actor.id,
      action: 'user_unsuspended',
      target_user_id: targetUserId,
      target_type: 'profile',
      target_id: targetUserId,
      before: { status: targetProfile.status },
      after: { status: 'active' },
      reason,
      ip: context?.ip,
      user_agent: context?.userAgent,
    });
  }

  /**
   * Grants a complimentary plan to a user.
   */
  static async grantCompPlan(
    actor: ActorProfile,
    targetUserId: string,
    params: { planId: string; until?: string | null; reason: string },
    context?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    assertCan(actor, 'grant_comp_plan');

    if (!params.reason || params.reason.trim().length === 0) {
      throw new BadRequestError('A reason must be recorded when granting a complimentary plan.');
    }

    const supabase = createAdminClient();
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id:user_id, role, status, plan_id, plan_source')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetProfile) throw new NotFoundError('Target user not found.');

    assertCan(actor, 'grant_comp_plan', {
      id: targetUserId,
      role: targetProfile.role,
      status: targetProfile.status,
    });

    const { error } = await supabase
      .from('profiles')
      .update({
        plan_id: params.planId,
        plan_source: 'comp',
        comp_until: params.until ?? null,
      })
      .eq('user_id', targetUserId);

    if (error) throw new Error(`Failed to grant comp plan: ${error.message}`);

    await logAuditEvent({
      actor_id: actor.id,
      action: 'comp_plan_granted',
      target_user_id: targetUserId,
      target_type: 'profile',
      target_id: targetUserId,
      before: { plan_id: targetProfile.plan_id, plan_source: targetProfile.plan_source },
      after: { plan_id: params.planId, plan_source: 'comp', comp_until: params.until },
      reason: params.reason,
      ip: context?.ip,
      user_agent: context?.userAgent,
    });
  }

  /**
   * Sets a quota override for a user.
   */
  static async setQuotaOverride(
    actor: ActorProfile,
    targetUserId: string,
    params: { limits: Partial<PlanLimits>; reason: string; expiresAt?: string | null },
    context?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    assertCan(actor, 'quota_override');

    if (!params.reason || params.reason.trim().length === 0) {
      throw new BadRequestError('A reason must be recorded when setting a quota override.');
    }

    const supabase = createAdminClient();
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id:user_id, role, status')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetProfile) throw new NotFoundError('Target user not found.');

    assertCan(actor, 'quota_override', {
      id: targetUserId,
      role: targetProfile.role,
      status: targetProfile.status,
    });

    const { error } = await supabase.from('quota_overrides').upsert({
      user_id: targetUserId,
      limits: params.limits,
      reason: params.reason,
      set_by: actor.id,
      expires_at: params.expiresAt ?? null,
    });

    if (error) throw new Error(`Failed to set quota override: ${error.message}`);

    await logAuditEvent({
      actor_id: actor.id,
      action: 'quota_override_set',
      target_user_id: targetUserId,
      target_type: 'quota_override',
      target_id: targetUserId,
      after: { limits: params.limits, expires_at: params.expiresAt },
      reason: params.reason,
      ip: context?.ip,
      user_agent: context?.userAgent,
    });
  }

  /**
   * Promotes or demotes an admin (Owner only).
   */
  static async promoteDemoteAdmin(
    actor: ActorProfile,
    targetUserId: string,
    newRole: 'admin' | 'user',
    reason: string,
    context?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    assertCan(actor, 'promote_demote_admin');

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('Reason is required when changing staff privileges.');
    }

    const supabase = createAdminClient();
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetProfile) throw new NotFoundError('Target user not found.');

    if (targetProfile.role === 'owner') {
      throw new BadRequestError('Cannot change the role of the platform owner.');
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('user_id', targetUserId);

    if (error) throw new Error(`Failed to update user role: ${error.message}`);

    await logAuditEvent({
      actor_id: actor.id,
      action: newRole === 'admin' ? 'admin_promoted' : 'admin_demoted',
      target_user_id: targetUserId,
      target_type: 'profile',
      target_id: targetUserId,
      before: { role: targetProfile.role },
      after: { role: newRole },
      reason,
      ip: context?.ip,
      user_agent: context?.userAgent,
    });
  }

  /**
   * Updates global app settings (kill switch, signups toggle, maintenance mode, ads).
   */
  static async setAppSetting(
    actor: ActorProfile,
    key: 'ai_kill_switch' | 'signups_enabled' | 'maintenance_mode' | 'ads_enabled_global',
    value: boolean,
    reason: string,
    context?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    assertCan(actor, 'toggle_ai_kill_switch');

    const supabase = createAdminClient();
    const { error } = await supabase.from('app_settings').upsert({
      key,
      value,
      updated_by: actor.id,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(`Failed to set application setting: ${error.message}`);

    await logAuditEvent({
      actor_id: actor.id,
      action: 'app_setting_updated',
      target_type: 'app_setting',
      target_id: key,
      after: { key, value },
      reason,
      ip: context?.ip,
      user_agent: context?.userAgent,
    });
  }

  /**
   * Conducts an authorized abuse review on user content.
   * Admins have zero direct RLS access to brands/entries; this specific audit-logged
   * method is the only privacy-guarded route for investigating reported abuse.
   */
  static async conductAbuseReview(
    actor: ActorProfile,
    targetUserId: string,
    reason: string,
    context?: { ip?: string; userAgent?: string }
  ): Promise<{ brands: unknown[]; entries: unknown[] }> {
    assertCan(actor, 'abuse_review');

    if (!reason || reason.trim().length < 5) {
      throw new BadRequestError('A specific investigation reason (minimum 5 characters) is required for abuse review.');
    }

    await logAuditEvent({
      actor_id: actor.id,
      action: 'abuse_review_conducted',
      target_user_id: targetUserId,
      target_type: 'user_content',
      target_id: targetUserId,
      reason,
      ip: context?.ip,
      user_agent: context?.userAgent,
    });

    const supabase = createAdminClient();
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name, what_you_sell, why, tone, slogan, created_at')
      .eq('user_id', targetUserId);

    if (brandsError) throw new Error(`Failed to fetch abuse review brands: ${brandsError.message}`);

    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, brand_id, prompt_template, poster_type, note, status, created_at')
      .eq('user_id', targetUserId);

    if (entriesError) throw new Error(`Failed to fetch abuse review entries: ${entriesError.message}`);

    return {
      brands: brands || [],
      entries: entries || [],
    };
  }

  /**
   * Fetches audit log entries with optional filters.
   */
  static async getAuditLogs(
    actor: ActorProfile,
    filters?: {
      action?: string;
      targetUserId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ logs: unknown[]; total: number }> {
    assertCan(actor, 'view_audit_log');
    const supabase = createAdminClient();

    let query = supabase.from('audit_log').select('*', { count: 'exact' });

    if (filters?.action) query = query.eq('action', filters.action);
    if (filters?.targetUserId) query = query.eq('target_user_id', filters.targetUserId);

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);

    return {
      logs: data || [],
      total: count || 0,
    };
  }
}
