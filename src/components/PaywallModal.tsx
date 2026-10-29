'use client';

import { useState } from 'react';
import { Sparkles, Check, X, Zap, Shield, ArrowRight, Loader2 } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  currentUsage?: {
    used: number;
    limit: number;
    actionName: string;
    resetAt?: string;
  };
}

export function PaywallModal({
  isOpen,
  onClose,
  reason = 'Upgrade to Anyref Plus for higher daily limits and ad-free studio generation.',
  currentUsage,
}: PaywallModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleUpgrade() {
    setLoading(true);
    try {
      // In production, triggers billing provider checkout session
      window.location.href = '/billing';
    } catch {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-surface border border-border-subtle rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-layout-layer hover:text-ink hover:bg-surface-muted transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Anyref Plus Plan</span>
          </div>

          <h2 id="paywall-title" className="text-2xl font-bold font-tight text-ink tracking-tight">
            Unlock Full Prompt Studio Power
          </h2>

          <p className="text-sm text-layout-layer leading-relaxed">{reason}</p>
        </div>

        {/* Usage Meter (if limit was reached) */}
        {currentUsage && (
          <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-ink">Daily {currentUsage.actionName} Usage</span>
              <span className="text-danger font-mono">
                {currentUsage.used} / {currentUsage.limit} used (100%)
              </span>
            </div>
            <div className="w-full bg-paper rounded-full h-2 overflow-hidden border border-border-subtle">
              <div className="bg-danger h-full rounded-full w-full" />
            </div>
            {currentUsage.resetAt && (
              <p className="text-[11px] text-layout-layer text-right">
                Resets at 00:00 UTC
              </p>
            )}
          </div>
        )}

        {/* Plan Comparison Checklist */}
        <div className="space-y-3 pt-1">
          <div className="text-xs font-semibold text-ink uppercase tracking-wider">
            Included in Plus:
          </div>

          <ul className="space-y-2.5 text-sm text-ink font-sans">
            <li className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>
                <strong>50 prompt generations</strong> per day (vs 5 on Free)
              </span>
            </li>

            <li className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>
                <strong>100 autofills</strong> per day (vs 5 on Free)
              </span>
            </li>

            <li className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>
                <strong>10 brand profiles & 2,000 saved entries</strong>
              </span>
            </li>

            <li className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>
                <strong>Completely Ad-Free</strong> focus workspace
              </span>
            </li>
          </ul>
        </div>

        {/* Pricing CTA */}
        <div className="pt-2 space-y-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-primary-fg font-semibold rounded-xl hover:bg-primary/95 transition-all text-sm flex items-center justify-center space-x-2 shadow-sm active:scale-[0.98] min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting to Checkout...</span>
              </>
            ) : (
              <>
                <span>Upgrade to Plus for $5/month</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-layout-layer">
            Cancel anytime with one click. Secure processing via Merchant of Record.
          </p>
        </div>
      </div>
    </div>
  );
}
