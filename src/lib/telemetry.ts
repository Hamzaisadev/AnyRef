/**
 * AnyRef Unified Telemetry & Analytics Engine
 * Implements GA4 (dataLayer / GTM) and PostHog dual-dispatch with distributed tracing,
 * PII sanitization, Consent Mode v2 awareness, and AI referral attribution.
 */

export const TELEMETRY_EVENTS = {
  // 1. Marketing & Acquisition
  LANDING_PAGE_VIEWED: 'landing_page_viewed',
  AI_REFERRAL_DETECTED: 'ai_referral_detected',
  DEMO_SLOT_INTERACTED: 'demo_slot_interacted',
  PRICING_TABLE_VIEWED: 'pricing_table_viewed',
  FAQ_ITEM_EXPANDED: 'faq_item_expanded',
  CTA_BUTTON_CLICKED: 'cta_button_clicked',
  UTM_CAMPAIGN_CAPTURED: 'utm_campaign_captured',

  // 2. Consent & Auth
  CONSENT_BANNER_VIEWED: 'consent_banner_viewed',
  CONSENT_STATE_UPDATED: 'consent_state_updated',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT_COMPLETED: 'logout_completed',
  ACCOUNT_DELETION_REQUESTED: 'account_deletion_requested',

  // 3. Brand Lifecycle
  BRAND_CREATE_STARTED: 'brand_create_started',
  BRAND_DRAFT_GENERATED: 'brand_draft_generated',
  BRAND_CREATED: 'brand_created',
  BRAND_UPDATED: 'brand_updated',
  BRAND_SWITCHED: 'brand_switched',
  BRAND_DELETED: 'brand_deleted',

  // 4. Reference Poster & Prompt Generation (Core Value Loop)
  REFERENCE_POSTER_UPLOADED: 'reference_poster_uploaded',
  LAYOUT_FIT_WARNING_TRIGGERED: 'layout_fit_warning_triggered',
  PROMPT_GENERATION_STARTED: 'prompt_generation_started',
  PROMPT_GENERATION_COMPLETED: 'prompt_generation_completed',
  PROMPT_GENERATION_FAILED: 'prompt_generation_failed',

  // 5. Slot Customization & Autofill
  SLOT_DRAWER_OPENED: 'slot_drawer_opened',
  SLOT_VALUE_CHANGED: 'slot_value_changed',
  NEVER_INVENT_SLOT_FILLED: 'never_invent_slot_filled',
  AUTOFILL_REQUESTED: 'autofill_requested',
  AUTOFILL_COMPLETED: 'autofill_completed',
  PROMPT_COMPILED: 'prompt_compiled',

  // 6. External Execution & Export
  PROMPT_COPIED: 'prompt_copied',
  ATTACH_CHECKLIST_COPIED: 'attach_checklist_copied',
  GENERATOR_LINK_CLICKED: 'generator_link_clicked',

  // 7. Result Verification & Winner Promotion
  RESULT_POSTER_UPLOADED: 'result_poster_uploaded',
  VISUAL_COMPARISON_VIEWED: 'visual_comparison_viewed',
  ENTRY_STATUS_UPDATED: 'entry_status_updated',
  WINNER_PROMOTED: 'winner_promoted',
  ENTRY_REMIXED: 'entry_remixed',

  // 8. Monetization & Quotas
  QUOTA_WARNING_DISPLAYED: 'quota_warning_displayed',
  QUOTA_LIMIT_EXCEEDED: 'quota_limit_exceeded',
  UPGRADE_MODAL_OPENED: 'upgrade_modal_opened',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  COMP_PLAN_GRANTED: 'comp_plan_granted',

  // 9. System & Observability
  CLIENT_ERROR_CAPTURED: 'client_error_captured',
  WEB_VITAL_REPORTED: 'web_vital_reported',
} as const;

export type TelemetryEventName =
  (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS];

/**
 * GA4 Key Events list (formerly conversions)
 */
export const GA4_KEY_EVENTS = new Set<string>([
  TELEMETRY_EVENTS.SIGNUP_COMPLETED,
  TELEMETRY_EVENTS.BRAND_CREATED,
  TELEMETRY_EVENTS.PROMPT_GENERATION_COMPLETED,
  TELEMETRY_EVENTS.PROMPT_COPIED,
  TELEMETRY_EVENTS.WINNER_PROMOTED,
  TELEMETRY_EVENTS.CHECKOUT_STARTED,
  TELEMETRY_EVENTS.CHECKOUT_COMPLETED,
  TELEMETRY_EVENTS.AI_REFERRAL_DETECTED,
]);

export interface TelemetryPayload {
  [key: string]: string | number | boolean | null | undefined | string[];
}

