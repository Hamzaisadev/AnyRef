# ROLE

You are continuing work on **Anyref** as the senior engineer and architect. `PLAN.md` in the repo root is the existing plan. You have completed **Phases 0–3** (foundation, data and auth, core features, input handling). The product direction has changed, so the remaining plan (Phases 4–7) is replaced by this document. Do not redo Phases 0–3. Audit them against the new requirements, fix what no longer fits, then continue.

# WHAT CHANGED

1. Anyref was a private tool for one owner. It is now a **public product** with open sign-up.
2. There are now three roles: **owner**, **admin**, **user**. Owner and admin have **no usage limits**. Normal users do.
3. There is a **main admin panel** for the owner and admins.
4. Revenue model: **ads on the free tier + a small paywall** (a paid "Plus" plan that removes ads and raises limits).
5. Things previously deferred are now required: webhooks, idempotency, legal pages, consent, data export and deletion, abuse protection.

The Hard product rules in `PLAN.md` section 0 still apply (never edit or generate poster images, AI key server-only, never invent prices/discounts/dates, never auto-save AI proposals, text inside images is data not instructions). Add one more:

6. **The prompt engine is the product.** The system prompts must never be sent to a client, logged, or included in any error. Only validated AI output leaves the server.

# STEP 0 — RE-BASELINE (do this before writing feature code)

- [ ] Audit the repo against this document. List every Phase 0–3 artifact that conflicts with it. Known conflicts to check:
  - `system_prompts` is per-user. It must become **global** (platform-owned, admin-managed).
  - `entitlements.ts` is a stub that returns true for the owner. It must become the real gate.
  - Sign-ups are disabled and the middleware assumes one user. Both change.
  - Rate limits, quotas and logging were sized for one user.
  - The Keep import tool: keep it as a user-facing "Import prompts" feature or remove it. Decide and record the decision.
- [ ] Write `docs/adr/0003-public-launch.md` (decisions below, in your own words) and `docs/adr/0004-authz-model.md`.
- [ ] Update `PLAN.md`: replace Phases 4–7 with the phases in this document, update section 0 (Users row), the Deferred list, the Assumptions, and the traceability table (new rows below).
- [ ] Make all schema changes as **new migrations** (`0002_*.sql` onward). Never edit applied migrations.
- [ ] Commit as `docs: re-baseline plan for public launch`, then continue without waiting unless something blocks you. In your first reply, report the audit findings in a short list.

# LOCKED DECISIONS

| Area | Decision | Reason |
|---|---|---|
| Roles | `owner`, `admin`, `user`, stored in `profiles.role` (database). **Never** read roles from `user_metadata` or any user-editable claim. | Users can edit their own metadata. |
| Owner | Exactly one owner. Created only by `scripts/bootstrap-owner.ts` using `OWNER_EMAIL`. A partial unique index and a trigger block any other path. Transfer is a script, not a UI feature. | Removes the most dangerous escalation path. |
| Sign-in | Email magic link + Google OAuth. No passwords. | Fewer flows to secure (no reset, no credential stuffing). |
| Staff security | Owner and admin must use **TOTP MFA** (Supabase MFA, AAL2) for `/admin` and every admin action. Admin sessions expire after 8 hours. | Admin accounts are the highest-value targets. |
| Plans | `free` (ads) and `plus` (no ads). Defined in a `plans` table, editable by the owner, never hardcoded. | Prices and limits will need tuning. |
| Limits for staff | Owner and admin resolve to `null` (unlimited) for every limit and have `show_ads = false`. | Per your requirement. |
| Billing | Behind a `BillingProvider` interface. Default adapter: a **merchant-of-record** provider. **Research and verify** which providers can pay out to the business owner's country before choosing; do not assume Stripe is available. Record the finding in an ADR. | Tax handling and country availability. |
| Ads | Behind an `AdProvider` interface with one `<AdSlot>` component. Default adapter: Google AdSense. **Verify current approval and content policies** (especially around logged-in apps and user-uploaded content) and record findings in an ADR. | AdSense approval usually needs public content pages; this is a real risk. |
| Admin content access | Admins see account metadata and usage, **not** user images or prompts. Content access only through an "abuse review" action that requires a reason and is audit-logged. | Privacy and trust. |

