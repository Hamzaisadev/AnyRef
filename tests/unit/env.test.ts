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

  it('rejects unsupported AI_PROVIDER values', () => {
    const invalidEnv = { ...validBaseEnv, AI_PROVIDER: 'unsupported-ai' };
    expect(() => validateEnv(invalidEnv)).toThrow();
  });
});
