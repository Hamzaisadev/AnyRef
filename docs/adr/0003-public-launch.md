# ADR 0003: Public Multi-Tenant Launch and Freemium Monetization Architecture

## Context
Anyref was originally conceived and designed in Phases 0–3 as an invite-only private utility for a single creative owner. As the value of automated reference poster deconstruction and brand prompt engineering became evident, the strategic decision was made to open Anyref to the public as a self-sustaining SaaS platform.

## Decision
1. **Public Open Registration**:
   - Authentication transitions from an invite-only whitelist to open registration using passwordless email magic links and Google OAuth.
   - User identity is managed strictly via Supabase Auth with server-side cookie verification.

2. **Freemium Business Model (Ads + Paywall)**:
   - **Free Tier**: Supported by unobtrusive, studio-grade ad placements (`<AdSlot>`). Capped at 5 generations and 5 autofills per rolling 24 hours, with up to 2 brands and 50 entries.
   - **Plus Tier**: Paid subscription (\$5/month or \$48/year). Completely removes ads, raises quotas (50 generations, 100 autofills/day, 10 brands, 2000 entries), and unlocks batch autofill.
   - **Owner and Admin Staff**: Completely exempt from all quotas, limits, and ads (`null` = unlimited).

3. **Merchant-of-Record Billing Architecture**:
   - Billing is abstracted behind a `BillingProvider` interface.
   - Due to global tax compliance (sales tax, VAT, MoR requirements), a Merchant of Record (Paddle / Lemon Squeezy / Stripe Tax) is selected for automated tax remittance and cross-border payment acceptance.
   - Webhook processing is strictly idempotent, verifying raw cryptographic signatures and recording events in `webhook_events` before executing account state updates via `syncPlan()`.

4. **Public Legal & Privacy Foundations**:
   - Public terms clarify that uploaded Pinterest references are strictly private to each account, never published, and never used to train machine learning models.
   - Cookie and consent tracking records are maintained in `consent_records` with compliant EEA/UK CMP integration.

## Consequences
- Requires persistent profile tracking in `public.profiles` linked to `auth.users`.
- Daily usage and rolling spend must be tracked per-user in `ai_usage`.
- Ad placements must respect layout stability (CLS < 0.1) and strictly vanish for Plus and staff members.
