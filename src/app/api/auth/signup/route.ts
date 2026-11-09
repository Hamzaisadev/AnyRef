import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';
import { ensureUserSeeded } from '@/services/accountService';
import { ConsentService } from '@/services/consentService';
import { sanitizeRedirectPath } from '@/lib/sanitizeRedirect';
import { checkPassword, normalizeEmail } from '@/services/passwordPolicy';
import { checkThrottle, clientIp, hashIp, recordAttempt } from '@/services/authThrottle';

export const dynamic = 'force-dynamic';

/**
 * Create an account with an email and a password, and sign in immediately.
 *
 * The password is handed straight to Supabase Auth, which stores a bcrypt hash with a
 * per-user salt in `auth.users`. It is never written to our tables, never logged, and
 * never leaves this request.
 *
 * No email confirmation gate: the account works the moment it is created. Verification
 * is collected later, only before actions that need it.
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

    if (!normalized) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    email = normalized;

    const verdict = checkPassword(password, email);
    if (!verdict.ok) {
      // Policy failures are the user's own password, so naming the problem is safe
      // and is the only way they can fix it.
      return NextResponse.json(
        { error: verdict.problems[0], problems: verdict.problems },
        { status: 400 }
      );
    }

    const throttle = await checkThrottle('signup', email, ip);
    if (!throttle.allowed) {
      await recordAttempt({ kind: 'signup', email, ipHash: ip, outcome: 'blocked', userAgent });
      return NextResponse.json(
        { error: 'Too many sign-up attempts. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(throttle.retryAfter) } }
      );
    }

    // Is signup open? The owner can pause it from the admin panel.
    const admin = createAdminClient();
    const { data: setting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'signups_enabled')
      .maybeSingle();
    if (setting && setting.value === false) {
      return NextResponse.json(
        { error: 'New sign-ups are paused right now. Please check back soon.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { auth_method: 'password' } },
    });

    if (error) {
      await recordAttempt({ kind: 'signup', email, ipHash: ip, outcome: 'error', userAgent });

      // Supabase reports an existing address as a generic error. Say something useful
      // without confirming whether the address is registered.
      const msg = /already|registered|exists/i.test(error.message)
        ? 'That email may already have an account. Try signing in instead.'
        : error.message || 'Could not create the account.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const user = data.user;
    if (!user) {
      await recordAttempt({ kind: 'signup', email, ipHash: ip, outcome: 'error', userAgent });
      return NextResponse.json({ error: 'Could not create the account.' }, { status: 400 });
    }

    // Seeding and consent must not fail the signup: the account exists either way, and
    // a user stuck behind a seeding error would have no way forward.
    try {
      await ensureUserSeeded(user.id);
    } catch (seedErr) {
      console.warn('[signup] ensureUserSeeded warning:', seedErr);
    }

    try {
      await ConsentService.recordUserConsent({
        userId: user.id,
        tosVersion: '2026-01',
        tosAccepted: true,
        ageConfirmed: true,
      });
    } catch (consentErr) {
      console.warn('[signup] recordUserConsent warning:', consentErr);
    }

    try {
      await admin.from('profiles').update({ auth_method: 'password' }).eq('user_id', user.id);
    } catch {
      // Informational column only.
    }

    await recordAttempt({ kind: 'signup', email, ipHash: ip, outcome: 'ok', userAgent });

    // signUp sets the session cookies through the SSR client, so the browser is already
    // signed in when this returns. No confirmation step, no inbox.
    return NextResponse.json({ ok: true, redirectTo: safeRedirect });
  } catch (err) {
    console.error('[signup] unexpected:', err);
    if (email) {
      await recordAttempt({ kind: 'signup', email, ipHash: ip, outcome: 'error', userAgent });
    }
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
