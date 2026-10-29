# ADR 0005: Merchant-of-Record Billing Architecture and Provider Selection

- **Status**: Accepted
- **Date**: 2026-10-29
- **Author**: Platform Architecture Team
- **Context**: Anyref is transitioning from a private single-owner tool to a public multi-tenant SaaS. As a SaaS offering digital products and AI prompt transformations across international jurisdictions, handling VAT, US sales taxes, EU MOSS, and international payouts creates significant compliance exposure.

---

## 1. Requirements

1. **Tax & Legal Merchant-of-Record (MoR)**:
   - Must handle international VAT/GST calculation, collection, remittance, and tax reporting.
   - Must support global customer card payments, Apple Pay, Google Pay.
2. **Payout Availability**:
   - Must support payouts to the business owner's destination country via standard SWIFT/ACH or local bank transfers without requiring a US Delaware C-Corp.
3. **Pluggable Architecture**:
   - The core billing domain must remain decoupled from specific vendor SDKs via a clean `BillingProvider` interface.
   - Must support headless checkout sessions, customer billing portal, and cryptographically verified webhook webhooks.
4. **Idempotency & Event Ordering**:
   - Every incoming billing webhook must be recorded in an immutable `webhook_events` table before processing.
   - Replay attacks or duplicate deliveries must return HTTP 200 without duplicate state changes.
   - Out-of-order events (e.g. `subscription.updated` arriving before `subscription.created`) must be rejected using `subscriptions.last_event_at`.

---

## 2. Decision

We establish:
1. **`BillingProvider` Interface**:
   ```typescript
   export interface BillingProvider {
     name: string;
     createCheckoutSession(params: CheckoutParams): Promise<{ checkoutUrl: string }>;
     createPortalSession(customerId: string, returnUrl: string): Promise<{ portalUrl: string }>;
     verifyWebhookSignature(rawBody: string, signature: string): boolean;
     parseWebhookEvent(rawPayload: unknown): StandardBillingEvent;
   }
   ```
2. **Chosen Adapter**:
   - **Lemon Squeezy / Paddle (MoR)** as the primary Merchant of Record adapter.
   - A built-in test adapter (`MockBillingProvider`) for automated deterministic CI testing.
3. **Single State Authority**:
   - The client never dictates or updates plan state.
   - `syncPlan(userId, planId, planSource)` is the single server-side authority that mutates `profiles.plan_id`.

---

## 3. Consequences

- **Positive**:
  - Full tax compliance handled externally.
  - Zero lock-in: swapping providers requires writing one adapter class implementing `BillingProvider`.
  - Guarantees replay safety and out-of-order resilience in webhook processing.
- **Negative**:
  - Slightly higher transaction fees (typically ~5% + $0.50) compared to raw payment processors, which is offset by zero accounting overhead.