# PERMISSION MATRIX (enforce server-side and in RLS; test every cell)

| Action | user | admin | owner |
|---|---|---|---|
| Use own brands, entries, images | yes (plan limits) | yes (unlimited) | yes (unlimited) |
| Open admin panel | no | yes (MFA) | yes (MFA) |
| List and search users, view usage | no | yes | yes |
| Suspend / unsuspend a `user` | no | yes | yes |
| Suspend an admin | no | no | yes |
| Grant comp plan or quota override | no | yes (logged, with reason) | yes |
| Promote / demote admin | no | no | yes |
| Edit plans, prices, limits | no | no | yes |
| Edit system prompts (engine) | no | no | yes |
| Toggle AI kill switch, signups, maintenance | no | yes | yes |
| View global cost dashboard | no | yes | yes |
| View audit log | no | yes (read-only) | yes |
| Hard-delete a user | no | no | yes |
| Abuse review (view user content) | no | yes (reason + logged) | yes (reason + logged) |

An admin can never act on the owner or on another admin except to read them.

# DATA MODEL (new migrations)

```sql
create type app_role as enum ('owner','admin','user');
create type account_status as enum ('active','suspended','pending_deletion');

create table plans (
  id text primary key,                       -- 'free' | 'plus'
  name text not null,
  price_usd_month numeric(8,2) not null default 0,
  price_usd_year  numeric(8,2) not null default 0,
  limits jsonb not null,                     -- see seed below
  show_ads boolean not null,
  is_active boolean not null default true
);

insert into plans (id, name, price_usd_month, price_usd_year, limits, show_ads) values
 ('free','Free',0,0,
  '{"max_brands":2,"max_entries":50,"max_storage_mb":200,"generate_per_day":5,"autofill_per_day":5,"batch_max":1}', true),
 ('plus','Plus',5,48,
  '{"max_brands":10,"max_entries":2000,"max_storage_mb":5000,"generate_per_day":50,"autofill_per_day":100,"batch_max":10}', false);

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  status account_status not null default 'active',
  plan_id text not null default 'free' references plans(id),
  plan_source text not null default 'default' check (plan_source in ('default','subscription','comp')),
  comp_until timestamptz,
  tos_version text, tos_accepted_at timestamptz,
  age_confirmed_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index one_owner on profiles (role) where role = 'owner';

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text not null,
  provider_subscription_id text not null unique,
  plan_id text not null references plans(id),
  status text not null,                      -- active|past_due|canceled|...
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_event_at timestamptz not null,        -- for out-of-order protection
  updated_at timestamptz not null default now()
);

create table webhook_events (                -- idempotency
  provider text not null,
  event_id text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  payload jsonb not null,
  primary key (provider, event_id)
);

create table quota_overrides (
  user_id uuid primary key references auth.users(id) on delete cascade,
  limits jsonb not null,                     -- partial override of plan limits
  reason text not null,
  set_by uuid not null references auth.users(id),
  expires_at timestamptz
);

create table app_settings (
  key text primary key,                      -- ai_kill_switch, signups_enabled, ads_enabled_global,
  value jsonb not null,                      -- global_daily_cost_cap_usd, maintenance_mode
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table audit_log (                     -- append-only
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  target_user_id uuid,
  target_type text, target_id text,
  before jsonb, after jsonb,
  reason text,
  ip inet, user_agent text,
  created_at timestamptz not null default now()
);
revoke update, delete on audit_log from public, anon, authenticated;

create table consent_records (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('tos','privacy','ads_personalized','ads_basic')),
  version text not null, granted boolean not null,
  created_at timestamptz not null default now()
);

-- system_prompts becomes global: drop user_id ownership, add updated_by, admin/owner only.
-- ai_usage: add plan_id text, keep per-user rows.
```

**Authorization helpers and limit enforcement (in SQL, so API bypass is impossible):**

