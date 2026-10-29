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
| S1-4 | `checkEntryQuota` never called from `entryService` | `src/services/entryService.ts`, `src/services/quotaService.ts`, `supabase/migrations/0003_enforce_entry_limit.sql` | `CONFIRMED-FIXED` | db98625 | `tests/integration/stage1/s1_4_entryQuota.test.ts` | Called checkEntryQuota in entryService.createEntry, created 0003_enforce_entry_limit.sql, verified max_brands trigger and max_entries quota on real Supabase. |
| S1-5 | `createAdminClient()` unused; services write with anon client | `src/lib/supabaseServer.ts`, `src/services/*`, `src/data/auditRepo.ts` | `CONFIRMED-FIXED` | 906d261 | `tests/integration/stage1/s1_5_serviceRoleClient.test.ts` | Migrated privileged service writes (billingService, auditRepo, accountService, adminService) from createClient() to createAdminClient(). Proved regular user is denied profiles update/audit_log insert while service role succeeds on real Supabase. |
| S1-6 | `adminService.conductAbuseReview` queries non-existent columns | `src/services/adminService.ts` | `CONFIRMED-FIXED` | cf3817a | `tests/integration/stage1/s1_6_abuseReview.test.ts` | Removed non-existent columns (description from brands; title, category from entries) and selected valid schema columns with explicit error handling. Verified retrieval on real Supabase. |
| S1-7 | `exportService` queries non-existent columns & has no UI route | `src/services/exportService.ts`, `src/app/api/account/export/route.ts` | `CONFIRMED-FIXED` | 8e9fe46 | `tests/integration/stage1/s1_7_exportService.test.ts` | Aligned brand & entry columns with schema, used admin client for audit_log rate limit query, implemented GET /api/account/export route with attachment download header, and verified rate limit and user isolation on real Supabase. |
| S1-8 | `generateService`/`autofillService` hardcode tokens/cost | `src/services/generateService.ts`, `src/services/autofillService.ts`, `src/ai/*` | `CONFIRMED-FIXED` | c18282c | `tests/unit/pricing.test.ts`, `tests/integration/stage1/s1_8_aiUsageDynamicCost.test.ts` | Captured usageMetadata from Gemini response, implemented computeAiCost using token pricing schedule ($0.075/1M input, $0.30/1M output), and passed dynamic tokens and computed costs to recordAiUsage. Verified on real Supabase. |
| S1-9 | `generateService`/`autofillService` never read `system_prompts` | `src/services/generateService.ts`, `src/services/autofillService.ts`, `src/services/promptService.ts` | `CONFIRMED-FIXED` | fd4cb6e | `tests/integration/stage1/s1_9_systemPrompts.test.ts` | Implemented promptService to load active versioned system prompt with 5m cache and static fallback, passed prompt body to provider, recorded system_prompt_version on proposal, and enforced Hard Rule 5 (prompt text never leaves server). Verified on real Supabase. |
| S1-10 | Hardcoded fallback secrets in `env.ts` | `src/lib/env.ts`, `src/app/api/cron/cleanup/route.ts`, `src/app/api/webhooks/billing/route.ts` | `CONFIRMED-FIXED` | 3d152cc | `tests/unit/env.test.ts`, `tests/integration/stage1/s1_10_secretsEnforcement.test.ts` | Enforced strict secret validation in production requiring distinct non-placeholder secrets for SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, and BILLING_WEBHOOK_SECRET. Removed fallback secrets from cron and webhook routes and switched cron cleanup to createAdminClient. Verified rejection on real server. |
| S1-11 | `handle_new_user()` does not seed defaults; `seed.sql` has hardcoded dev user | `supabase/migrations/0004_seed_user_defaults.sql`, `src/services/accountService.ts`, `src/app/api/auth/callback/route.ts` | `CONFIRMED-FIXED` | 40d8a84 | `tests/integration/stage1/s1_11_userDefaults.test.ts` | Created migration 0004 to seed defaults in handle_new_user(), added idempotent ensureUserSeeded() in accountService called on auth callback code exchange, and verified user receives 1 sample brand and 2 starter entries on real Supabase. |
| S1-12 | Consent timestamps collected on login never saved to `profiles` | `src/services/consentService.ts`, `src/services/session.ts`, `src/app/(auth)/login/page.tsx`, `src/app/api/auth/callback/route.ts` | `CONFIRMED-FIXED` | 63d1fde | `tests/integration/stage1/s1_12_consentTimestamps.test.ts` | Persisted tos_version, tos_accepted_at, and age_confirmed_at to profiles using admin client when user consents, passed consent metadata in login flow, and exposed consent status in session UserProfile. Verified persistence on real Supabase. |
| S1-13 | Duplicate Google SDKs & model name mismatch | `package.json`, `src/lib/env.ts`, `src/ai/geminiProvider.ts` | `CONFIRMED-FIXED` | ea2961a | `tests/unit/geminiProvider.test.ts` | Removed duplicate `@google/genai` dependency, standardized default model on `gemini-2.5-flash` across env and provider, aligned pricing schedule, and verified with unit tests. |

