import { describe, it, expect } from 'vitest';
import { DEFAULT_FREE_LIMITS, DEFAULT_PLUS_LIMITS, PLANS_CONFIG } from '@/config/plans';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { LANDING_COLORS, SLOT_COLORS, ANIMATION_TOKENS } from '@/lib/landing/tokens';

describe('Anyref Landing Page - Truth Rules & Specification Compliance', () => {
  describe('Truth Rules & Pricing Config Alignment', () => {
    it('reads free tier limits directly from authoritative plans config', () => {
      const freeCard = LANDING_CONTENT.pricing.freeCard;

      // Strict equality check between landing page card limits and config
      expect(freeCard.limits.maxBrands).toBe(DEFAULT_FREE_LIMITS.max_brands);
      expect(freeCard.limits.maxEntries).toBe(DEFAULT_FREE_LIMITS.max_entries);
      expect(freeCard.limits.generatePerDay).toBe(DEFAULT_FREE_LIMITS.generate_per_day);
      expect(freeCard.limits.autofillPerDay).toBe(DEFAULT_FREE_LIMITS.autofill_per_day);
      expect(freeCard.limits.storageMb).toBe(DEFAULT_FREE_LIMITS.max_storage_mb);

      // Verify features bullet points reflect these exact numbers
      expect(freeCard.features).toContain(`${DEFAULT_FREE_LIMITS.max_brands} brands`);
      expect(freeCard.features).toContain(`${DEFAULT_FREE_LIMITS.max_entries} saved entries`);
      expect(freeCard.features).toContain(
        `${DEFAULT_FREE_LIMITS.generate_per_day} prompt generations per day`
      );
      expect(freeCard.features).toContain(
        `${DEFAULT_FREE_LIMITS.autofill_per_day} product autofills per day`
      );
    });

    it('enforces Pro and Studio tier pre-launch rules (button disabled with Coming soon)', () => {
      const proCard = LANDING_CONTENT.pricing.proCard;
      const studioCard = LANDING_CONTENT.pricing.studioCard;

      expect(proCard.buttonLabel).toBe('Coming soon');
      expect(studioCard.buttonLabel).toBe('Coming soon');
      expect(proCard.bullets).toContain('Up to 5 brands');
      expect(studioCard.bullets).toContain('Up to 25 brands');
    });

    it('clarifies that Anyref does not generate or edit images', () => {
      // Truth rule: Anyref writes prompts; users generate images in another tool
      expect(LANDING_CONTENT.hero.proofLine).toBe(
        'You generate the image in your favorite tool. Anyref never touches it.'
      );
      expect(LANDING_CONTENT.pricing.noteBelow).toContain(
        'Anyref writes the prompts. You use your own image tool'
      );
      expect(LANDING_CONTENT.faq.items[0]?.answer).toContain(
        'No. Anyref writes the prompt and helps you organize the results.'
      );
    });

    it('ensures all "Start free" CTAs target /login?next=/workspace/generate', () => {
      const targetUrl = '/login?next=/workspace/generate';

      expect(LANDING_CONTENT.nav.startFree.href).toBe(targetUrl);
      expect(LANDING_CONTENT.hero.primaryCta.href).toBe(targetUrl);
      expect(LANDING_CONTENT.howItWorks.cta.href).toBe(targetUrl);
      expect(LANDING_CONTENT.pricing.freeCard.cta.href).toBe(targetUrl);
      expect(LANDING_CONTENT.finalCta.cta.href).toBe(targetUrl);
    });

    it('contains zero fake social proof, star ratings, or client logos', () => {
      const rawText = JSON.stringify(LANDING_CONTENT).toLowerCase();
      expect(rawText).not.toContain('trusted by');
      expect(rawText).not.toContain('5-star');
      expect(rawText).not.toContain('5 star');
      expect(rawText).not.toContain('reviews');
      expect(rawText).not.toContain('testimonial');
      expect(rawText).not.toContain('as seen on');
    });
  });

  describe('Design Tokens & Navigation Integrity', () => {
    it('defines the required color palette', () => {
      expect(LANDING_COLORS.ink).toBe('#0F1020');
      expect(LANDING_COLORS.paper).toBe('#F7F6F2');
      expect(LANDING_COLORS.primary).toBe('#4B2BFF');
      expect(LANDING_COLORS.accent).toBe('#FF8A3D');
      expect(LANDING_COLORS.brandBlue).toBe('#2B7BFF');
      expect(LANDING_COLORS.layoutGray).toBe('#9AA0AE');
      expect(LANDING_COLORS.success).toBe('#1E9E6A');
      expect(LANDING_COLORS.danger).toBe('#D64545');
    });

    it('defines the three typed slot chip colors', () => {
      expect(SLOT_COLORS.brand.text).toBe('#2B7BFF');
      expect(SLOT_COLORS.campaign.text).toBe('#FF8A3D');
      expect(SLOT_COLORS.layout.text).toBe('#9AA0AE');
    });

    it('has all 5 navigation links matching existing section anchors', () => {
      const links = LANDING_CONTENT.nav.links;
      expect(links).toHaveLength(5);
      expect(links.map((l) => l.href)).toEqual([
        '#how-it-works',
        '#guardrails',
        '#brands',
        '#pricing',
        '#faq',
      ]);
    });

    it('contains all 8 required FAQ items with accessible answers in HTML', () => {
      expect(LANDING_CONTENT.faq.items).toHaveLength(8);
      LANDING_CONTENT.faq.items.forEach((item) => {
        expect(item.question.length).toBeGreaterThan(10);
        expect(item.answer.length).toBeGreaterThan(15);
      });
    });

    it('ensures footer links point to valid routes', () => {
      const footerLinks = LANDING_CONTENT.footer.links.map((l) => l.href);
      expect(footerLinks).toContain('/terms');
      expect(footerLinks).toContain('/privacy');
      expect(footerLinks).toContain('/guides');
      expect(footerLinks).toContain('/login');
    });
  });
});
