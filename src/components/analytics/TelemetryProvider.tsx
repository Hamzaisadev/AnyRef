'use client';

import { useEffect } from 'react';
import {
  TELEMETRY_EVENTS,
  detectAiReferral,
  trackClientEvent,
} from '@/lib/telemetry';

export function TelemetryProvider() {
  useEffect(() => {
    // 1. Initialize Consent Mode v2 defaults if not already present
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
      };

      win.dataLayer = win.dataLayer || [];
      if (!win.gtag) {
        win.gtag = function () {
          win.dataLayer?.push(arguments);
        };
      }

      const existingConsent = localStorage.getItem('anyref_cookie_consent');
      if (!existingConsent) {
        win.gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 500,
        });
      } else if (existingConsent === 'all') {
        win.gtag('consent', 'default', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      }

      // 2. Detect and track AI Referral visits (ChatGPT, Perplexity, Claude, Gemini)
      if (document.referrer) {
        const aiCheck = detectAiReferral(document.referrer);
        if (aiCheck.isAi) {
          trackClientEvent(TELEMETRY_EVENTS.AI_REFERRAL_DETECTED, {
            ai_platform: aiCheck.platform || 'unknown_ai',
            referral_url: document.referrer,
            landing_path: window.location.pathname,
          });
        }
      }

      // 3. Track UTM parameters if present
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get('utm_source');
      if (utmSource) {
        trackClientEvent(TELEMETRY_EVENTS.UTM_CAMPAIGN_CAPTURED, {
          utm_source: utmSource.toLowerCase(),
          utm_medium: (params.get('utm_medium') || '').toLowerCase(),
          utm_campaign: (params.get('utm_campaign') || '').toLowerCase(),
          utm_content: params.get('utm_content') || '',
          utm_term: params.get('utm_term') || '',
        });
      }

      // 4. PostHog Session Replay Masking Configuration
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

      const winWithPh = window as unknown as {
        posthog?: {
          init: (key: string, options: Record<string, unknown>) => void;
        };
      };

      if (posthogKey && winWithPh.posthog && typeof winWithPh.posthog.init === 'function') {
        winWithPh.posthog.init(posthogKey, {
          api_host: posthogHost,
          autocapture: false, // Explicit events preferred per taxonomy
          capture_pageview: true,
          capture_pageleave: true,
          session_recording: {
            maskAllInputs: true, // Strict masking of brand tokens and confidential slots
            maskInputOptions: {
              password: true,
              text: true,
              color: false,
              date: true,
            },
            maskTextSelector: '.ph-mask, [data-ph-mask], .slot-sensitive',
            blockSelector: '.ph-no-capture, [data-ph-block]',
          },
        });
      }
    }
  }, []);

  return null;
}