---

## Stage 2 — Core User Flow

| ID | Claim | File(s) | Status | Commit | Test Name | Notes |
|---|---|---|---|---|---|---|
| S2-1 | `workspace/generate` saves entry without uploading reference image | `src/app/(app)/workspace/generate/page.tsx`, `src/app/api/upload/route.ts` | `CONFIRMED-FIXED` | da5fa79 | `tests/integration/stage2/s2_1_referenceUpload.test.ts` | Uploaded reference image to references bucket via /api/upload during handleSaveEntry and stored authenticated asset route path on the entry. Verified upload and reference_path persistence on real Supabase. |
| S2-2 | `entries/[id]/compare` does not upload result image | `src/app/(app)/entries/[id]/compare/page.tsx`, `src/app/api/entries/[id]/route.ts` | `CONFIRMED-FIXED` | 6699e9d | `tests/integration/stage2/s2_2_resultUpload.test.ts` | Uploaded pasted/selected result image to results bucket via /api/upload on save, persisted result_path, and confirmed entry update with status and note. Verified persistence on real Supabase. |
| S2-3 | Signed URLs expiry / missing authenticated asset route | `src/app/api/assets/[...path]/route.ts`, `src/services/assetService.ts`, `src/services/session.ts` | `CONFIRMED-FIXED` | 5546b72 | `tests/integration/stage2/s2_3_assetRoute.test.ts` | Implemented GET /api/assets/[...path] with strict bucket validation, user ownership verification (with staff override), and short-lived signed URL generation. Verified owner access, 403 cross-user denial, and 404 for missing assets against real Supabase. |
| S2-4 | Library cards show text snippet only, no thumbnails | `src/app/(app)/library/page.tsx` | `CONFIRMED-FIXED` | 3036b76 | `tests/integration/stage2/s2_4_libraryThumbnails.test.ts` | Added lazy-loaded reference and result thumbnails to library cards with side-by-side comparison and direct 'Add result' CTA for pending entries. Verified persistence on real Supabase. |
| S2-5 | Autofill Studio ends on read-only table | `src/app/autofill/page.tsx` | `TODO` | | | |
| S2-6 | Library & Autofill ignore `activeBrandId` | `src/app/library/page.tsx`, `src/app/autofill/page.tsx` | `TODO` | | | |
| S2-7 | Library "copy" copies raw `{{mustache}}` | `src/app/(app)/library/page.tsx`, `src/domain/renderPrompt.ts` | `CONFIRMED-FIXED` | 3036b76 | `tests/unit/libraryPromptRender.test.ts` | Implemented copyPrompt to render active brand defaults and brand_field bindings into prompt template slots instead of raw mustache tags, and labeled button 'Copy Rendered'. |
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
