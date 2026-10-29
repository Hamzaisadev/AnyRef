import { describe, it, expect } from 'vitest';
import { validateEnv } from '@/lib/env';

describe('validateEnv (Seam 1: Environment Validation)', () => {
  const validBaseEnv = {
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    AI_PROVIDER: 'gemini',
    AI_MODEL: 'gemini-1.5-pro',
    GEMINI_API_KEY: 'test-gemini-key',
    AI_DAILY_CALL_LIMIT: '50',
    AI_DAILY_COST_CAP_USD: '2.00',
    MAX_UPLOAD_MB: '10',
  };

  it('successfully validates and coerces valid environment variables', () => {
    const result = validateEnv(validBaseEnv);
    expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321');
    expect(result.AI_PROVIDER).toBe('gemini');
    expect(result.AI_DAILY_CALL_LIMIT).toBe(50);
    expect(result.AI_DAILY_COST_CAP_USD).toBe(2.0);
    expect(result.MAX_UPLOAD_MB).toBe(10);
  });

  it('fails fast when required Supabase keys are missing', () => {
    const invalidEnv = { ...validBaseEnv, NEXT_PUBLIC_SUPABASE_URL: undefined };
    expect(() => validateEnv(invalidEnv)).toThrow();
  });

  it('fails when GEMINI_API_KEY is missing while AI_PROVIDER is gemini', () => {
    const invalidEnv = { ...validBaseEnv, GEMINI_API_KEY: '' };
    expect(() => validateEnv(invalidEnv)).toThrow();
  });

  it('accepts NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in place of ANON_KEY', () => {
    const envWithPublishableKey = {
      ...validBaseEnv,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
    };
    const result = validateEnv(envWithPublishableKey);
    expect(result.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe('sb_publishable_test_key');
    expect(result.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('sb_publishable_test_key');
  });

  it('rejects unsupported AI_PROVIDER values', () => {
    const invalidEnv = { ...validBaseEnv, AI_PROVIDER: 'unsupported-ai' };
    expect(() => validateEnv(invalidEnv)).toThrow();
  });

  describe('Production Secret Enforcement (S1-10)', () => {
    const validProdEnv = {
      ...validBaseEnv,
      NODE_ENV: 'production',
      SUPABASE_SERVICE_ROLE_KEY: 'distinct-prod-service-role-secret-key-12345',
      CRON_SECRET: 'prod-cron-secret-xyz-7890',
      BILLING_WEBHOOK_SECRET: 'prod-billing-webhook-secret-abc-4567',
    };

    it('successfully validates when all production secrets are valid and distinct', () => {
      const result = validateEnv(validProdEnv);
      expect(result.CRON_SECRET).toBe('prod-cron-secret-xyz-7890');
      expect(result.BILLING_WEBHOOK_SECRET).toBe('prod-billing-webhook-secret-abc-4567');
      expect(result.SUPABASE_SERVICE_ROLE_KEY).toBe('distinct-prod-service-role-secret-key-12345');
    });

    it('rejects production boot without CRON_SECRET or with test placeholder', () => {
      expect(() => validateEnv({ ...validProdEnv, CRON_SECRET: undefined })).toThrow(
        /CRON_SECRET is required/i
      );
      expect(() => validateEnv({ ...validProdEnv, CRON_SECRET: 'test_cron_secret' })).toThrow(
        /CRON_SECRET is required/i
      );
    });

    it('rejects production boot without BILLING_WEBHOOK_SECRET or with test placeholder', () => {
      expect(() => validateEnv({ ...validProdEnv, BILLING_WEBHOOK_SECRET: undefined })).toThrow(
        /BILLING_WEBHOOK_SECRET is required/i
      );
      expect(() =>
        validateEnv({ ...validProdEnv, BILLING_WEBHOOK_SECRET: 'test_webhook_secret' })
      ).toThrow(/BILLING_WEBHOOK_SECRET is required/i);
    });

    it('rejects production boot when SUPABASE_SERVICE_ROLE_KEY is identical to anon key', () => {
      expect(() =>
        validateEnv({
          ...validProdEnv,
          SUPABASE_SERVICE_ROLE_KEY: validProdEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        })
      ).toThrow(/SUPABASE_SERVICE_ROLE_KEY must be a distinct/i);
    });
  });
});
