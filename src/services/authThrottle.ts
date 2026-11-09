import { createHash } from 'crypto';
import { createAdminClient } from '../lib/supabaseServer';

/**
 * Throttling for the password endpoints.
 *
 * Two independent limits, because they stop different attacks:
 *  - per email: someone guessing one account's password
 *  - per IP:    someone spraying one common password across many accounts
 *
 * Both are counted from `auth_attempts`, which only the service role can read.
 */

export type AttemptKind = 'signin' | 'signup' | 'reset';
export type AttemptOutcome = 'ok' | 'bad_credentials' | 'blocked' | 'error';

/** Window and ceiling per kind. Signup is tighter: one person needs one account. */
const LIMITS: Record<AttemptKind, { perEmail: number; perIp: number; windowMin: number }> = {
  signin: { perEmail: 8, perIp: 30, windowMin: 15 },
  signup: { perEmail: 3, perIp: 10, windowMin: 60 },
  reset: { perEmail: 3, perIp: 10, windowMin: 60 },
};

export interface ThrottleResult {
  allowed: boolean;
  /** Seconds until the oldest attempt in the window expires. */
  retryAfter: number;
  reason?: 'email' | 'ip';
}

/**
 * IPs are hashed before storage: the table is kept for 30 days and a raw IP is personal
 * data we have no reason to hold. A server-side pepper stops the hash being reversed with
 * a rainbow table of the whole IPv4 space.
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const pepper = process.env.CRON_SECRET || 'anyref-local-pepper';
  return createHash('sha256').update(`${pepper}:${ip}`).digest('hex').slice(0, 32);
}

/** Best-effort client IP from the proxy headers Vercel and most hosts set. */
export function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || null;
  return req.headers.get('x-real-ip');
}

export async function checkThrottle(
  kind: AttemptKind,
  email: string,
  ipHash: string | null
): Promise<ThrottleResult> {
  const limit = LIMITS[kind];
  const since = new Date(Date.now() - limit.windowMin * 60_000).toISOString();
  const admin = createAdminClient();

  try {
    // Only failures count toward the limit. A person who signs in correctly ten times
    // in a row is not an attacker, and locking them out would be the bug.
    const { data: byEmail } = await admin
      .from('auth_attempts')
      .select('created_at')
      .eq('email', email)
      .eq('kind', kind)
      .neq('outcome', 'ok')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (byEmail && byEmail.length >= limit.perEmail) {
      return { allowed: false, retryAfter: retryIn(byEmail[0]!.created_at, limit.windowMin), reason: 'email' };
    }

    if (ipHash) {
      const { data: byIp } = await admin
        .from('auth_attempts')
        .select('created_at')
        .eq('ip_hash', ipHash)
        .eq('kind', kind)
        .neq('outcome', 'ok')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (byIp && byIp.length >= limit.perIp) {
        return { allowed: false, retryAfter: retryIn(byIp[0]!.created_at, limit.windowMin), reason: 'ip' };
      }
    }

    return { allowed: true, retryAfter: 0 };
  } catch (err) {
    // A throttle that fails closed would lock everyone out of a working product the
    // moment the table is unreachable. Log and allow; Supabase Auth still rate-limits.
    console.warn('[authThrottle] check failed, allowing request:', err);
    return { allowed: true, retryAfter: 0 };
  }
}

export async function recordAttempt(params: {
  kind: AttemptKind;
  email: string;
  ipHash: string | null;
  outcome: AttemptOutcome;
  userAgent?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('auth_attempts').insert({
      email: params.email,
      ip_hash: params.ipHash,
      kind: params.kind,
      outcome: params.outcome,
      user_agent: params.userAgent?.slice(0, 300) ?? null,
    });
  } catch (err) {
    // Telemetry must never break a sign-in.
    console.warn('[authThrottle] record failed:', err);
  }
}

function retryIn(oldestIso: string, windowMin: number): number {
  const expires = new Date(oldestIso).getTime() + windowMin * 60_000;
  return Math.max(1, Math.ceil((expires - Date.now()) / 1000));
}
