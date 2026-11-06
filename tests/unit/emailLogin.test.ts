import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/email-login/route';
import * as supabaseServer from '@/lib/supabaseServer';
import * as accountService from '@/services/accountService';
import * as consentService from '@/services/consentService';

describe('Email Login Endpoint (bypassing Supabase SMTP rate limit)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid or missing email with 400', async () => {
    const req = new Request('http://localhost:3000/api/auth/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Please provide a valid email address.');
  });

  it('successfully generates magic link via Admin API without hitting Supabase mail rate limit', async () => {
    const mockGenerateLink = vi.fn().mockResolvedValue({
      data: {
        properties: {
          hashed_token: 'mock_hashed_token_123',
          action_link: 'https://test.supabase.co/auth/v1/verify?token=123',
          email_otp: '654321',
        },
        user: {
          id: 'user-test-id-123',
          email: 'test@example.com',
        },
      },
      error: null,
    });

    const mockAdminClient = {
      auth: {
        admin: {
          generateLink: mockGenerateLink,
        },
      },
    };

    vi.spyOn(supabaseServer, 'createAdminClient').mockReturnValue(mockAdminClient as any);
    vi.spyOn(accountService, 'ensureUserSeeded').mockResolvedValue(undefined);
    vi.spyOn(consentService.ConsentService, 'recordUserConsent').mockResolvedValue(undefined as any);

    const req = new Request('http://localhost:3000/api/auth/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        redirectTo: '/workspace/generate',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.tokenHash).toBe('mock_hashed_token_123');
    expect(data.actionLink).toBe('https://test.supabase.co/auth/v1/verify?token=123');
    expect(data.emailOtp).toBe('654321');
    expect(data.redirectTo).toBe('/workspace/generate');

    expect(mockGenerateLink).toHaveBeenCalledWith({
      type: 'magiclink',
      email: 'test@example.com',
      options: {
        redirectTo: 'http://localhost:3000/api/auth/callback?redirectTo=%2Fworkspace%2Fgenerate',
      },
    });

    expect(accountService.ensureUserSeeded).toHaveBeenCalledWith('user-test-id-123');
    expect(consentService.ConsentService.recordUserConsent).toHaveBeenCalledWith({
      userId: 'user-test-id-123',
      tosVersion: '2026-01',
      tosAccepted: true,
      ageConfirmed: true,
    });
  });

  it('handles admin generateLink errors gracefully', async () => {
    const mockAdminClient = {
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        },
      },
    };

    vi.spyOn(supabaseServer, 'createAdminClient').mockReturnValue(mockAdminClient as any);

    const req = new Request('http://localhost:3000/api/auth/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Database connection failed');
  });
});
