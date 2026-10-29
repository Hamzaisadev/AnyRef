# Audit Findings Triage & Tracking

Running status of external audit findings for Anyref stabilization.

## Status Legend
- `TODO`: Pending verification and reproduction
- `CONFIRMED-FIXED`: Verified, reproduced with test, fixed, and verified passing against real database
- `PARTIAL`: In progress or partially resolved
- `NOT REPRODUCED`: Investigated with evidence showing the issue is not reproducible or invalid
- `WON'T FIX`: Acknowledged but deliberately not addressed (with documented reason)

---

## Stage 1 — Data Layer Correctness

| ID | Claim | File(s) | Status | Commit | Test Name | Notes |
|---|---|---|---|---|---|---|
| S1-1 | `quotaService.recordAiUsage` inserts `model`, `cost_usd` (not in schema), omits `kind`, swallows errors | `src/services/quotaService.ts` | `CONFIRMED-FIXED` | deb124d | `tests/integration/stage1/s1_1_quotaService.test.ts` | Aligned insert with schema (kind, est_cost_usd). Used admin client and threw explicit error instead of swallowing. Verified against real Supabase. |
| S1-2 | `checkDailyQuota` does not filter by `kind` | `src/services/quotaService.ts`, `src/services/entitlements.ts` | `CONFIRMED-FIXED` | 55f38a3 | `tests/integration/stage1/s1_2_dailyQuotaKind.test.ts` | Filtered checkDailyQuota by action kind (generate vs autofill). Migrated to admin client. Verified free user blocked on generate is allowed autofill against real Supabase. |
| S1-3 | `checkCircuitBreaker` queries non-existent `cost_usd` | `src/services/quotaService.ts` | `CONFIRMED-FIXED` | c0ab8f6 | `tests/integration/stage1/s1_3_circuitBreaker.test.ts` | Used est_cost_usd instead of cost_usd and migrated to admin client. Verified kill switch trips on real database. |
| S1-4 | `checkEntryQuota` never called from `entryService` | `src/services/entryService.ts`, `src/services/quotaService.ts`, `supabase/migrations/0003_enforce_entry_limit.sql` | `CONFIRMED-FIXED` | pending | `tests/integration/stage1/s1_4_entryQuota.test.ts` | Called checkEntryQuota in entryService.createEntry, created 0003_enforce_entry_limit.sql, verified max_brands trigger and max_entries quota on real Supabase. |
| S1-5 | `createAdminClient()` unused; services write with anon client | `src/lib/supabaseServer.ts`, `src/services/*` | `TODO` | | | |
| S1-6 | `adminService.conductAbuseReview` queries non-existent columns | `src/services/adminService.ts` | `TODO` | | | |
| S1-7 | `exportService` queries non-existent columns & has no UI route | `src/services/exportService.ts` | `TODO` | | | |
| S1-8 | `generateService`/`autofillService` hardcode tokens/cost | `src/services/generateService.ts`, `src/services/autofillService.ts` | `TODO` | | | |
| S1-9 | `generateService`/`autofillService` never read `system_prompts` | `src/services/generateService.ts`, `src/services/autofillService.ts` | `TODO` | | | |
| S1-10 | Hardcoded fallback secrets in `env.ts` | `src/lib/env.ts` | `TODO` | | | |
| S1-11 | `handle_new_user()` does not seed defaults; `seed.sql` has hardcoded dev user | `supabase/migrations/0002_roles_plans.sql`, `supabase/seed.sql` | `TODO` | | | |
| S1-12 | Consent timestamps collected on login never saved to `profiles` | `src/services/consentService.ts`, `src/services/session.ts` | `TODO` | | | |
| S1-13 | Duplicate Google SDKs & model name mismatch | `package.json`, `src/services/aiProvider.ts` | `TODO` | | | |

---

## Stage 2 — Core User Flow

| ID | Claim | File(s) | Status | Commit | Test Name | Notes |
|---|---|---|---|---|---|---|
| S2-1 | `workspace/generate` saves entry without uploading reference image | `src/app/workspace/generate/page.tsx` | `TODO` | | | |
| S2-2 | `entries/[id]/compare` does not upload result image | `src/app/entries/[id]/compare/page.tsx` | `TODO` | | | |
| S2-3 | Signed URLs expiry / missing authenticated asset route | `src/app/api/assets/[...path]/route.ts`, `src/services/assetService.ts` | `TODO` | | | |
| S2-4 | Library cards show text snippet only, no thumbnails | `src/app/library/page.tsx` | `TODO` | | | |
| S2-5 | Autofill Studio ends on read-only table | `src/app/autofill/page.tsx` | `TODO` | | | |
| S2-6 | Library & Autofill ignore `activeBrandId` | `src/app/library/page.tsx`, `src/app/autofill/page.tsx` | `TODO` | | | |
| S2-7 | Library "copy" copies raw `{{mustache}}` | `src/app/library/page.tsx` | `TODO` | | | |
| S2-8 | Brands are create-only | `src/services/brandService.ts`, `src/app/brands` | `TODO` | | | |
| S2-9 | Workbench brand color mapping array mismatch | `src/app/workspace/workbench/page.tsx` | `TODO` | | | |
| S2-10 | Template text & slots cannot be edited | `src/app/workspace/workbench/page.tsx` | `TODO` | | | |
| S2-11 | Slot colors render as plain text in preview | `src/components/SlotPreview.tsx` | `TODO` | | | |
| S2-12 | Empty brand dropdown with no way forward for new users | `src/components/BrandSwitcher.tsx` | `TODO` | | | |
| S2-13 | Login `redirectTo` vs `next` parameter mismatch | `src/app/login/page.tsx`, `src/app/auth/callback/route.ts` | `TODO` | | | |
| S2-14 | `/settings` route missing | `src/app/settings/page.tsx` | `TODO` | | | |

---

## Stage 3 — Prompt Rendering & Validation

| ID | Claim | File(s) | Status | Commit | Test Name | Notes |
|---|---|---|---|---|---|---|
| S3-1 | `renderPrompt` wraps every value in quotes | `src/domain/renderPrompt.ts` | `TODO` | | | |
| S3-2 | `validateInjectionAndBrandRules` uses substring matching | `src/domain/validateInjection.ts` | `TODO` | | | |
| S3-3 | Limits bypassable via batch autofill | `src/services/entryService.ts`, `src/services/quotaService.ts` | `TODO` | | | |

---

## Stage 4 — Honest Billing & Ads

| Item | Claim | Status | Commit | Test Name | Notes |
|---|---|---|---|---|---|
| S4-1 | Checkout button dead / fake URL | `TODO` | | | |
| S4-2 | Webhook secret verification with configured secret | `TODO` | | | |
| S4-3 | Remove AdSlot & ConsentBanner, set `show_ads = false` in migration | `TODO` | | | |
| S4-4 | Update docs & legal pages to match reality | `TODO` | | | |

---

## Stage 5 — Quality Fixes

| Item | Claim | Status | Commit | Test Name | Notes |
|---|---|---|---|---|---|
| S5-1 | `URL.revokeObjectURL` missing on unmount/replace | `TODO` | | | |
| S5-2 | Brand switcher hidden on mobile | `TODO` | | | |
| S5-3 | Dark mode brand `--primary` contrast safe | `TODO` | | | |
| S5-4 | `@media (prefers-reduced-motion: reduce)` | `TODO` | | | |
| S5-5 | Remove confirmed dead code | `TODO` | | | |
