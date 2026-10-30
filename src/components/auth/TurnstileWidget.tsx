'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error?: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (err?: any) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function TurnstileWidget({ onVerify, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If no sitekey is configured (development/test mode), simulate instant verification
    if (!siteKey) {
      onVerify('simulated_dev_turnstile_token');
      setIsReady(true);
      return;
    }

    let isMounted = true;

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey!,
          callback: (token: string) => {
            if (isMounted) onVerify(token);
          },
          'error-callback': (err: any) => {
            if (isMounted) onError?.(typeof err === 'string' ? err : 'Turnstile challenge failed');
          },
          'expired-callback': () => {
            if (isMounted) onVerify('');
          },
          theme: 'auto',
        });
        setWidgetId(id);
        setIsReady(true);
      } catch (err: any) {
        onError?.(err?.message || 'Failed to render Turnstile');
      }
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) renderWidget();
        };
        script.onerror = () => {
          if (isMounted) onError?.('Failed to load bot protection script');
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            if (isMounted) renderWidget();
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }

    return () => {
      isMounted = false;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // Ignore
        }
      }
    };
  }, [siteKey, onVerify, onError]);

  if (!siteKey) {
    return (
      <div className="flex items-center justify-between p-2.5 bg-surface-muted rounded-xl border border-border-subtle text-[11px] text-layout-layer">
        <div className="flex items-center space-x-1.5 text-ink font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>Bot Protection Active</span>
        </div>
        <span className="font-mono text-[10px] text-layout-layer/70">Verified</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-2 min-h-[65px]">
      <div ref={containerRef} />
      {!isReady && (
        <div className="flex items-center space-x-2 text-xs text-layout-layer py-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span>Securing session...</span>
        </div>
      )}
    </div>
  );
}
