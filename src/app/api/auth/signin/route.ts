import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { ensureUserSeeded } from '@/services/accountService';
import { sanitizeRedirectPath } from '@/lib/sanitizeRedirect';
import { normalizeEmail } from '@/services/passwordPolicy';
import { checkThrottle, clientIp, hashIp, recordAttempt } from '@/services/authThrottle';

export const dynamic = 'force-dynamic';

/**
 * Sign in with email and password.
 *
 * Deliberately server-side rather than calling supabase.auth.signInWithPassword() from
 * the browser: throttling enforced in the client is not throttling, and the attempt log
 * needs the real IP, which the browser cannot be trusted to report.
 */
export async function POST(request: Request) {
  const ip = hashIp(clientIp(request));
  const userAgent = request.headers.get('user-agent');
  let email = '';

  try {
    const body = await request.json().catch(() => ({}));
    const normalized = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const safeRedirect = sanitizeRedirectPath(body.redirectTo);

    // One message for every credential failure, including a malformed address: anything
    // more specific tells an attacker which half they got right.
    const GENERIC = 'That email and password do not match.';

    if (!normalized || !password) {
      return NextResponse.json({ error: GENERIC }, { status: 400 });
    }
    email = normalized;

    const throttle = await checkThrottle('signin', email, ip);
    if (!throttle.allowed) {
      await recordAttempt({ kind: 'signin', email, ipHash: ip, outcome: 'blocked', userAgent });
      const mins = Math.ceil(throttle.retryAfter / 60);
      return NextResponse.json(
        {
          error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}, or reset your password.`,
        },
        { status: 429, headers: { 'Retry-After': String(throttle.retryAfter) } }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data?.user) {
      await recordAttempt({ kind: 'signin', email, ipHash: ip, outcome: 'bad_credentials', userAgent });

      // An account that only ever used a magic link has no password set. Saying so is
      // not a disclosure risk (the person already knows their own address) and it is
      // the difference between "I am locked out" and "oh, right".
      if (/email not confirmed/i.test(error?.message || '')) {
        return NextResponse.json(
          { error: 'Confirm your email address first, then sign in.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: GENERIC }, { status: 400 });
    }

    try {
      await ensureUserSeeded(data.user.id);
    } catch (seedErr) {
      console.warn('[signin] ensureUserSeeded warning:', seedErr);
    }

    await recordAttempt({ kind: 'signin', email, ipHash: ip, outcome: 'ok', userAgent });

    // The SSR client has set the session cookies on this response.
    return NextResponse.json({ ok: true, redirectTo: safeRedirect });
  } catch (err) {
    console.error('[signin] unexpected:', err);
    if (email) {
      await recordAttempt({ kind: 'signin', email, ipHash: ip, outcome: 'error', userAgent });
    }
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
