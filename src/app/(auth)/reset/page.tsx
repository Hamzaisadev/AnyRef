'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { createBrowserClientInstance } from '@/lib/supabaseBrowser';
import { checkPassword } from '@/services/passwordPolicy';

type Status = 'checking' | 'ready' | 'working' | 'done' | 'invalid' | 'error';

/**
 * Where the reset email lands. Supabase puts the browser into a short-lived recovery
 * session when the link is opened, so this page never handles a token itself: it just
 * confirms a session exists and posts the new password.
 */
export default function ResetPage() {
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState<string | undefined>();
  const pwId = useId();

  const strength = useMemo(
    () => (password ? checkPassword(password, email) : null),
    [password, email]
  );

  useEffect(() => {
    const supabase = createBrowserClientInstance();

    // The recovery session arrives either as a hash fragment the SDK consumes on load,
    // or as an already-established cookie session. Either way, getUser is the check.
    async function confirm() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email ?? undefined);
        setStatus('ready');
      } else {
        setStatus('invalid');
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') confirm();
    });

    confirm();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus('error');
        setMessage(json.error || 'Could not update the password.');
        return;
      }
      setStatus('done');
    } catch {
      setStatus('error');
      setMessage('Could not reach the server.');
    }
  }

  return (
    <div className="auth">
      <div className="auth__panel">
        <Link href="/" className="auth__mark" aria-label="Anyref home">
          Anyref
        </Link>

        {status === 'checking' && <p className="auth__sub">Checking your link…</p>}

        {status === 'invalid' && (
          <>
            <div>
              <h1 className="auth__title">Link expired</h1>
              <p className="auth__sub">
                Reset links are single use and time limited. Request a fresh one and it will
                work.
              </p>
            </div>
            <Link href="/login" className="auth__submit" style={{ display: 'grid', placeItems: 'center' }}>
              Back to sign in
            </Link>
          </>
        )}

        {status === 'done' && (
          <>
            <div>
              <h1 className="auth__title">Password set</h1>
              <p className="auth__sub">You can sign in with it from now on.</p>
            </div>
            <Link
              href="/workspace/generate"
              className="auth__submit"
              style={{ display: 'grid', placeItems: 'center' }}
            >
              Go to the workspace
            </Link>
          </>
        )}

        {(status === 'ready' || status === 'working' || status === 'error') && (
          <>
            <div>
              <h1 className="auth__title">New password</h1>
              <p className="auth__sub">
                {email ? `Setting a new password for ${email}.` : 'Choose something you will remember.'}
              </p>
            </div>

            <form className="auth__form" onSubmit={onSubmit} noValidate>
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
                  autoComplete="new-password"
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 10 characters"
                  aria-describedby={`${pwId}-hint`}
                />
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
              </div>

              {status === 'error' && (
                <p className="auth__error" role="alert">
                  {message}
                </p>
              )}

              <button type="submit" className="auth__submit" disabled={status === 'working'}>
                {status === 'working' ? 'One moment…' : 'Set password'}
              </button>
            </form>
          </>
        )}
      </div>

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
