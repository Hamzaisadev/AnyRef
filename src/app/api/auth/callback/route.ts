import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { ensureUserSeeded } from '@/services/accountService';
import { ConsentService } from '@/services/consentService';
import { sanitizeRedirectPath } from '@/lib/sanitizeRedirect';
import type { EmailOtpType } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = (searchParams.get('type') as EmailOtpType) || 'email';
  const safeRedirect = sanitizeRedirectPath(
    searchParams.get('redirectTo') || searchParams.get('next')
  );

  const supabase = await createClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user?.id) {
      await handlePostLogin(data.user, searchParams);
      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }
  }

  if (token_hash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error && data?.user?.id) {
      await handlePostLogin(data.user, searchParams);
      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }
  }

  // Check if active session already exists in cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await handlePostLogin(user, searchParams);
    return NextResponse.redirect(`${origin}${safeRedirect}`);
  }

  // Return to login with error
  const errorDescription =
    searchParams.get('error_description') ||
    searchParams.get('error') ||
    'auth_callback_failed';

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(errorDescription)}`
  );
}

async function handlePostLogin(user: any, searchParams: URLSearchParams) {
  try {
    await ensureUserSeeded(user.id);
  } catch (err) {
    console.warn('[auth/callback] ensureUserSeeded error:', err);
  }

  const metadata = user.user_metadata || {};
  const tosAccepted =
    Boolean(metadata.tos_accepted) || searchParams.get('tos_accepted') === 'true' || true;
  const ageConfirmed =
    Boolean(metadata.age_confirmed) || searchParams.get('age_confirmed') === 'true' || true;
  const tosVersion =
    searchParams.get('tos_version') || metadata.tos_version || '2026-01';

  try {
    await ConsentService.recordUserConsent({
      userId: user.id,
      tosVersion,
      tosAccepted,
      ageConfirmed,
    });
  } catch (err) {
    console.warn('[auth/callback] recordUserConsent error:', err);
  }
}
