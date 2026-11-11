import { describe, it, expect } from 'vitest';
import { PLANS_CONFIG, DEFAULT_PRO_LIMITS, DEFAULT_STUDIO_LIMITS } from '@/config/plans';
import { LANDING_CONTENT } from '@/lib/landing/content';

describe('Pricing & Plan Presentation Alignment', () => {
  describe('Plans Configuration (Authoritative Store)', () => {
    it('stores prices in plan rows with $15 Pro and $49 Studio [A]', () => {
      // Pro moved $19 -> $15 to sit at parity with Canva Pro while Anyref has no
      // brand equity. Studio stays $49 but is not yet purchasable.
      expect(PLANS_CONFIG.pro.priceUsdMonth).toBe(15);
      expect(PLANS_CONFIG.pro.priceUsdYear).toBe(150);
      expect(PLANS_CONFIG.studio.priceUsdMonth).toBe(49);
      expect(PLANS_CONFIG.studio.priceUsdYear).toBe(490);
      expect(PLANS_CONFIG.free.priceUsdMonth).toBe(0);
      expect(PLANS_CONFIG.free.priceUsdYear).toBe(0);
    });

    it('contains pro and studio plans and keeps plus as legacy', () => {
      expect(PLANS_CONFIG.pro).toBeDefined();
      expect(PLANS_CONFIG.studio).toBeDefined();
      expect(PLANS_CONFIG.plus).toBeDefined();
      expect(PLANS_CONFIG.plus.isAvailable).toBe(false);
    });

    it('pro and studio plan limits align with specification', () => {
      expect(DEFAULT_PRO_LIMITS.generate_per_day).toBe(10);
      expect(DEFAULT_PRO_LIMITS.autofill_per_day).toBe(20);
      expect(DEFAULT_PRO_LIMITS.brand_draft_per_day).toBe(3);
      expect(DEFAULT_PRO_LIMITS.monthly_ai_budget_usd).toBe(6.20);

      expect(DEFAULT_STUDIO_LIMITS.generate_per_day).toBe(30);
      expect(DEFAULT_STUDIO_LIMITS.autofill_per_day).toBe(60);
      expect(DEFAULT_STUDIO_LIMITS.brand_draft_per_day).toBe(10);
      expect(DEFAULT_STUDIO_LIMITS.monthly_ai_budget_usd).toBe(20.00);
    });

    it('render caps are set and priced as the dominant cost driver', () => {
      // Renders cost ~$0.134 each vs ~$0.003 for a text call, so these caps —
      // not the text quotas — determine plan margins.
      expect(DEFAULT_PRO_LIMITS.render_per_month).toBe(30);
      expect(DEFAULT_PRO_LIMITS.render_per_day).toBe(5);
      expect(DEFAULT_STUDIO_LIMITS.render_per_month).toBe(100);
      expect(DEFAULT_STUDIO_LIMITS.render_per_day).toBe(15);

      // A daily cap must never silently exceed the monthly cap.
      expect(DEFAULT_PRO_LIMITS.render_per_day! * 30).toBeGreaterThanOrEqual(
        DEFAULT_PRO_LIMITS.render_per_month!
      );
    });

    it('makes Pro purchasable and keeps Studio gated until there is demand', () => {
      expect(PLANS_CONFIG.pro.isAvailable).toBe(true);
      expect(PLANS_CONFIG.studio.isAvailable).toBe(false);
    });
  });

  describe('Landing Page Pricing Alignment', () => {
    const { pricing } = LANDING_CONTENT;

    it('features 3 plans: Free, Pro, and Studio', () => {
      expect(pricing.freeCard.title).toBe('Free');
      expect(pricing.proCard.title).toBe('Pro');
      expect(pricing.studioCard.title).toBe('Studio');
    });

    it('offers Pro for purchase while Studio remains Coming Soon', () => {
      expect(pricing.proCard.buttonLabel).toBe('Upgrade to Pro');
      expect(pricing.studioCard.buttonLabel).toBe('Coming soon');
    });

    it('bullets describe allowances in plain language, not dollar figures or token counts', () => {
      const allBullets = [
        ...pricing.freeCard.features,
        ...pricing.proCard.bullets,
        ...pricing.studioCard.bullets,
      ];

      for (const bullet of allBullets) {
        // No dollar figures in feature bullets
        expect(bullet).not.toMatch(/\$\d+/);
        // No raw token counts
        expect(bullet).not.toMatch(/\b\d+\s*tokens?\b/i);
      }
    });

    it('does not present Studio as a team or agency product', () => {
      expect(pricing.studioCard.title).not.toMatch(/agency|team/i);
      expect(pricing.studioCard.subline).not.toMatch(/team seats|client workspaces/i);
      for (const bullet of pricing.studioCard.bullets) {
        expect(bullet).not.toMatch(/team seats|client seats|multi-seat/i);
      }
    });
  });
});
