# ADR 0005: Merchant-of-Record Billing Architecture and Provider Selection

- **Status**: Accepted (Updated with Cost Benchmark & Margin Floor)
- **Date**: 2026-10-29 (Updated 2026-10-31)
- **Author**: Platform Architecture Team
- **Context**: Anyref is transitioning from a private single-owner tool to a public multi-tenant SaaS. As a SaaS offering digital products and AI prompt transformations across international jurisdictions, handling VAT, US sales taxes, EU MOSS, and international payouts creates significant compliance exposure. Furthermore, empirical inference benchmarking (`docs/spike/cost_benchmark_25_runs.json`) revealed that plan limits must be paired with strict per-user dollar budgets to guarantee gross margin floors against worst-case daily quota usage.

---

## 1. Requirements

1. **Tax & Legal Merchant-of-Record (MoR)**:
   - Must handle international VAT/GST calculation, collection, remittance, and tax reporting.
   - Must support global customer card payments, Apple Pay, Google Pay.
2. **Payout Availability**:
   - Must support payouts to the business owner's destination country via standard SWIFT/ACH or local bank transfers without requiring a US Delaware C-Corp. (Rejects raw Stripe checkout proposals which lack automated MoR tax handling and impose restrictive country payout requirements).
3. **Pluggable Architecture**:
   - The core billing domain must remain decoupled from specific vendor SDKs via a clean `BillingProvider` interface.
   - Must support headless checkout sessions, customer billing portal, and cryptographically verified webhook handlers.
4. **Idempotency & Event Ordering**:
   - Every incoming billing webhook must be recorded in an immutable `webhook_events` table before processing.
   - Replay attacks or duplicate deliveries must return HTTP 200 without duplicate state changes.
   - Out-of-order events (e.g. `subscription.updated` arriving before `subscription.created`) must be rejected using `subscriptions.last_event_at`.
5. **Cost Safety & Margin Floor**:
   - Subscription pricing and quotas must guarantee a minimum 55% gross margin (`MIN_PLAN_MARGIN = 0.55`) after MoR transaction fees (assumed at 5% + \$0.50 per transaction [A]) even if a subscriber uses 100% of their monthly AI allowance.

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
   - **Do not wire real checkout:** The app retains its honest "Coming soon" state without fake checkout redirects or premature live payment collection.
3. **Single State Authority**:
   - The client never dictates or updates plan state.
   - `syncPlan(userId, planId, planSource)` is the single server-side authority that mutates `profiles.plan_id`.

---

## 3. Cost Benchmark & Unit Economics Model

Empirical cost measurements on the benchmark model (`gemini-2.5-flash`):
- `generate`: \$0.003493 / call
- `autofill`: \$0.001675 / call
- `brand_draft`: \$0.001125 / call
- Template reuse / Workbench: \$0.000000

### Sustainable Tier Architecture:
- **Free**: \$0/month. Monthly AI budget cap: \$0.40. Standard included allowance.
- **Pro**: \$19/month (\$190/year). Monthly AI budget cap: \$4.00.
  - Payment fee (5% + \$0.50): \$1.45 $\rightarrow$ Net revenue: \$17.55.
  - Worst-case gross margin (at \$4.00 budget cap): **71.3%** ($\ge 55\%$ floor).
  - Typical gross margin (at 30% utilization, \$1.28 cost): **85.6%**.
- **Studio**: \$49/month (\$490/year). Monthly AI budget cap: \$12.00.
  - Payment fee (5% + \$0.50): \$2.95 $\rightarrow$ Net revenue: \$46.05.
  - Worst-case gross margin (at \$12.00 budget cap): **69.5%** ($\ge 55\%$ floor).
  - Typical gross margin (at 30% utilization, \$3.90 cost): **86.0%**.

---

## 4. Consequences

- **Positive**:
  - Full tax compliance handled externally.
  - Zero lock-in: swapping providers requires writing one adapter class implementing `BillingProvider`.
  - Guarantees replay safety and out-of-order resilience in webhook processing.
  - Mathematically impossible for a user's AI API usage to exceed their subscription net revenue due to the enforced `monthly_ai_budget_usd`.
- **Negative**:
  - Slightly higher transaction fees (typically ~5% + \$0.50) compared to raw payment processors, which is offset by zero accounting overhead and direct international payout support.
