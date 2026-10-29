'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { createBrowserClientInstance } from '@/lib/supabaseBrowser';
import { isDisposableEmail } from '@/lib/disposableEmail';
import { sanitizeRedirectPath } from '@/lib/sanitizeRedirect';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirectTo') || searchParams.get('next');
  const safeRedirect = sanitizeRedirectPath(rawRedirect);

  const [email, setEmail] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const supabase = createBrowserClientInstance();

  function getCallbackUrl(): string {
    const callbackUrl = new URL('/api/auth/callback', window.location.origin);
    if (safeRedirect && safeRedirect !== '/library') {
      callbackUrl.searchParams.set('redirectTo', safeRedirect);
    }
    return callbackUrl.toString();
  }

  async function handleGoogleSignIn() {
    if (!agreedTerms || !ageConfirmed) {
      setErrorMessage('Please confirm your age and accept the Terms of Service to continue.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getCallbackUrl(),
        },
      });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message || 'Google sign-in failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('An unexpected network error occurred.');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!agreedTerms || !ageConfirmed) {
      setErrorMessage('Please confirm your age and accept the Terms of Service to continue.');
      setStatus('error');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    if (isDisposableEmail(email)) {
      setErrorMessage('Disposable email addresses are not permitted. Please use a permanent email.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getCallbackUrl(),
          data: {
            tos_accepted: agreedTerms,
            age_confirmed: ageConfirmed,
            tos_version: '2026-01',
          },
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
      <div className="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-2xl border border-border-subtle shadow-sm">
        {/* Logo and Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-2xs hover:scale-105 transition-transform">
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
                <circle cx="32" cy="32" r="4" fill="var(--accent)" />
              </svg>
            </div>
          </Link>

          <h1 className="font-tight font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Sign in to Anyref
          </h1>
          <p className="text-layout-layer text-sm font-sans leading-relaxed">
            AI-powered prompt engineering studio. Sign in with Google or receive a magic login link.
          </p>
        </div>

        {status === 'success' ? (
          <div
            role="status"
            aria-live="polite"
            className="p-6 rounded-2xl bg-success/10 border border-success/20 text-ink text-center space-y-3"
          >
            <div className="w-10 h-10 rounded-full bg-success/20 text-success mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-tight font-bold text-lg text-ink">Check your email</h2>
            <p className="text-sm text-layout-layer leading-relaxed">
              We sent a magic sign-in link to <strong className="text-ink font-semibold">{email}</strong>. Open the link to jump directly into your workspace.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {status === 'error' && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={status === 'loading'}
              className="w-full py-2.5 px-4 bg-surface hover:bg-surface-muted text-ink border border-border font-medium rounded-xl transition-all duration-150 flex items-center justify-center space-x-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs active:scale-[0.98] min-h-[44px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border-subtle w-full" />
              <span className="bg-surface px-3 text-xs text-layout-layer uppercase tracking-wider font-semibold absolute">
                Or magic link
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-ink uppercase tracking-wider"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-layout-layer absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    disabled={status === 'loading'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-muted text-ink placeholder:text-layout-layer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>

              {/* Consent and Age verification */}
              <div className="space-y-2 pt-1 text-left">
                <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-layout-layer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-border-subtle text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary underline hover:text-primary/80">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary underline hover:text-primary/80">
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-layout-layer select-none">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-border-subtle text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>I confirm that I am at least 16 years of age</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 px-4 bg-primary text-primary-fg font-semibold rounded-xl hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 text-sm shadow-sm flex items-center justify-center space-x-2 active:scale-[0.98] min-h-[44px]"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending magic link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Magic Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="text-center text-xs text-layout-layer pt-2 border-t border-border-subtle">
          Protected by Anyref security protocols. No passwords required.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-paper">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
