import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';
import { ensureUserSeeded } from '@/services/accountService';
import { ConsentService } from '@/services/consentService';
import { sanitizeRedirectPath } from '@/lib/sanitizeRedirect';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const safeRedirect = sanitizeRedirectPath(body.redirectTo);

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const origin = new URL(request.url).origin;
    const callbackUrl = `${origin}/api/auth/callback?redirectTo=${encodeURIComponent(safeRedirect)}`;

    // Generating the link via Supabase Admin API bypasses the project-wide email rate limiter,
    // because no SMTP email is dispatched through Supabase's shared mailer.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error || !data?.properties) {
      return NextResponse.json(
        { error: error?.message || 'Failed to generate sign-in link.' },
        { status: 400 }
      );
    }

    const userId = data.user?.id;
    if (userId) {
      try {
        await ensureUserSeeded(userId);
      } catch (seedErr) {
        console.warn('[email-login] ensureUserSeeded warning:', seedErr);
      }

      try {
        await ConsentService.recordUserConsent({
          userId,
          tosVersion: '2026-01',
          tosAccepted: true,
          ageConfirmed: true,
        });
      } catch (consentErr) {
        console.warn('[email-login] recordUserConsent warning:', consentErr);
      }
    }

    return NextResponse.json({
      success: true,
      tokenHash: data.properties.hashed_token,
      actionLink: data.properties.action_link,
      emailOtp: data.properties.email_otp,
      redirectTo: safeRedirect,
    });
  } catch (err: any) {
    console.error('[email-login] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
