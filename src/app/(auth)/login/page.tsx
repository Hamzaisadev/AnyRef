'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
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
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-ink/10 shadow-sm">
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
                <circle cx="32" cy="32" r="4" fill="#FF8A3D" />
              </svg>
            </div>
          </Link>

          <h1 className="font-tight font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Sign in to Anyref
          </h1>
          <p className="text-layout-layer text-sm font-sans leading-relaxed">
            Private prompt studio. Enter your invited email to receive a secure sign-in link.
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
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-ink/20 bg-paper/50 text-ink placeholder:text-layout-layer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 text-sm shadow-sm flex items-center justify-center space-x-2 active:scale-[0.98] min-h-[44px]"
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
        )}

        <div className="text-center text-xs text-layout-layer pt-2 border-t border-ink/10">
          Invite-only workspace. Single sign-on with verified team email.
        </div>
      </div>
    </div>
  );
}
