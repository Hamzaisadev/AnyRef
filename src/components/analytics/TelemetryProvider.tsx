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
    }
  }, []);

  return null;
}