export interface TraceContext {
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
  userId?: string | null;
  role?: string;
  planId?: string;
}

export interface ServerTraceLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  traceId: string;
  spanId: string;
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  actor?: {
    userId?: string | null;
    role?: string;
    planId?: string;
  };
  aiTelemetry?: {
    model: string;
    purpose: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    estCostUsd?: number;
    latencyMs?: number;
  };
  context?: Record<string, unknown>;
  error?: string;
}

// Regex patterns to scrub PII from analytics payloads
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const BEARER_AUTH_REGEX = /Bearer\s+[A-Za-z0-9-_=.]+/gi;

/**
 * Strips personally identifiable information (PII) before telemetry ingestion
 */
export function scrubPii<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return data
      .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
      .replace(PHONE_REGEX, '[REDACTED_PHONE]')
      .replace(BEARER_AUTH_REGEX, 'Bearer [REDACTED_TOKEN]') as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => scrubPii(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      // Drop explicitly forbidden raw credential fields
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('credit_card') ||
        lowerKey.includes('cvv') ||
        lowerKey.includes('ssn')
      ) {
        cleaned[key] = '[REDACTED_SENSITIVE]';
      } else {
        cleaned[key] = scrubPii(value);
      }
    }
    return cleaned as T;
  }

  return data;
}

/**
 * AI Assistant Referrer Detection matching GA4 May 2026 specifications
 */
const AI_REFERRER_REGEX =
  /^(chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|www\.perplexity\.ai|gemini\.google\.com|bard\.google\.com|claude\.ai|copilot\.microsoft\.com|edgeservices\.bing\.com|chat\.deepseek\.com|grok\.com|meta\.ai|chat\.mistral\.ai|you\.com|phind\.com)$/i;

export function detectAiReferral(referrer: string): {
  isAi: boolean;
  platform?: string;
} {
  if (!referrer) return { isAi: false };
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    if (AI_REFERRER_REGEX.test(hostname)) {
      let platform = 'other_ai';
      if (hostname.includes('openai') || hostname.includes('chatgpt'))
        platform = 'chatgpt';
      else if (hostname.includes('perplexity')) platform = 'perplexity';
      else if (hostname.includes('claude')) platform = 'claude';
      else if (hostname.includes('gemini') || hostname.includes('bard'))
        platform = 'gemini';
      else if (hostname.includes('copilot') || hostname.includes('bing'))
        platform = 'copilot';
      else if (hostname.includes('deepseek')) platform = 'deepseek';
      else if (hostname.includes('grok')) platform = 'grok';

      return { isAi: true, platform };
    }
  } catch {
    // Ignore malformed referrer URLs
  }
  return { isAi: false };
}

/**
 * Generates an RFC4122 compliant Trace ID
 */
export function generateTraceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'trace_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Client-Side Dispatcher
 * Sends sanitized events to GA4 (via window.dataLayer) and PostHog (via window.posthog).
 */
export function trackClientEvent(
  event: TelemetryEventName | string,
  properties: TelemetryPayload = {}
): void {
  if (typeof window === 'undefined') return;

  // Check consent status
  const consent = localStorage.getItem('anyref_cookie_consent');
  const isDenied = consent === 'essential';

  const sanitized = scrubPii(properties);
  const isKey = GA4_KEY_EVENTS.has(event);

  const enrichedPayload = {
    ...sanitized,
    event,
    timestamp: new Date().toISOString(),
    is_key_event: isKey,
    consent_mode: isDenied ? 'basic_denied' : 'granted',
  };

  // 1. Dispatch to window.dataLayer for GTM / GA4
  const win = window as unknown as {
    dataLayer?: unknown[];
    posthog?: { capture: (evt: string, props: unknown) => void };
  };

  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push(enrichedPayload);

  // 2. Dispatch to PostHog if initialized
  if (win.posthog && typeof win.posthog.capture === 'function') {
    win.posthog.capture(event, enrichedPayload);
  }

  // 3. Emit local synthetic event for Superadmin Live Inspector (/admin/events)
  try {
    const customEvt = new CustomEvent('anyref_telemetry_event', {
      detail: enrichedPayload,
    });
    window.dispatchEvent(customEvt);
  } catch {
    // In environments that do not support CustomEvent
  }

  // Debug log in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Telemetry] ${event}`, enrichedPayload);
  }
}

/**
 * Server-Side Structured Trace Logger
 * Emits JSON log formatted for OpenTelemetry / cloud log aggregators
 */
export function logServerTrace(trace: ServerTraceLog): void {
  const jsonLog = JSON.stringify(trace);
  if (trace.level === 'ERROR') {
    console.error(jsonLog);
  } else if (trace.level === 'WARN') {
    console.warn(jsonLog);
  } else {
    console.log(jsonLog);
  }
}
