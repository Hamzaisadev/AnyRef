'use client';

import { Suspense, useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createBrowserClientInstance } from '@/lib/supabaseBrowser';
import { sanitizeRedirectPath } from '@/lib/sanitizeRedirect';
import { checkPassword } from '@/services/passwordPolicy';

type Mode = 'signin' | 'signup' | 'forgot';
type Status = 'idle' | 'working' | 'sent' | 'error';

/**
 * One page, three modes. Password is the default path in both directions: the previous
 * build could sign in with a password but had no way to ever create one, so magic link
 * was the only real option.
 *
 * Magic link stays, demoted to a fallback, so anyone who already has an account without
 * a password is never locked out.
 */
function AuthForm() {
  const params = useSearchParams();
  const safeRedirect = sanitizeRedirectPath(params.get('redirectTo') || params.get('next'));

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const emailId = useId();
  const pwId = useId();

  // Live feedback from the same module the server validates with, so the meter can
  // never promise something the API will then reject.
  const strength = useMemo(
    () => (mode === 'signup' && password ? checkPassword(password, email) : null),
    [mode, password, email]
  );

  useEffect(() => {
    setStatus('idle');
    setMessage('');
  }, [mode]);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { res, json: await res.json().catch(() => ({})) };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working');
    setMessage('');

    try {
      if (mode === 'forgot') {
        const { json } = await post('/api/auth/reset', { email });
        setStatus('sent');
        setMessage(json.message || 'If that address has an account, a reset link is on its way.');
        return;
      }

      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const { res, json } = await post(endpoint, { email, password, redirectTo: safeRedirect });

      if (!res.ok) {
        setStatus('error');
        setMessage(json.error || 'Something went wrong. Please try again.');
        return;
      }

      // Full navigation, not router.push: the session cookies were set on this response
      // and the app layout reads them server-side.
      window.location.href = json.redirectTo || safeRedirect;
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Check your connection and try again.');
    }
  }

  /** Fallback for accounts that pre-date passwords. */
  async function sendMagicLink() {
    if (!email) {
      setStatus('error');
      setMessage('Enter your email address first.');
      return;
    }
    setStatus('working');
    try {
      const { res, json } = await post('/api/auth/email-login', { email, redirectTo: safeRedirect });
      if (!res.ok) {
        setStatus('error');
        setMessage(json.error || 'Could not send the link.');
        return;
      }
      setStatus('sent');
      setMessage('Check your inbox for a one-time sign-in link.');
    } catch {
      setStatus('error');
      setMessage('Could not reach the server.');
    }
  }

  async function withGoogle() {
    setStatus('working');
    const supabase = createBrowserClientInstance();
    const cb = new URL('/api/auth/callback', window.location.origin);
    if (safeRedirect) cb.searchParams.set('redirectTo', safeRedirect);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: cb.toString() },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message || 'Google sign-in failed.');
    }
  }

  const busy = status === 'working';
  const title =
    mode === 'signup' ? 'Make an account' : mode === 'forgot' ? 'Reset password' : 'Welcome back';
  const blurb =
    mode === 'signup'
      ? 'An email and a password. You are in straight away, no inbox trip.'
      : mode === 'forgot'
        ? 'We will email a link to set a new password.'
        : 'Sign in and pick up where you left off.';

  return (
    <div className="auth">
      <div className="auth__panel">
        <Link href="/" className="auth__mark" aria-label="Anyref home">
          Anyref
        </Link>

        <div>
          <h1 className="auth__title">{title}</h1>
          <p className="auth__sub">{blurb}</p>
        </div>

        {status === 'sent' ? (
          <div className="auth__sent" role="status">
            <p>{message}</p>
            <button type="button" className="auth__link" onClick={() => setMode('signin')}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form className="auth__form" onSubmit={onSubmit} noValidate>
            <div className="auth__field">
              <label className="auth__label" htmlFor={emailId}>
                Email
              </label>
              <input
                id={emailId}
                className="auth__input"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="auth__field">
                <div className="auth__labelRow">
                  <label className="auth__label" htmlFor={pwId}>
                    Password
                  </label>
                  <button
                    type="button"
                    className="auth__link"
                    onClick={() => setShow((v) => !v)}
                    aria-pressed={show}
                  >
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id={pwId}
                  className="auth__input"
                  type={show ? 'text' : 'password'}
                  // Tells a password manager to offer a new strong password on signup
                  // and the saved one on return.
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={mode === 'signup' ? 10 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 10 characters' : 'Your password'}
                  aria-describedby={mode === 'signup' ? `${pwId}-hint` : undefined}
                />

                {mode === 'signup' && (
                  <div className="auth__strength" id={`${pwId}-hint`}>
                    <div className="auth__meter" aria-hidden="true">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} data-on={(strength?.score ?? 0) > i ? 'true' : 'false'} />
                      ))}
                    </div>
                    <p className="auth__hint">
                      {password
                        ? (strength?.problems[0] ?? 'Strong enough. Good to go.')
                        : 'Ten characters or more. A long phrase beats a short scramble.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {status === 'error' && (
              <p className="auth__error" role="alert">
                {message}
              </p>
            )}

            <button type="submit" className="auth__submit" disabled={busy}>
              {busy
                ? 'One moment…'
                : mode === 'signup'
                  ? 'Create account'
                  : mode === 'forgot'
                    ? 'Send reset link'
                    : 'Sign in'}
            </button>

            {mode === 'signin' && (
              <button type="button" className="auth__link" onClick={() => setMode('forgot')}>
                Forgot your password?
              </button>
            )}
          </form>
        )}

        <div className="auth__divider" aria-hidden="true">
          <span>or</span>
        </div>

        <div className="auth__alts">
          <button type="button" className="auth__alt" onClick={withGoogle} disabled={busy}>
            Continue with Google
          </button>
          <button type="button" className="auth__alt" onClick={sendMagicLink} disabled={busy}>
            Email me a one-time link
          </button>
        </div>

        <p className="auth__switch">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button type="button" className="auth__link" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button type="button" className="auth__link" onClick={() => setMode('signup')}>
                Make an account
              </button>
            </>
          )}
        </p>

        <p className="auth__fine">
          By continuing you agree to the{' '}
          <Link href="/terms" className="auth__link">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="auth__link">
            privacy policy
          </Link>
          .
        </p>
      </div>

      {/* The right half speaks the landing page's poster language, so signing in looks
          like the same company rather than a different product. */}
      <aside className="auth__show" aria-hidden="true">
        <div className="auth__poster">
          <span className="auth__posterBrand">Verda</span>
          <p className="auth__posterHead">Everything greener</p>
          <span className="auth__posterPrice">20% off</span>
        </div>
        <p className="auth__showCopy">
          Your brand. Every post.
          <span>Anyref never invents a price, a discount or a date.</span>
        </p>
      </aside>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth" />}>
      <AuthForm />
    </Suspense>
  );
}
