import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AdSlot } from '../../src/components/ads/AdSlot';

describe('AdSlot Component - Monetization, Placements & CLS Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders NULL when user is a Plus subscriber or Staff (showAds = false)', () => {
    const html = renderToString(
      React.createElement(AdSlot, {
        name: 'library-bottom',
        showAds: false,
        adsEnabledGlobal: true,
      })
    );
    expect(html).toBe('');
  });

  it('renders NULL when platform admin turns off global ads (adsEnabledGlobal = false)', () => {
    const html = renderToString(
      React.createElement(AdSlot, {
        name: 'library-sidebar',
        showAds: true,
        adsEnabledGlobal: false,
      })
    );
    expect(html).toBe('');
  });

  it('renders reserved fixed-height container for free user with ads enabled', () => {
    const html = renderToString(
      React.createElement(AdSlot, {
        name: 'library-bottom',
        showAds: true,
        adsEnabledGlobal: true,
      })
    );

    // Verifies data-ad-slot attribute
    expect(html).toContain('data-ad-slot="library-bottom"');
    // Verifies fixed-height class preventing Cumulative Layout Shift (CLS)
    expect(html).toContain('min-h-[90px]');
    // Verifies FTC/Ad standard transparency disclosure
    expect(html).toContain('Sponsored');
    // Verifies upgrade upsell prompt
    expect(html).toContain('Remove ads with Plus');
  });

  it('enforces fixed 250px height for sidebar ad placement', () => {
    const html = renderToString(
      React.createElement(AdSlot, {
        name: 'library-sidebar',
        showAds: true,
        adsEnabledGlobal: true,
      })
    );

    expect(html).toContain('data-ad-slot="library-sidebar"');
    expect(html).toContain('min-h-[250px]');
  });
});