```sql
create function public.has_role(variadic roles app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles
                 where user_id = auth.uid() and status = 'active' and role = any(roles));
$$;

-- effective limit: null = unlimited (owner/admin), else override > plan
create function public.effective_limit(uid uuid, key text) returns numeric
language plpgsql stable security definer set search_path = public as $$
declare r app_role; v numeric;
begin
  select role into r from profiles where user_id = uid;
  if r in ('owner','admin') then return null; end if;
  select (o.limits ->> key)::numeric into v from quota_overrides o
    where o.user_id = uid and (o.expires_at is null or o.expires_at > now());
  if v is not null then return v; end if;
  select (pl.limits ->> key)::numeric into v from profiles p join plans pl on pl.id = p.plan_id
    where p.user_id = uid;
  return v;
end $$;

-- example hard limit (repeat for entries and storage bytes)
create function enforce_brand_limit() returns trigger language plpgsql as $$
declare lim numeric;
begin
  lim := effective_limit(new.user_id, 'max_brands');
  if lim is not null and (select count(*) from brands where user_id = new.user_id) >= lim then
    raise exception 'LIMIT_MAX_BRANDS' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger brands_limit before insert on brands for each row execute function enforce_brand_limit();
```

**Profile protection:** users get `select` on their own profile row and **no update policy**. Role, plan and status change only through server code using the service-role key. A trigger blocks any change to or from `role = 'owner'` unless `current_setting('app.allow_owner_change', true) = 'on'`, which only the bootstrap script sets. Admin read policies cover `profiles`, `ai_usage`, `subscriptions`, `audit_log` (via `has_role('admin','owner')`). Admins get **no** RLS access to `brands`, `entries` or storage content.

# AUTHENTICATION SPEC

- Magic link and Google OAuth. Create the `profiles` row on first sign-in (database trigger on `auth.users`, role `user`, plan `free`).
- Require a verified email before any API or AI call succeeds (`requireUser()` checks it).
- Block sign-in for `suspended` and `pending_deletion` accounts with a clear message; `requireUser()` checks status on every request, not only at login.
- Bot protection: Cloudflare Turnstile on sign-in; per-IP and per-email rate limits on sending magic links; disposable-email blocklist loaded from config; `signups_enabled` flag in `app_settings` can close sign-up instantly.
- Sessions: httpOnly, secure, sameSite=lax cookies; rolling 7 days for users; 8 hours for owner/admin with AAL2 required.
- MFA enrollment is forced on first admin login; admin routes return 403 if the session is not AAL2.
- Sign out everywhere, and revoke all sessions on suspension and on role change.
- Age and terms: sign-up requires accepting ToS/Privacy and confirming the user meets the minimum age (set it to 16 [A]); record version and timestamp.
- Account deletion: self-serve in Settings. Sets `pending_deletion`, cancels the subscription, hides the account immediately, and a scheduled job hard-deletes rows and storage after 14 days. User can cancel within the window.
- Data export: async job producing a JSON of brands and entries plus the images in a ZIP; signed download link valid 24 hours; rate-limited to once per day.

# AUTHORIZATION SPEC

- One module, `src/services/authz.ts`, is the **only** place that decides permissions: `can(actor, action, target?)`. Routes and server actions call it; nothing checks roles inline.
- One module, `src/services/entitlements.ts`: `getEntitlements(userId)` returns `{ role, planId, limits (null = unlimited), features, showAds }`. It reads `profiles`, `plans`, `quota_overrides`. Cache per request only, never across requests.
- Layers of enforcement: (1) middleware for coarse route access, (2) `can()` in every route and server action, (3) RLS for data isolation, (4) database triggers for hard limits. A bug in one layer must not open access.
- Daily AI quotas are checked in `quotaService` against `ai_usage` using `effective_limit`. Plan lookups never trust the client.
- Staff bypass limits but **not** logging: staff AI calls are still recorded in `ai_usage`.
- Role changes, suspensions, comps, overrides and settings changes all write an `audit_log` row with actor, before/after, reason, IP and user agent in the same transaction as the change.

# ADMIN PANEL SPEC

Route group `/admin`, separate layout, `noindex`, excluded from ads, analytics and ad scripts. Every page and every server action re-checks `can()` and AAL2; hiding a button is never the control.

