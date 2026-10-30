import { describe, it, expect } from 'vitest';
import {
  TELEMETRY_EVENTS,
  GA4_KEY_EVENTS,
  scrubPii,
  detectAiReferral,
  generateTraceId,
} from '../../src/lib/telemetry';

describe('Analytics & Telemetry Engine (GA4 + PostHog)', () => {
  it('enforces noun_verb snake_case naming convention across all events', () => {
    const events = Object.values(TELEMETRY_EVENTS);

    // Event names should be lowercase snake_case
    for (const evt of events) {
      expect(evt).toMatch(/^[a-z]+(_[a-z0-9]+)+$/);
      // Ensure no camelCase or PascalCase
      expect(evt).not.toMatch(/[A-Z]/);
      // Ensure no hyphens or spaces
      expect(evt).not.toContain('-');
      expect(evt).not.toContain(' ');
    }
  });

  it('defines all required GA4 key events', () => {
    expect(GA4_KEY_EVENTS.has('signup_completed')).toBe(true);
    expect(GA4_KEY_EVENTS.has('brand_created')).toBe(true);
    expect(GA4_KEY_EVENTS.has('prompt_generation_completed')).toBe(true);
    expect(GA4_KEY_EVENTS.has('prompt_copied')).toBe(true);
    expect(GA4_KEY_EVENTS.has('winner_promoted')).toBe(true);
    expect(GA4_KEY_EVENTS.has('checkout_started')).toBe(true);
    expect(GA4_KEY_EVENTS.has('checkout_completed')).toBe(true);
    expect(GA4_KEY_EVENTS.has('ai_referral_detected')).toBe(true);
  });

  it('scrubs PII such as email addresses, phone numbers, and bearer tokens', () => {
    const rawPayload = {
      user_email: 'designer@company.com',
      contact: 'Call +1 (555) 234-5678 for details',
      auth: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      secret_key: 'supersecretpass123',
      safe_param: 'poster_reference_123',
      nested: {
        customer_email: 'client@studio.design',
        allowed_count: 5,
      },
    };

    const cleaned = scrubPii(rawPayload) as typeof rawPayload;

    expect(cleaned.user_email).toBe('[REDACTED_EMAIL]');
    expect(cleaned.contact).toContain('[REDACTED_PHONE]');
    expect(cleaned.auth).toContain('[REDACTED_TOKEN]');
    expect(cleaned.secret_key).toBe('[REDACTED_SENSITIVE]');
    expect(cleaned.safe_param).toBe('poster_reference_123');
    expect(cleaned.nested.customer_email).toBe('[REDACTED_EMAIL]');
    expect(cleaned.nested.allowed_count).toBe(5);
  });

  it('detects AI assistant referrers (Perplexity, ChatGPT, Claude, Gemini)', () => {
    expect(detectAiReferral('https://www.perplexity.ai/search?q=poster+prompts')).toEqual({
      isAi: true,
      platform: 'perplexity',
    });

    expect(detectAiReferral('https://chatgpt.com/')).toEqual({
      isAi: true,
      platform: 'chatgpt',
    });

    expect(detectAiReferral('https://claude.ai/chat/123')).toEqual({
      isAi: true,
      platform: 'claude',
    });

    expect(detectAiReferral('https://gemini.google.com/app')).toEqual({
      isAi: true,
      platform: 'gemini',
    });

    expect(detectAiReferral('https://www.google.com/search?q=anyref')).toEqual({
      isAi: false,
    });

    expect(detectAiReferral('')).toEqual({
      isAi: false,
    });
  });

  it('generates valid non-empty trace IDs', () => {
    const id1 = generateTraceId();
    const id2 = generateTraceId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });
});
