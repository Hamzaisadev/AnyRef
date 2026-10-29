# ROLE

You are the senior engineer on **Anyref**. Two external audits reviewed the repo and reported many bugs and gaps. Your job now is **stabilization, not new features**: verify each finding, fix what is real, and prove every fix against a **real local Supabase database**, not mocks.

Previous phases were marked "complete", but the audits claim unit tests pass only because Supabase is mocked, which hides schema mismatches. Treat "tests pass" as unproven until the integration tests below exist.

# SCOPE FREEZE (read first)

- **Do not** add new features, pages, roles, plans or integrations.
- **Do not** touch the admin panel beyond what a listed bug requires. No new admin pages, no new audit features, no compliance work.
- **Do not** wire a real payment provider, add image generation, or build a Chrome extension. Those wait for real usage data.
- **Do not** change prices, plan limits or the free-tier model.
- Hard rules in `PLAN.md` section 0 still apply (never generate or edit images, AI key server-only, never invent prices/discounts/dates, never auto-save AI proposals, system prompts never leave the server).
- New schema changes go in **new migrations** (`0003_*.sql` onward). Never edit applied migrations.

# METHOD (applies to every finding)

1. **Reproduce first.** Write a failing test (integration against local Supabase where the bug touches the database, otherwise unit). If you cannot reproduce it, mark it `NOT REPRODUCED` with the evidence. Do not "fix" it.
2. **Fix** with the smallest change.
3. **Prove** the test now passes against the real database.
4. **One finding per commit**, Conventional Commits, message references the finding ID.
5. Keep a running table in `docs/audit-triage.md`: ID, claim, file(s), status (`CONFIRMED-FIXED`, `PARTIAL`, `NOT REPRODUCED`, `WON'T FIX (reason)`), commit, test name.

The audit claims below come from external reviewers and may be wrong or outdated. Verify each against the current code before acting.

# STEP 0 — Real-database test harness (do this before any fix)

- [ ] Add a Vitest **integration** project that runs against `supabase start` (local), applies all migrations plus `seed.sql`, and creates real test users through Supabase Auth.
- [ ] **No `vi.mock` of Supabase or `supabaseServer` in integration tests.** Mock only the AI provider and the billing provider.
- [ ] Helpers: `createTestUser(role?)`, `asUser(userId)` (authenticated client), `adminClient()` (service role), `resetDb()`.
- [ ] Add a **schema contract test**: for every table the code reads or writes, assert the columns used exist in the migrated database (generate Supabase types with `supabase gen types` and make the build fail if code references a missing column; type-check the `data/` and `services/` layers against those generated types).
- [ ] CI runs the integration project on every PR. Document `pnpm test:integration` in README.
- **DoD:** harness runs green on an empty test; the type-generation check is part of `pnpm typecheck`; CI updated.

# STAGE 1 — Data layer correctness (highest priority)

