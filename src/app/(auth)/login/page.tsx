'use client';

import { useState } from 'react';
import { createBrowserClientInstance } from '@/lib/supabaseBrowser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const supabase = createBrowserClientInstance();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message || 'Failed to send login link. Please try again.');
      } else {
        setStatus('success');
      }
    } catch {
      setStatus('error');
      setErrorMessage('An unexpected network error occurred.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-ink/10 shadow-sm">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
            <svg
              className="w-7 h-7"
              viewBox="0 0 64 64"
              fill="none"
              role="img"
              aria-label="Anyref logo"
            >
              <rect x="6" y="6" width="52" height="52" rx="12" stroke="currentColor" strokeWidth="4" />
              <path
                d="M24 20h-6v24h6M40 20h6v24h-6"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="32" r="4" fill="#FF8A3D" />
            </svg>
          </div>
          <h1 className="font-tight font-bold text-2xl text-ink tracking-tight">
            Sign in to Anyref
          </h1>
          <p className="text-layout-layer text-sm font-sans">
            Private prompt-engineering studio. Enter your invited email to receive a secure login link.
          </p>
        </div>

        {status === 'success' ? (
          <div
            role="status"
            aria-live="polite"
            className="p-5 rounded-xl bg-success/10 border border-success/20 text-ink text-center space-y-2"
          >
            <div className="w-8 h-8 rounded-full bg-success/20 text-success mx-auto flex items-center justify-center font-bold">
              ✓
            </div>
            <h2 className="font-tight font-semibold text-base text-ink">Check your email</h2>
            <p className="text-sm text-layout-layer">
              We sent a magic login link to <strong className="text-ink">{email}</strong>. Click the link in your inbox to open your workspace.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {status === 'error' && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium"
              >
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink tracking-tight"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourdomain.com"
                disabled={status === 'loading'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-ink/20 bg-paper text-ink placeholder:text-layout-layer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-50 text-sm shadow-sm flex items-center justify-center space-x-2"
            >
              {status === 'loading' ? (
                <span>Sending magic link...</span>
              ) : (
                <span>Send Magic Link</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-layout-layer pt-2">
          Invite-only access. Public registrations are disabled.
        </div>
      </div>
    </div>
  );
}
