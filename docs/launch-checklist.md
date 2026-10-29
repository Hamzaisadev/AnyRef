# Anyref Public Launch Checklist & Rollback Plan

**Version**: 1.0.0  
**Target Release**: Production Public Multi-Tenant Launch  

---

## 1. Pre-Flight Verification Checklist

- [x] **Database & Migrations**:
  - `0001_init.sql` and `0002_roles_plans.sql` applied cleanly.
  - Partial unique index `one_owner` verified on `profiles(role)`.
  - Immutable audit log triggers active (zero UPDATE/DELETE allowed).
- [x] **Authentication & Role Authorization**:
  - Bootstrap owner script (`scripts/bootstrap-owner.ts`) successfully tested.
  - Central authorization matrix in `src/services/authz.ts` passes 30/30 matrix cell tests.
  - Disposable email domains blocked at sign-up.
  - Mandatory age confirmation (16+) and Terms/Privacy acceptance recorded.
- [x] **Quota Enforcement & Staff Zero Limits**:
  - Staff (`owner`, `admin`) resolve to `null` (unlimited) across all limits.
  - Free users capped at 5 generations/day, 5 autofills/day, 2 brands, 50 entries.
  - Global daily cost cap circuit breaker auto-trips AI kill switch when breached.
- [x] **Ad Monetization & CLS Safety**:
  - `<AdSlot />` strictly excluded for Plus and Staff users.
  - Fixed heights (`min-h-[250px]`, `min-h-[90px]`) prevent layout shifts (CLS < 0.1).
  - GDPR/CCPA Consent banner active and functional.
- [x] **Engine Protection (Rule 6)**:
  - System prompts stored globally in PostgreSQL with owner-only access.
  - Zero leakage in client bundles, errors, or logs.
  - SSRF immunity verified across all routes.
- [x] **Legal & Compliance**:
  - Terms of Service (`/terms`) and Privacy Policy (`/privacy`) live.
  - DMCA takedown procedure and designated contact established.

---

## 2. Emergency Rollback Plan

If a critical incident occurs during initial launch:

1. **AI Safety Anomaly**:
   - Trip the AI Kill Switch at `/admin`.
   - Halts all AI calls without taking down the web app or user libraries.
2. **Registration Spam / Bot Flood**:
   - Pause Open Sign-ups at `/admin`.
   - Existing users continue uninterrupted while public account creation is blocked.
3. **Database Incident / Revert Migration**:
   - Revert application deployment to previous release tag.
   - Point to the last automated hourly snapshot in Supabase dashboard.
4. **Billing Webhook Failure**:
   - If webhooks fail, events remain queued in the Merchant of Record portal with automatic retry.
   - Once resolved, Anyref's idempotent webhook engine safely replays events without duplicates.