| Page | Contents |
|---|---|
| Overview | Signups, active users, AI calls and estimated cost today / 7 days, Plus subscribers, MRR estimate, ad-eligible sessions, error rate, kill-switch state |
| Users | Search by email/id, filter by plan/status/role, user detail (metadata, plan, usage, subscription status, override history). Actions per the matrix: suspend, comp plan, quota override, force sign-out |
| Abuse review | Opens a user's content after a required reason; every view is audit-logged; shows reports and takedown requests |
| Plans | Owner only: edit limits, prices, `show_ads`; changes versioned in the audit log |
| Engine | Owner only: view/edit system prompts with versions, "set active", rollback, test run against a sample reference (counts toward global spend) |
| Cost and limits | Global daily cost vs cap, per-plan usage, top spenders, kill switch, signups toggle, maintenance mode |
| Audit log | Filter by actor/action/target/date, export CSV |
| Staff | Owner only: promote/demote admins, force MFA reset |

Destructive actions need a confirmation step. Bulk actions are not included. The panel never displays secrets, full API keys or system prompt text outside the Engine page.

# PLANS, QUOTAS AND BILLING

- **Paid features gated server-side:** batch autofill beyond `batch_max`, higher daily limits, more brands/entries/storage, ad-free. The client only displays state; it never decides it.
- Free-tier gating is soft: show the current usage and an upgrade prompt when a limit is hit. A hit limit returns `LIMIT_*` or `QUOTA_EXCEEDED` with the plan name and the reset time.
- **Global protections:** `ai_kill_switch` stops all AI calls except owner test runs; `global_daily_cost_cap_usd` auto-trips the switch and alerts the owner; per-plan limits bound each user's cost. Price table for estimating cost comes from config.
- **Checkout:** server creates a checkout session; the user returns to a success page that only *reads* subscription state (never grants access itself).
- **Webhooks (`/api/webhooks/billing`):** verify the signature on the **raw** body; insert into `webhook_events` first (primary key = idempotency; duplicate returns 200 and exits); process in one transaction; ignore events older than `subscriptions.last_event_at`; then run `syncPlan(userId)`, the single function that sets `profiles.plan_id` and `plan_source`. Failed processing is retried safely.
- **Customer portal** link for cancel/upgrade/invoices. Handle `past_due` with a grace period of 7 days [A], then downgrade to `free`. Downgrade never deletes data; over-limit users can view and delete but not create until under the free limits.
- **Comp plans:** `plan_source = 'comp'` with optional `comp_until`; a scheduled job downgrades expired comps.
- Refunds and disputes are handled in the billing provider; webhooks keep Anyref's state in sync.

# ADS AND CONSENT

- `<AdSlot name="library-sidebar" />` renders only when `entitlements.showAds` is true **and** `ads_enabled_global` is on **and** the user's consent state allows it. Staff and Plus never see ads.
- Allowed placements: library sidebar, bottom of library grid, and a slot shown while "Generating…" is running. **Never** on `/login`, `/admin`, `/billing`, `/legal`, the prompt copy area, or the form fields, to prevent accidental clicks and policy problems.
- Reserve fixed slot heights to avoid layout shift (CLS under 0.1). Lazy-load slots below the fold.
- **Consent:** integrate a Google-certified CMP for EEA/UK users [A] and a basic consent banner elsewhere. Load ad scripts only after consent where required; fall back to non-personalized ads if refused. Record choices in `consent_records`. Provide "Manage ad preferences" in the footer.
- **CSP:** the strict nonce-based CSP from the old Phase 5 stays. Add ad-provider domains only from an env allowlist (`AD_CSP_ALLOWLIST`), and only on routes that render an `<AdSlot>`. The admin and auth routes keep the strictest CSP.
- Ad provider research task: confirm approval requirements, whether logged-in app pages are eligible, and UGC rules. If the app pages are not eligible, ship public, crawlable content pages (landing page, "poster prompt guides", example gallery built from owner-created content only) to qualify, and record the result in `docs/adr/0005-ads.md`.
- Because ad revenue depends on traffic, add privacy-friendly analytics (cookie-less, consent-aware [A]) so you can measure ad impressions per user and decide whether the paywall should carry more weight.

# LEGAL, ABUSE AND PRIVACY (now required)

