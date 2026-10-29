import crypto from 'crypto';
import { createClient, createAdminClient } from '../lib/supabaseServer';
import { logAuditEvent } from '../data/auditRepo';
import { BadRequestError } from '../lib/errors';

export interface StandardBillingEvent {
  eventId: string;
  type: 'subscription.created' | 'subscription.updated' | 'subscription.canceled';
  userId: string;
  customerId: string;
  subscriptionId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd?: string;
  timestamp: string;
}

export interface BillingProvider {
  name: string;
  createCheckoutSession(params: {
    userId: string;
    planId: string;
    email: string;
    returnUrl: string;
  }): Promise<{ checkoutUrl: string }>;
  createCustomerPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ portalUrl: string }>;
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean;
  parseWebhookEvent(payload: unknown): StandardBillingEvent;
}

/**
 * Default Merchant-of-Record Mock / Standard HMAC Provider Adapter
 */
export class StandardMoRBillingProvider implements BillingProvider {
  public readonly name = 'mor_standard';

  async createCheckoutSession(_params: {
    userId: string;
    planId: string;
    email: string;
    returnUrl: string;
  }): Promise<{ checkoutUrl: string }> {
    throw new BadRequestError('Paid checkout is not yet active. Plus tier is coming soon.');
  }

  async createCustomerPortalSession(_params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ portalUrl: string }> {
    throw new BadRequestError('Customer portal is not yet active.');
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: unknown): StandardBillingEvent {
    const data = payload as Record<string, unknown>;
    const event = data.event as Record<string, unknown>;
    const sub = (data.data || {}) as Record<string, unknown>;

    return {
      eventId: String(data.event_id || event?.id || data.id),
      type: (data.type || event?.type || 'subscription.updated') as StandardBillingEvent['type'],
      userId: String(sub.user_id || sub.custom_user_id || data.user_id),
      customerId: String(sub.customer_id || data.customer_id),
      subscriptionId: String(sub.id || sub.subscription_id || data.subscription_id),
      planId: String(sub.plan_id || data.plan_id || 'plus'),
      status: (sub.status || data.status || 'active') as StandardBillingEvent['status'],
      currentPeriodEnd: sub.current_period_end ? String(sub.currentPeriodEnd) : undefined,
      timestamp: String(data.created_at || new Date().toISOString()),
    };
  }
}

let activeBillingProvider: BillingProvider = new StandardMoRBillingProvider();

export function setBillingProvider(provider: BillingProvider): void {
  activeBillingProvider = provider;
}

export function getBillingProvider(): BillingProvider {
  return activeBillingProvider;
}

/**
 * Synchronizes user plan status across the system.
 * This is the SINGLE authoritative function that mutates profiles.plan_id.
 */
export async function syncPlan(
  userId: string,
  planId: string,
  planSource: 'default' | 'subscription' | 'comp'
): Promise<void> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_id, plan_source')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return;

  const { error } = await supabase
    .from('profiles')
    .update({
      plan_id: planId,
      plan_source: planSource,
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to sync user plan: ${error.message}`);
  }

  await logAuditEvent({
    action: 'plan_synced',
    target_user_id: userId,
    target_type: 'profile',
    target_id: userId,
    before: { plan_id: profile.plan_id, plan_source: profile.plan_source },
    after: { plan_id: planId, plan_source: planSource },
    reason: `Automated plan sync from billing engine (${planSource})`,
  });
}

/**
 * Processes incoming billing webhooks with raw signature verification,
 * database idempotency, and out-of-order event protection.
 */
export async function processWebhookEvent(params: {
  provider: string;
  rawBody: string;
  signature: string;
  secret: string;
}): Promise<{ status: 'processed' | 'already_processed' | 'ignored_out_of_order' }> {
  const billingProvider = getBillingProvider();

  // 1. Raw-body signature check
  const isValid = billingProvider.verifyWebhookSignature(
    params.rawBody,
    params.signature,
    params.secret
  );

  if (!isValid) {
    throw new BadRequestError('Invalid webhook signature verification.');
  }

  // 2. Parse payload
  let payload: unknown;
  try {
    payload = JSON.parse(params.rawBody);
  } catch {
    throw new BadRequestError('Invalid JSON webhook body.');
  }

  const event = billingProvider.parseWebhookEvent(payload);
  const supabase = createAdminClient();

  // 3. Database Idempotency Check via webhook_events
  const { error: insertErr } = await supabase.from('webhook_events').insert({
    provider: params.provider,
    event_id: event.eventId,
    payload,
    received_at: new Date().toISOString(),
  });

  if (insertErr) {
    // Primary key violation indicates this event has already been recorded
    if (insertErr.code === '23505') {
      return { status: 'already_processed' };
    }
    throw new Error(`Failed to store webhook event: ${insertErr.message}`);
  }

  // 4. Out-of-order protection against existing subscription state
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('last_event_at')
    .eq('provider_subscription_id', event.subscriptionId)
    .maybeSingle();

  if (existingSub && new Date(existingSub.last_event_at) >= new Date(event.timestamp)) {
    // Event is older than last processed event
    return { status: 'ignored_out_of_order' };
  }

  // 5. Upsert subscription record
  await supabase.from('subscriptions').upsert({
    user_id: event.userId,
    provider: params.provider,
    provider_customer_id: event.customerId,
    provider_subscription_id: event.subscriptionId,
    plan_id: event.planId,
    status: event.status,
    current_period_end: event.currentPeriodEnd,
    last_event_at: event.timestamp,
    updated_at: new Date().toISOString(),
  });

  // 6. Synchronize user profile plan
  if (event.status === 'active') {
    await syncPlan(event.userId, event.planId, 'subscription');
  } else if (event.status === 'canceled') {
    await syncPlan(event.userId, 'free', 'default');
  }

  // 7. Mark webhook processed
  await supabase
    .from('webhook_events')
    .update({ processed_at: new Date().toISOString() })
    .match({ provider: params.provider, event_id: event.eventId });

  return { status: 'processed' };
}
