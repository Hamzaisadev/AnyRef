/**
 * Password rules, kept in one place so the signup route, the reset route and the client
 * all agree on what "strong enough" means.
 *
 * Hashing is NOT done here. Supabase Auth stores a bcrypt hash with a per-user salt, so
 * a plaintext password never reaches our database or our logs. This module only decides
 * whether a candidate password is acceptable before we hand it over.
 */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 72; // bcrypt truncates beyond 72 bytes; reject rather than silently cut

export interface PasswordCheck {
  ok: boolean;
  /** Problems, in the order a person should fix them. */
  problems: string[];
  /** 0-4, for the strength meter. Not a security control, just feedback. */
  score: number;
}

/**
 * The 30 most-used passwords of the last decade, plus the obvious product-specific ones.
 * A real deployment should check Have I Been Pwned's k-anonymity range API; this list
 * catches the cases that actually show up in small-product signup logs.
 */
const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwertyuiop', 'qwerty123', 'iloveyou', 'princess', 'admin123', 'welcome1',
  'welcome123', 'monkey123', 'dragon123', 'sunshine1', 'football1', 'baseball1',
  'letmein123', 'trustno1', 'superman1', 'michael1', 'shadow123', 'master123',
  'abcd1234', 'abc12345', 'passw0rd', 'p@ssw0rd', 'changeme', 'secret123',
  'anyref', 'anyref123', 'anyrefpassword',
]);

export function checkPassword(password: string, email?: string): PasswordCheck {
  const problems: string[] = [];
  const pw = password ?? '';

  if (pw.length < PASSWORD_MIN) {
    problems.push(`Use at least ${PASSWORD_MIN} characters.`);
  }
  if (pw.length > PASSWORD_MAX) {
    problems.push(`Keep it under ${PASSWORD_MAX} characters.`);
  }

  const lower = pw.toLowerCase();

  if (COMMON.has(lower)) {
    problems.push('That is one of the most common passwords in the world. Pick another.');
  }

  // A password containing the local part of the email is trivially guessable.
  const local = email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 3 && lower.includes(local)) {
    problems.push('Do not put your email address in your password.');
  }

  // Single repeated character, or a straight run like "abcdefghij" / "1234567890".
  if (/^(.)\1+$/.test(pw)) {
    problems.push('That is the same character repeated.');
  }
  if (isSequential(lower)) {
    problems.push('That is a keyboard or alphabet run.');
  }

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;

  // Length does more for entropy than symbol soup, so a long passphrase is allowed to
  // pass with fewer character classes.
  if (pw.length < 16 && classes < 2) {
    problems.push('Add a number, a capital, or a symbol. Or just make it longer.');
  }

  return { ok: problems.length === 0, problems, score: scoreOf(pw, classes) };
}

/** 0-4 for the meter. Deliberately generous about length, stingy about everything else. */
function scoreOf(pw: string, classes: number): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= PASSWORD_MIN) s++;
  if (pw.length >= 14) s++;
  if (pw.length >= 20) s++;
  if (classes >= 3) s++;
  if (COMMON.has(pw.toLowerCase()) || isSequential(pw.toLowerCase())) return 0;
  return Math.min(4, s);
}

const RUNS = ['abcdefghijklmnopqrstuvwxyz', '01234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function isSequential(value: string): boolean {
  if (value.length < 6) return false;
  for (const run of RUNS) {
    const back = [...run].reverse().join('');
    for (let i = 0; i + value.length <= run.length; i++) {
      if (run.slice(i, i + value.length) === value) return true;
    }
    for (let i = 0; i + value.length <= back.length; i++) {
      if (back.slice(i, i + value.length) === value) return true;
    }
  }
  return false;
}

/** Normalised email, or null when it is not plausibly an address. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  // Deliberately permissive: the only authority on deliverability is sending to it.
  if (email.length < 5 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) return null;
  return email;
}
