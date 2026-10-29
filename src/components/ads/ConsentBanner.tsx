'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('anyref_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function handleAcceptAll() {
    localStorage.setItem('anyref_cookie_consent', 'all');
    localStorage.setItem('anyref_ad_consent', 'granted');
    setVisible(false);
  }

  function handleEssentialOnly() {
    localStorage.setItem('anyref_cookie_consent', 'essential');
    localStorage.setItem('anyref_ad_consent', 'denied');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 p-5 rounded-2xl bg-surface border border-border-subtle shadow-xl space-y-3 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className="flex items-start space-x-2.5">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
            Privacy & Ad Choices
          </h2>
          <p className="text-xs text-layout-layer leading-relaxed">
            We use essential cookies for secure authentication and privacy-friendly analytics.
            Free accounts display sponsored partner messages. You can adjust preferences at any time.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-1 text-xs">
        <button
          onClick={handleAcceptAll}
          className="flex-1 py-2 px-3 bg-primary text-primary-fg font-semibold rounded-xl hover:bg-primary/95 transition-colors"
        >
          Accept All
        </button>
        <button
          onClick={handleEssentialOnly}
          className="py-2 px-3 bg-surface-muted hover:bg-border-subtle text-ink font-medium rounded-xl transition-colors border border-border-subtle"
        >
          Essential Only
        </button>
      </div>

      <div className="text-[10px] text-layout-layer text-center">
        Learn more in our{' '}
        <Link href="/privacy" className="underline hover:text-ink">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link href="/terms" className="underline hover:text-ink">
          Terms of Service
        </Link>
        .
      </div>
    </aside>
  );
}