| ID | Claim (verify) | Expected fix |
|---|---|---|
| S1-1 | `quotaService.recordAiUsage` inserts `model`, `cost_usd` (not in schema) and omits required `kind`; errors are swallowed, so `ai_usage` stays empty and quotas/cost cap never trigger | Align inserts with the real schema (`kind`, `est_cost_usd`, `plan_id` if present in migrations). **Stop swallowing errors:** log with request id and surface a safe failure; an AI call whose usage cannot be recorded must not be treated as free |
| S1-2 | `checkDailyQuota` does not filter by `kind`, so generate and autofill share one counter | Filter by `kind` and the rolling window |
| S1-3 | `checkCircuitBreaker` queries non-existent `cost_usd` | Use `est_cost_usd` |
| S1-4 | `checkEntryQuota` is never called from `entryService` | Call it; also confirm the DB trigger enforces `max_entries` and `max_brands` |
| S1-5 | `createAdminClient()` exists but is never used; `billingService`, `adminService`, `accountService`, `auditRepo` write to service-role-only tables with the anon/user client | Use the admin client for privileged writes, only in server modules guarded by `server-only`; keep user-scoped client for user data |
| S1-6 | `adminService.conductAbuseReview` queries non-existent columns (`description`, `title`, `category`) and uses the user client, so RLS returns nothing | Fix columns, use the admin client, keep reason + audit logging |
| S1-7 | `exportService` queries non-existent columns and has no UI route | Fix columns; add a test that export JSON contains a seeded user's brands and entries and excludes other users' data |
| S1-8 | `generateService`/`autofillService` hardcode tokens/cost (`1000/500/0.001`) | Read `usageMetadata` from the provider response; compute cost from the config price table; test with a mocked provider returning known usage |
| S1-9 | `generateService`/`autofillService` never read the `system_prompts` table | Load the active global prompt from the DB (cache per request), fall back to the default only if none is active, store `system_prompt_version` on entries; never expose prompt text to clients or logs |
| S1-10 | Hardcoded fallbacks: `BILLING_WEBHOOK_SECRET \|\| 'test_webhook_secret'`, `CRON_SECRET \|\| 'test_cron_secret'`, `SUPABASE_SERVICE_ROLE_KEY \|\| anonKey` | Remove all fallbacks. `env.ts` must fail at boot in production if these are missing or equal to placeholder values. Add tests: webhook with the old test secret is rejected; boot fails without the secrets |
| S1-11 | `handle_new_user()` never calls `seed_user_defaults()`, so new users have 0 brands and no samples; `seed.sql` attaches only to a hardcoded dev user | Seed one editable sample brand and two sample entries per new user (clearly labeled "Sample"), not the owner's real brands. Remove hardcoded dev-user data from `seed.sql` used outside local dev |
| S1-12 | Consent timestamps (ToS/age) are collected on login but never saved to `profiles` | Persist `tos_version`, `tos_accepted_at`, `age_confirmed_at` server-side |
| S1-13 | Duplicate Google SDKs (`@google/genai` and `@google/generative-ai`) and model name mismatch with docs | Keep one SDK, read model from env, correct docs |

**Tests required:** real-DB integration tests for S1-1 through S1-11, including: free user blocked after the daily limit for `generate` but still allowed `autofill`; staff never blocked but still logged; a service-role write succeeds where the user client is denied; a second user cannot read the first user's export.

**DoD:** `ai_usage` rows appear after every AI call; quotas and the cost cap demonstrably trigger in tests; no secret fallbacks remain (`grep` check in CI); schema contract test green.

# STAGE 2 — The core loop must actually work

Goal: **Upload reference → generate → fill → copy → paste result → mark Winner → see both images in the Library.** One Playwright E2E test must cover this against local Supabase (AI provider mocked).

| ID | Claim (verify) | Expected fix |
|---|---|---|
| S2-1 | `workspace/generate` saves the entry without uploading the reference image (`reference_path` never set) | Upload via `/api/upload` on save, store `reference_path` |
| S2-2 | `entries/[id]/compare` only sends `{status, note}`; pasted result image is never uploaded (`result_path` never set) and the button still shows "Saved" | Upload the result, set `result_path`, show success only after the server confirms; show an error otherwise |
| S2-3 | Images are served via 60-second signed URLs or a non-existent `/api/assets/...` route | Add an authenticated asset route that checks ownership and returns short-lived signed URLs on demand (refresh on expiry); test that another user's path returns 403/404 |
| S2-4 | Library cards show only a text snippet, no reference/result thumbnails | Show thumbnails (reference, and result when present), lazy-loaded; filter by active brand |
| S2-5 | Autofill Studio ends on a read-only table: no editable fields, no rendered prompt, no copy, no way to continue | Make values editable, add "needs you" inputs, a live rendered prompt with Copy, and "Open in Workbench" carrying the values. Never auto-fill `never_invent` slots (server-side check stays) |
| S2-6 | Library and Autofill ignore `activeBrandId` | Filter by the active brand; selection persists |
| S2-7 | Library "copy" copies raw `{{mustache}}` | Copy the rendered prompt, or open the Workbench; label the action clearly |
| S2-8 | Brands are create-only (no edit, delete, logo upload, `default_values`) | Add edit and delete (with confirm and dependent-entry warning), logo upload through the same validated upload path, `default_values` editing |
| S2-9 | Workbench looks up `colors_primary` / `colors_secondary` but `brands.colors` is an array | Map `colors[0]` / `colors[1]` correctly; test the brand-field binding |
| S2-10 | Template text and slots cannot be edited ("Make slot / Collapse to text" missing) | Implement the minimal version: select text → make slot; click slot → collapse; re-run template validation before save |
| S2-11 | Slot colors are documented but the template renders as plain text | Highlight slots in the preview using the existing token colors (blue brand, orange per-poster, gray layout) |
| S2-12 | New users see an empty brand dropdown with no way forward | Inline "Create your first brand" call to action; with S1-11 seeding this should be rare but keep the fallback |
| S2-13 | Login ignores `redirectTo` while the callback reads `next`; users land on an empty page after sign-in | Use one parameter name, validate it as a same-origin relative path (no open redirect), test it |
| S2-14 | `/settings` is protected and promised in Terms/Privacy but missing | Create a minimal `/settings` with working data export and account deletion using the fixed services; if either is not ready, **remove the promise from the legal text** instead of leaving it |