- Pages: Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use Policy, DMCA/copyright takedown page. Draft them from the product's actual behavior, mark them "template, review by a lawyer before launch" in `docs/legal/`, and show version numbers.
- **User uploads are often copyrighted Pinterest images.** Terms must say users upload only what they have the right to use; uploaded references are private to the account, never public and never used to train models; Gemini/Claude processing is disclosed in the Privacy Policy. Provide a takedown contact and a documented process.
- Report mechanism for the admin (abuse queue) even though content is private, because users may upload unlawful material. Suspended accounts keep data for 30 days for review, then follow the deletion policy [A].
- Data processing disclosure: list sub-processors (Supabase, Vercel, AI provider, billing provider, ad provider, error tracking).
- Account deletion and export satisfy "delete/export my data" requests; log completion.

# REVISED PHASES

For each phase: do the tasks, run the tests, verify the Definition of Done, commit with Conventional Commits, update `CHANGELOG.md`.

## Phase 3R — Re-baseline and migration
**Tasks:** Step 0 above; migrations `0002_roles_plans.sql` (types, `plans`, `profiles`, helper functions, triggers), backfill: create a `profiles` row for the existing user as `owner` using the bootstrap script, set their plan to `free` (their role makes limits unlimited); make `system_prompts` global; update RLS.
**Security checks:** no policy references `user_metadata`; owner uniqueness enforced by index + trigger.
**Tests:** SQL tests: a user cannot update their own role/plan/status; second owner insert fails; limit triggers block user N+1 but not admin.
**DoD:** all existing Phase 0–3 tests still pass; new SQL tests pass; ADRs and `PLAN.md` updated.

## Phase 4 — Authentication and Authorization
**Tasks:** magic link + Google OAuth, profile-creation trigger, email-verified gate, suspended/pending-deletion gates, Turnstile, signup/login rate limits, disposable-email blocklist, ToS/age acceptance, `authz.ts` (`can()`), real `entitlements.ts`, MFA enrollment and AAL2 enforcement, session lifetimes, sign-out-everywhere, account deletion and export jobs.
**Files:** `src/services/{authz,entitlements,accountService,exportService}.ts`, `src/app/(auth)/*`, `src/app/(app)/settings/*`, `scripts/bootstrap-owner.ts`, `src/middleware.ts`.
**Tests:** unit for `can()` over every cell of the permission matrix; integration: suspended user gets 403 on every route; role escalation attempts (client-side metadata edit, direct profile update, forged JWT claims) all fail; E2E: sign up, verify, use app, delete account, confirm data removed after the job runs.
**DoD:** the matrix is fully tested; staff routes reject non-AAL2 sessions; deletion and export verified end to end.

## Phase 5 — Admin Panel
**Tasks:** all pages in the Admin Panel spec; audit logging in the same transaction; abuse review with reason; kill switch and signup toggle; owner-only pages.
**Files:** `src/app/admin/*`, `src/services/adminService.ts`, `src/data/auditRepo.ts`.
**Tests:** every admin action produces exactly one audit row; admin cannot suspend admin/owner; admin cannot read `brands`/`entries` through RLS (SQL test); owner-only pages return 403 for admin; Playwright flow for suspend + comp + override.
**DoD:** every cell of the matrix passes in tests; the audit log is append-only (update/delete attempts fail).

## Phase 6 — Plans, Quotas and Billing
**Tasks:** `plans` editor, `effective_limit` used by `quotaService`, limit triggers for brands/entries/storage, global cost cap and kill switch, `BillingProvider` interface + chosen adapter (ADR with research), checkout, portal, webhook route with signature verification and idempotency, `syncPlan`, grace period and downgrade rules, comp expiry job, paywall UI with usage meters, upgrade prompts.
**Files:** `src/services/{billingService,quotaService,planService}.ts`, `src/app/api/webhooks/billing/route.ts`, `src/app/(app)/billing/*`.
**Security checks:** raw-body signature check; webhook route excluded from CSRF origin checks but protected by signature; replayed and out-of-order events are safe; client cannot set plan.
**Tests:** replay the same webhook 5 times → one state change; out-of-order event ignored; bad signature → 400 and nothing stored as processed; user at limit gets the right error; cost cap trips the kill switch; staff are never blocked.
**DoD:** full upgrade, cancel and downgrade cycle works in the provider's test mode; limits update immediately after upgrade.

