import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';
import { checkPassword, normalizeEmail } from '@/services/passwordPolicy';
import { checkThrottle, clientIp, hashIp, recordAttempt } from '@/services/authThrottle';

export const dynamic = 'force-dynamic';

/**
 * Password reset, in two phases.
 *
 * POST { email }                -> send a reset link
 * POST { password } + session   -> set the new password for the signed-in recovery session
 *
 * The second phase relies on Supabase putting the browser into a short-lived recovery
 * session when the emailed link is opened, so no token is handled by our code.
 */
export async function POST(request: Request) {
  const ip = hashIp(clientIp(request));
  const userAgent = request.headers.get('user-agent');

  try {
    const body = await request.json().catch(() => ({}));

    // ---- Phase 2: a signed-in recovery session is setting a new password ----
    if (typeof body.password === 'string' && body.password.length > 0) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: 'That reset link has expired. Request a new one.' },
          { status: 401 }
        );
      }

      const verdict = checkPassword(body.password, user.email ?? undefined);
      if (!verdict.ok) {
        return NextResponse.json(
          { error: verdict.problems[0], problems: verdict.problems },
          { status: 400 }
        );
      }

      const { error } = await supabase.auth.updateUser({ password: body.password });
      if (error) {
        return NextResponse.json(
          { error: error.message || 'Could not update the password.' },
          { status: 400 }
        );
      }

      // The account now has a password even if it was created by magic link.
      try {
        const admin = createAdminClient();
        await admin.from('profiles').update({ auth_method: 'password' }).eq('user_id', user.id);
      } catch {
        // Informational column only.
      }

      return NextResponse.json({ ok: true });
    }

    // ---- Phase 1: request a reset link ----
    const email = normalizeEmail(body.email);

    // Always report success. Telling an anonymous caller whether an address is
    // registered turns this endpoint into an account-enumeration oracle.
    const SILENT_OK = NextResponse.json({
      ok: true,
      message: 'If that address has an account, a reset link is on its way.',
    });

    if (!email) return SILENT_OK;

    const throttle = await checkThrottle('reset', email, ip);
    if (!throttle.allowed) {
      await recordAttempt({ kind: 'reset', email, ipHash: ip, outcome: 'blocked', userAgent });
      return SILENT_OK; // Still silent: a 429 here would also leak existence.
    }

    const origin = new URL(request.url).origin;
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset`,
    });

    await recordAttempt({
      kind: 'reset',
      email,
      ipHash: ip,
      outcome: error ? 'error' : 'ok',
      userAgent,
    });

    return SILENT_OK;
  } catch (err) {
    console.error('[reset] unexpected:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
