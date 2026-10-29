import { createClient, createAdminClient } from '../lib/supabaseServer';
import { getEntitlements } from './entitlements';
import { QuotaExceededError, ForbiddenError } from '../lib/errors';
import { logAuditEvent } from '../data/auditRepo';
import type { ActorProfile } from './authz';

export interface QuotaCheckResult {
  allowed: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  resetAt: string;
  planId: string;
}

/**
 * Quota and Circuit Breaker Enforcement Service
 * Enforces per-user daily limits, tier resource caps, and platform-wide emergency kill switches.
 */
export class QuotaService {
  /**
   * Verifies platform circuit breakers (Kill Switch and Daily Cost Cap).
   * Automatically trips the kill switch if cumulative daily cost exceeds the safety cap.
   * Owner test runs are permitted even during active kill switch.
   */
  static async checkCircuitBreaker(actor?: ActorProfile | null): Promise<void> {
    const supabase = createAdminClient();

    // 1. Fetch circuit breaker settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['ai_kill_switch', 'global_daily_cost_cap_usd']);

    const settingsMap = new Map(settings?.map((s) => [s.key, s.value]) || []);
    const isKillSwitchActive = Boolean(settingsMap.get('ai_kill_switch') ?? false);
    const dailyCapUsd = Number(settingsMap.get('global_daily_cost_cap_usd') ?? 10.0);

    // If kill switch is already active, only owner test runs may proceed
    if (isKillSwitchActive) {
      if (actor?.role !== 'owner') {
        throw new ForbiddenError(
          'AI generation is temporarily paused for system safety. Please try again shortly.'
        );
      }
    }

    // 2. Check cumulative spend today
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const { data: usageToday } = await supabase
      .from('ai_usage')
      .select('est_cost_usd')
      .gte('created_at', todayMidnight.toISOString());

    const totalCostToday = (usageToday || []).reduce(
      (acc, r) => acc + Number(r.est_cost_usd || 0),
      0
    );

    // 3. Trip kill switch if daily cost cap is breached
    if (totalCostToday >= dailyCapUsd && !isKillSwitchActive) {
      await supabase.from('app_settings').upsert({
        key: 'ai_kill_switch',
        value: true,
        updated_at: new Date().toISOString(),
      });

      await logAuditEvent({
        action: 'circuit_breaker_tripped',
        target_type: 'app_setting',
        target_id: 'ai_kill_switch',
        reason: `Global daily cost cap ($${dailyCapUsd.toFixed(2)}) reached ($${totalCostToday.toFixed(3)}). Automatic kill switch engaged.`,
      });

      if (actor?.role !== 'owner') {
        throw new ForbiddenError(
          'AI generation is temporarily paused due to daily system capacity limits. Please try again tomorrow.'
        );
      }
    }
  }

  /**
   * Checks daily generation or autofill quota for a given user.
   * Staff (owner/admin) resolve to unlimited (null) and are never blocked.
   */
  static async checkDailyQuota(
    userId: string,
    actionType: 'generate_per_day' | 'autofill_per_day'
  ): Promise<QuotaCheckResult> {
    const entitlements = await getEntitlements(userId);
    const limit = entitlements.limits[actionType];

    // Midnight UTC / tomorrow
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    const resetAt = tomorrow.toISOString();

    // Staff unlimited bypass
    if (limit === null) {
      return {
        allowed: true,
        limit: null,
        used: 0,
        remaining: null,
        resetAt,
        planId: entitlements.planId,
      };
    }

    const kind = actionType === 'generate_per_day' ? 'generate' : 'autofill';
    const supabase = createAdminClient();
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('kind', kind)
      .gte('created_at', todayMidnight.toISOString());

    const used = count || 0;
    const remaining = Math.max(0, limit - used);

    if (used >= limit) {
      const actionName = actionType === 'generate_per_day' ? 'prompt generation' : 'autofill';
      throw new QuotaExceededError(
        `Daily ${actionName} limit reached (${used}/${limit}). Upgrade to Plus for 10x higher limits or wait for reset at 00:00 UTC.`,
        { limit, used, resetAt, planId: entitlements.planId }
      );
    }

    return {
      allowed: true,
      limit,
      used,
      remaining,
      resetAt,
      planId: entitlements.planId,
    };
  }

  /**
   * Checks brand capacity quota before creating a new brand.
   */
  static async checkBrandQuota(userId: string): Promise<void> {
    const entitlements = await getEntitlements(userId);
    const limit = entitlements.limits.max_brands;

    if (limit === null) return; // Unlimited staff

    const supabase = await createClient();
    const { count } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const brandCount = count || 0;
    if (brandCount >= limit) {
      throw new QuotaExceededError(
        `Brand limit reached (${brandCount}/${limit} brands). Upgrade to Plus to manage up to 10 distinct brands.`,
        { limit, used: brandCount, planId: entitlements.planId }
      );
    }
  }

  /**
   * Checks entry capacity quota before creating a new entry.
   */
  static async checkEntryQuota(userId: string): Promise<void> {
    const entitlements = await getEntitlements(userId);
    const limit = entitlements.limits.max_entries;

    if (limit === null) return; // Unlimited staff

    const supabase = await createClient();
    const { count } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const entryCount = count || 0;
    if (entryCount >= limit) {
      throw new QuotaExceededError(
        `Entry limit reached (${entryCount}/${limit} saved entries). Upgrade to Plus to save up to 2,000 reference entries.`,
        { limit, used: entryCount, planId: entitlements.planId }
      );
    }
  }

  /**
   * Records AI usage telemetry in ai_usage.
   * Staff calls are still recorded for complete cost accounting.
   * Fails explicitly if telemetry cannot be recorded — AI usage must never be treated as free.
   */
  static async recordAiUsage(params: {
    userId: string;
    kind: 'generate' | 'autofill';
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    requestId?: string;
  }): Promise<void> {
    const admin = createAdminClient();
    const { error } = await admin.from('ai_usage').insert({
      user_id: params.userId,
      kind: params.kind,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      est_cost_usd: params.costUsd,
    });

    if (error) {
      const reqId = params.requestId ? ` [request_id=${params.requestId}]` : '';
      console.error(`[QuotaService] Failed to record AI telemetry${reqId}:`, error);
      throw new Error(`Failed to record AI telemetry: ${error.message}`);
    }
  }
}
