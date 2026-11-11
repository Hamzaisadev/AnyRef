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
   * Enforces requestedCount so batch calls cannot exceed daily quota boundaries.
   */
  static async checkDailyQuota(
    userId: string,
    actionType: 'generate_per_day' | 'autofill_per_day' | 'brand_draft_per_day' | 'render_per_day',
    requestedCount: number = 1
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

    const kind =
      actionType === 'generate_per_day'
        ? 'generate'
        : actionType === 'autofill_per_day'
        ? 'autofill'
        : actionType === 'render_per_day'
        ? 'render'
        : 'brand_draft';
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

    if (used + requestedCount > limit) {
      const actionName =
        actionType === 'generate_per_day'
          ? 'prompt generation'
          : actionType === 'autofill_per_day'
          ? 'autofill'
          : actionType === 'render_per_day'
          ? 'poster render'
          : 'brand draft';
      throw new QuotaExceededError(
        `Daily ${actionName} limit reached (${used}/${limit}). Adding ${requestedCount} item(s) would exceed your daily limit. Upgrade to Pro for higher limits or wait for reset at 00:00 UTC.`,
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
   * Enforces per-user calendar-month AI dollar budget.
   * Month window: 1st day of current calendar month at 00:00:00.000 UTC to now.
   * Sums est_cost_usd from ai_usage.
   * Estimates the next call's cost from recent calls of that kind (defaulting to benchmark costs:
   * generate: $0.003493, autofill: $0.001675, brand_draft: $0.001125).
   * If current cost + estimated next cost > budget (or if current cost >= budget),
   * blocks with QuotaExceededError (code: 'MONTHLY_BUDGET_EXCEEDED', statusCode: 429).
   * Staff (owner/admin) resolve to null (unlimited) and are never blocked.
   * Template reuse and Workbench stay fully usable at the limit.
   */
  static async checkMonthlyBudget(
    userId: string,
    actionKind: 'generate' | 'autofill' | 'brand_draft' | 'render' = 'generate'
  ): Promise<void> {
    const entitlements = await getEntitlements(userId);
    const budget = entitlements.limits.monthly_ai_budget_usd;

    // Staff unlimited bypass (null or undefined)
    if (budget === null || budget === undefined) {
      return;
    }

    const now = new Date();
    // 1st of current month at 00:00:00.000 UTC
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    // 1st of next month at 00:00:00.000 UTC
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    const resetDateFormatted = nextMonthStart.toISOString().split('T')[0];

    const supabase = createAdminClient();
    const { data: usageRows } = await supabase
      .from('ai_usage')
      .select('est_cost_usd')
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString());

    const usedCost = (usageRows || []).reduce(
      (acc, r) => acc + Number(r.est_cost_usd || 0),
      0
    );

    // Fallback benchmark costs from docs/spike/cost_benchmark_25_runs.json
    const BENCHMARK_COSTS: Record<string, number> = {
      generate: 0.003493,
      autofill: 0.001675,
      brand_draft: 0.001125,
      // Nano Banana Pro 1K/2K flat rate: ~40x a text call, so this dominates the budget.
      render: 0.134,
    };

    let estimatedNextCost = BENCHMARK_COSTS[actionKind] ?? 0.0035;

    // Query recent calls of this kind for dynamic average
    const { data: recentCalls } = await supabase
      .from('ai_usage')
      .select('est_cost_usd')
      .eq('kind', actionKind)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentCalls && recentCalls.length > 0) {
      const sum = recentCalls.reduce((acc, c) => acc + Number(c.est_cost_usd || 0), 0);
      const observedAverage = sum / recentCalls.length;
      // Never estimate below the known benchmark. For renders the benchmark is a hard
      // per-image floor ($0.134), so a low observed average must not be allowed to
      // wave through a call we cannot cover.
      estimatedNextCost = Math.max(observedAverage, BENCHMARK_COSTS[actionKind] ?? 0);
    }

    // Check if at or above budget, or if the next call would exceed budget
    // Concurrency tolerance note: two concurrent calls can at most overshoot by 1 call (~$0.0035)
    if (usedCost >= budget || (usedCost + estimatedNextCost) > budget) {
      const planName =
        entitlements.planId.charAt(0).toUpperCase() + entitlements.planId.slice(1);
      throw new QuotaExceededError(
        `You have reached your monthly AI creation allowance for your ${planName} plan. Your allowance resets on the first of next month (${resetDateFormatted}). You can continue to edit prompts in the Workbench and reuse your saved templates with zero AI cost.`,
        {
          budget,
          usedCost,
          resetAt: nextMonthStart.toISOString(),
          planId: entitlements.planId,
          code: 'MONTHLY_BUDGET_EXCEEDED',
        },
        'MONTHLY_BUDGET_EXCEEDED'
      );
    }
  }

  /**
   * Enforces the per-user calendar-month render cap.
   *
   * Separate from the dollar budget on purpose: the cap is the number users see and
   * reason about ("60 renders a month"), while the budget is the backstop that
   * protects us if per-image pricing changes underneath us. Both must pass.
   *
   * Only successful renders count. Blocked renders (unresolved prices/dates) and
   * provider failures cost nothing and must not consume a user's allowance.
   */
  static async checkMonthlyRenderCap(userId: string): Promise<void> {
    const entitlements = await getEntitlements(userId);
    const cap = entitlements.limits.render_per_month;

    if (cap === null || cap === undefined) return; // Unlimited staff

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

    const supabase = createAdminClient();
    const { count } = await supabase
      .from('renders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'succeeded')
      .gte('created_at', monthStart.toISOString());

    const used = count || 0;
    if (used >= cap) {
      const planName = entitlements.planId.charAt(0).toUpperCase() + entitlements.planId.slice(1);
      throw new QuotaExceededError(
        `You have used all ${cap} poster renders on your ${planName} plan this month. ` +
          `Your allowance resets on ${nextMonthStart.toISOString().split('T')[0]}. ` +
          `You can still reuse saved Winner templates and export prompts at zero cost.`,
        {
          limit: cap,
          used,
          resetAt: nextMonthStart.toISOString(),
          planId: entitlements.planId,
          code: 'MONTHLY_RENDER_CAP_EXCEEDED',
        },
        'MONTHLY_RENDER_CAP_EXCEEDED'
      );
    }
  }

  /**
   * Checks batch size against the user's plan batch_max limit.
   * For Free plan, batch_max is 1 (batch autofill is not allowed for > 1 items).
   * Pro plan allows up to 5 items per batch; Studio allows up to 10 items.
   * Staff have unlimited batch_max (null).
   */
  static async checkBatchQuota(userId: string, batchSize: number): Promise<void> {
    if (batchSize <= 0) return;
    const entitlements = await getEntitlements(userId);
    const batchMax = entitlements.limits.batch_max;

    if (batchMax === null) return; // Unlimited staff

    if (batchSize > batchMax) {
      throw new QuotaExceededError(
        `Batch size of ${batchSize} exceeds your plan limit (${batchMax} item${batchMax === 1 ? '' : 's'} per batch). Upgrade to a higher tier for batch processing.`,
        { limit: batchMax, used: batchSize, planId: entitlements.planId }
      );
    }
  }

  /**
   * Checks brand capacity quota before creating a new brand.
   */
  static async checkBrandQuota(userId: string): Promise<void> {
    const entitlements = await getEntitlements(userId);
    const limit = entitlements.limits.max_brands;

    if (limit === null) return; // Unlimited staff

    const supabase = createAdminClient();
    const { count } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const brandCount = count || 0;
    if (brandCount >= limit) {
      throw new QuotaExceededError(
        `Brand limit reached (${brandCount}/${limit} brands). Upgrade to Pro or Studio to manage additional distinct brands.`,
        { limit, used: brandCount, planId: entitlements.planId }
      );
    }
  }

  /**
   * Resolves effective entitlements for a user.
   */
  static getEntitlements = getEntitlements;

  /**
   * Checks entry capacity quota before creating a new entry or batch of entries.
   */
  static async checkEntryQuota(userId: string, countToAdd: number = 1): Promise<void> {
    const entitlements = await getEntitlements(userId);
    const limit = entitlements.limits.max_entries;

    if (limit === null) return; // Unlimited staff

    const supabase = createAdminClient();
    const { count } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const entryCount = count || 0;
    if (entryCount + countToAdd > limit) {
      throw new QuotaExceededError(
        `Entry limit reached (${entryCount}/${limit} saved entries). Adding ${countToAdd} item(s) would exceed your plan limit. Upgrade to Pro or Studio to save additional reference entries.`,
        { limit, used: entryCount, planId: entitlements.planId }
      );
    }
  }

  /**
   * Checks cumulative storage usage across references, results, and logos buckets against max_storage_mb.
   */
  static async checkStorageQuota(userId: string, additionalBytes: number): Promise<void> {
    const entitlements = await getEntitlements(userId);
    const maxStorageMb = entitlements.limits.max_storage_mb;

    if (maxStorageMb === null || maxStorageMb === undefined) return; // Unlimited staff

    const maxBytes = maxStorageMb * 1024 * 1024;
    const supabase = createAdminClient();
    const buckets = ['references', 'results', 'logos'] as const;

    let usedBytes = 0;
    for (const bucket of buckets) {
      const { data: files } = await supabase.storage.from(bucket).list(userId);
      if (files) {
        for (const f of files) {
          const fileSize = Number((f.metadata as Record<string, unknown> | null)?.size || 0);
          if (Number.isFinite(fileSize) && fileSize > 0) {
            usedBytes += fileSize;
          }
        }
      }
    }

    if (usedBytes + additionalBytes > maxBytes) {
      const projectedMb = Number(((usedBytes + additionalBytes) / (1024 * 1024)).toFixed(2));
      throw new QuotaExceededError(
        `Storage limit reached (${projectedMb} MB / ${maxStorageMb} MB). Delete unused assets or upgrade to Plus for up to 5,000 MB of storage.`,
        { limit: maxStorageMb, used: usedBytes, planId: entitlements.planId }
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
    kind: 'generate' | 'autofill' | 'brand_draft' | 'render';
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    requestId?: string;
  }): Promise<void> {
    const admin = createAdminClient();
    let { error } = await admin.from('ai_usage').insert({
      user_id: params.userId,
      kind: params.kind,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      est_cost_usd: params.costUsd,
    });

    // If migration 0006_brand_draft.sql has not yet been executed in the remote database,
    // gracefully record telemetry under 'generate' so usage accounting and cost caps remain unbroken.
    if (error && error.code === '23514' && (params.kind === 'brand_draft' || params.kind === 'render')) {
      console.warn(
        `[QuotaService] Migration pending in database for kind "${params.kind}": recording usage under generate until the check constraint is updated. ` +
          `Apply 0009_render_images.sql to restore accurate per-kind accounting.`
      );
      const fallback = await admin.from('ai_usage').insert({
        user_id: params.userId,
        kind: 'generate',
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        est_cost_usd: params.costUsd,
      });
      error = fallback.error;
    }

    if (error) {
      const reqId = params.requestId ? ` [request_id=${params.requestId}]` : '';
      console.error(`[QuotaService] Failed to record AI telemetry${reqId}:`, error);
      throw new Error(`Failed to record AI telemetry: ${error.message}`);
    }
  }
}
