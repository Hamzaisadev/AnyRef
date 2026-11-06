# Deferred Features & Untested Hypotheses — Anyref

This document records product ideas, feature proposals, and growth channels that have been evaluated and deliberately **deferred**. They are hypotheses, not commitments.

---

## 1. Shopify App Store Integration (Untested Channel Hypothesis)

- **Status:** Deferred [A]
- **Date Recorded:** 2026-10-31
- **Hypothesis:** Sizing estimates hypothesize that 950,000 active Shopify merchants spend heavily on Meta/Google ad creative. A dedicated Shopify App Store listing providing native product catalog synchronization with Anyref's Autofill Studio could streamline product photo extraction and boost creator acquisition.
- **Why Deferred:**
  1. **Premature Optimization:** No customer demand has been validated for catalog sync; users currently upload single product cutouts directly in the browser.
  2. **Engineering Overhead:** Building a compliant Shopify embedded app requires Shopify OAuth, webhook synchronization for inventory, and billing API integration, diverting focus from prompt quality and template reuse.
  3. **App Store Fees & Compliance:** Shopify mandates its own Billing API for apps in the Shopify App Store (charging 15% above \$1M), conflicting with our unified Merchant-of-Record architecture (see [ADR 0005](./adr/0005-billing.md)).
- **Revisit Trigger:** Reconsider only if at least 25 active paying Pro or Studio users explicitly request automated multi-product catalog sync in customer interviews.