## Phase 7 — Ads and Consent
**Tasks:** `AdProvider` + `<AdSlot>`, consent manager and records, CSP allowlist per route, placements and exclusions, analytics, ad research ADR, public content pages needed for approval.
**Tests:** ad slots absent for Plus, staff, and excluded routes; no ad script loads before consent where required; CSP on `/admin` and `/login` contains no ad domains; CLS check in Lighthouse.
**DoD:** ads render for a free user with consent and disappear instantly after upgrading.

## Phase 8 — Hardening (the old Phase 5, extended for public use)
**Tasks:** everything from the old Phase 5 (CORS, rate limits, security headers, CSRF origin checks, secrets scan, dependency audit, error boundaries, leakage review), plus: per-user and per-IP limits sized for public traffic, upload abuse limits, storage quota enforcement, prompt-extraction tests against the Engine, SSRF review (none of the app's routes fetch user-supplied URLs; make that a tested rule), admin panel penetration checklist, dependency and license review.
**Tests:** prompt-injection suite (instructions hidden in reference images, product photos, hint text) never changes slot rules or exposes system prompts; ZAP baseline on staging with an authenticated user and an authenticated admin; fuzz suite extended to admin routes.
**DoD:** no high findings; no system prompt text in any response, log or error across the test suite.

## Phase 9 — Deployment, Compliance and Launch Readiness
**Tasks:** environments, backups with a restore drill, logging (with user-id hashing), monitoring and alerts (cost spike, signup spike, webhook failures, error rate), scheduled jobs (deletion, exports, comp expiry, photo TTL) with failure alerts, legal pages live and versioned, status/maintenance mode, load test sized to expected launch traffic [A: 500 concurrent users], launch checklist, rollback plan, owner runbook (how to suspend, comp, refund, kill AI, restore).
**Tests:** restore drill; load test results recorded; alert tests fire; consent and deletion flows verified in production-like staging.
**DoD:** all checklist items below mapped and verified; a clean-room user can sign up, use the free tier with ads, upgrade, cancel and delete their account; the owner can run every runbook step.

# TRACEABILITY UPDATES

Keep rows 1–21. Rows 11, 12, 13 and 21 are no longer deferred: map them to Phase 6, Phase 6, Phase 4/6, and Phase 9. Add:

| # | Item | Phase | Module | Verification |
|---|---|---|---|---|
| 22 | Role model, owner bootstrap, no self-escalation | 3R, 4 | `profiles`, triggers, `bootstrap-owner.ts` | SQL escalation tests |
| 23 | Staff MFA and short sessions | 4 | `authz.ts`, middleware | AAL2 enforcement tests |
| 24 | Central authorization (`can()`) | 4 | `authz.ts` | Matrix test for every cell |
| 25 | DB-enforced limits | 3R, 6 | limit triggers, `effective_limit` | Trigger tests, bypass attempts |
| 26 | Append-only audit log | 5 | `audit_log`, `adminService` | Update/delete fails; one row per action |
| 27 | Admin privacy boundary | 3R, 5 | RLS policies | Admin cannot read content via RLS |
| 28 | Bot and signup abuse protection | 4, 8 | Turnstile, rate limits | Rate-limit and blocklist tests |
| 29 | Ads consent and CSP isolation | 7 | `AdSlot`, CMP, CSP | No pre-consent scripts; clean CSP on `/admin` |
| 30 | Prompt-engine protection | 6, 8 | `generateService`, Engine page | Extraction and leak tests |
| 31 | Account deletion and export | 4, 9 | `accountService`, jobs | E2E removal verified |
| 32 | Copyright takedown process | 9 | `docs/legal`, abuse queue | Process dry-run documented |

# CONSTRAINTS

- No placeholders like "TBD". Where a number is not specified, use the default given here and mark it **[A]** in `PLAN.md`.
- Do not write secrets, API keys or provider credentials into any file. Use `.env.example` with variable names only.
- Research tasks (billing provider availability, ad provider policies, current model pricing, minimum age and consent rules) must use current sources; record what you found and the date in the ADR. Do not rely on memory for these.
- Do not claim legal compliance. Legal documents are drafts for a lawyer's review.
- Work phase by phase. Do not start a phase until the previous Definition of Done is verified. After each phase, post a short status: what was built, tests run, anything deferred and why.

# FIRST REPLY

Reply with: (1) the Step 0 audit findings, (2) the list of ADRs you will write, (3) the migration list for Phase 3R. Then begin Phase 3R.