**DoD:** the E2E loop passes; refresh keeps both images; Library shows thumbnails; Autofill → Workbench → copy works; no dead-end screens.

# STAGE 3 — Prompt rendering and validation bugs

| ID | Claim (verify) | Expected fix |
|---|---|---|
| S3-1 | `renderPrompt` wraps every value in quotes, so colors become `"#4B2BFF"` and templates that already quote a slot get `""TEXT""` | Quote only `short_text` slots whose template position is not already inside quotes; add unit tests for every slot type and the already-quoted case |
| S3-2 | `validateInjectionAndBrandRules` uses substring matching, so a rule like "avoid cars" rejects "cardboard" or "carefully" | Match whole words (Unicode-aware); add tests with those exact examples; keep the rule that URLs/emails in AI output are rejected |
| S3-3 | `checkEntryQuota`/limits are bypassable through batch autofill | Check limits per item in batch; test with a free user and `batch_max` |

# STAGE 4 — Honest billing and ads (no new features)

The goal is to stop the app from **lying or showing broken things**, not to finish billing.

- [ ] **Upgrade button / checkout:** the button has no handler and `StandardMoRBillingProvider` returns a fake URL. Replace with an honest state: show current plan and usage, and a disabled "Plus is coming soon" (or "Join the waitlist" storing an email, if trivial). The fake `checkout.anyref.app` URL must not be reachable from any code path.
- [ ] Keep the webhook route, signature verification and idempotency code and tests; they stay dormant. Verify the signature test uses a configured secret, never a default.
- [ ] **Ads:** remove `<AdSlot>` and the consent banner from all rendered pages and set `show_ads` to false in seeded plans via a new migration. Keep the ADR and the `AdProvider` interface but unused. Consent banner returns only if ads return.
- [ ] Update `PLAN.md`, `README.md` and legal pages so they no longer claim features that are not active (ads, checkout).

**DoD:** no clickable control leads nowhere; no fake URLs; no ad scripts or consent banner in the rendered pages; docs match reality.

# STAGE 5 — Quality fixes (batch, lower priority)

- [ ] `URL.createObjectURL` without `revokeObjectURL` in generate, autofill and compare pages: revoke on replace and unmount.
- [ ] Brand switcher hidden on mobile (`hidden sm:block`): make it reachable on mobile.
- [ ] Dark mode: injected brand `--primary` can be invisible on the dark background. Compute a contrast-safe variant for each theme and test with a very dark brand color.
- [ ] Add `@media (prefers-reduced-motion: reduce)` rules (the docs already claim it).
- [ ] Remove dead code the audits flagged as unused if confirmed unused (`PaywallModal` only if truly unreferenced after Stage 4).

# WHAT TO REPORT

After each stage, post a short status: findings confirmed/fixed, findings not reproduced (with evidence), tests added, anything deferred and why.

At the end of Stage 5, also report:

1. A real **cost-per-call table** from recorded usage (average tokens and estimated cost for `generate` and `autofill`, from 10 real runs against the live provider).
2. The current schema contract test and integration test counts.
3. Anything in the original audits that you believe is wrong, with evidence.
4. A short "ready to dogfood" checklist: what the owner should test first on real Rewired/Riwayat work.

# STOP CONDITION

Stop after Stage 5. Do not start any feature work, billing integration, image generation or admin expansion. The owner will use the app for real work for two to three weeks and then decide what to build next based on actual usage.

# CONSTRAINTS

- No placeholders, no "TBD".
- No secrets in code, tests or docs. `.env.example` has names only.
- Do not claim a finding is fixed unless its test ran against the real local database and passed.
- If a finding turns out to be incorrect, say so plainly in `docs/audit-triage.md`; being right matters more than closing items.
