# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Dark Mode Surface & Contrast Overhaul**:
  - Eliminated all hardcoded `bg-white` card surfaces across all pages and components that caused white-on-white unreadable text and blinding white boxes on dark mode canvas.
  - Implemented unified semantic surface tokens (`--surface`, `--surface-hover`, `--surface-muted`, `--border-subtle`, `--border-strong`, `--primary-fg`, `--accent-fg`) in `tailwind.config.ts` and `src/app/globals.css`.
  - Upgraded dark mode palette: rich slate studio canvas (`#090A10`), elevated surface cards (`#12131F`), subtle muted surfaces (`#1A1C2E`), and crisp translucent borders (`rgba(255,255,255,0.08)`).
  - Replaced high-contrast stark active nav pill with brand-harmonized tint `bg-primary/15 text-primary border border-primary/25`.
  - Refactored `Navigation`, `BrandSwitcher`, `library/page.tsx`, `workspace/generate/page.tsx`, `workspace/autofill/page.tsx`, `entries/[id]/page.tsx`, `entries/[id]/compare/page.tsx`, `brands/page.tsx`, `login/page.tsx`, and `page.tsx` to use the semantic surface token architecture with guaranteed $\ge 4.5:1$ WCAG contrast.

### Added
- **Phase 5 — Main Admin Panel & Operational Controls**:
  - Dedicated `/admin` route group with isolated `AdminLayout`, `noindex`/`nofollow` robots directives, and staff session enforcement (`requireAdmin()`).
  - System Overview (`/admin`): real-time multi-tenant telemetry (total accounts, active users, Plus subscribers, daily & 7d model inference calls and estimated spend) and global emergency switches:
    - AI Kill Switch (instantly halts model inference requests platform-wide).
    - Open Sign-ups toggle (instantly pauses public account registrations).
    - Maintenance Mode flag.
    - Global Ad Slots toggle.
  - User Directory & Quota Management (`/admin/users`): search accounts, filter by role/status/plan, execute audit-logged suspensions, unsuspensions, complimentary Plus grants, and quota overrides.
  - Abuse Review Queue (`/admin/abuse`): enforces strict zero-direct-RLS content access; requires mandatory investigation justification before decrypting and exposing user brands and prompt entries, permanently appending `abuse_review_conducted` to the audit log.
  - Cost & Limit Protection (`/admin/cost`): daily circuit breaker monitoring model spend against `global_daily_cost_cap_usd`, with automatic kill-switch triggering at 100% threshold.
  - Immutable Audit Log Viewer (`/admin/audit`): viewer for append-only `audit_log` records with actor, action, target, timestamp, reason, and IP details.
  - Owner-Only Controls:
    - Plans & Tier Pricing (`/admin/plans`): configure month/year pricing, daily generation limits, brand/entry quotas, and ad flags, with audit versioning.
    - Prompt Engine Manager (`/admin/engine`): inspect and deploy versioned system prompts for deconstruction and autofill engines.
    - Staff Privileges (`/admin/staff`): promote users to administrator or demote staff, preserving single-owner uniqueness.
  - Admin service test suite `tests/unit/adminService.test.ts` (11 tests) verifying non-staff rejection, role boundary enforcement (admins cannot suspend admins or owners), owner capabilities, and abuse logging.
  - Expanded project test suite to 149 passing tests across 19 test files.

- **Phase 4 — Authentication, Authorization & Entitlements Engine**:
  - Central authorization authority (`src/services/authz.ts`) implementing the locked permission matrix for `user`, `admin`, and `owner` roles, preventing privilege escalation and enforcing that admins cannot act on owners or peer admins.
  - Dynamic entitlements calculator (`src/services/entitlements.ts`):
    - Resolves `null` (unlimited) quotas and `showAds = false` for staff accounts (`owner`, `admin`).
    - Resolves Free plan quotas (`5` generations/day, `5` autofills/day, `2` brands, `50` entries, `showAds = true`).
    - Resolves Plus plan quotas (`50` generations/day, `100` autofills/day, `10` brands, `2000` entries, `showAds = false`).
    - Applies unexpired `quota_overrides` over base plan limits.
  - Account lifecycle management (`src/services/accountService.ts`):
    - 14-day grace period for self-serve account deletion (`pending_deletion`).
    - Self-serve deletion cancellation and account restoration.
    - Owner deletion protection preventing accidental orphaned workspace states.
  - GDPR/privacy user data export (`src/services/exportService.ts`) packaging brands, entries, and metadata into a secure JSON bundle with 24-hour rate limiting.
  - Public signup protection:
    - Disposable email domain detection (`src/lib/disposableEmail.ts`) rejecting throwaway addresses.
    - Mandatory terms of service acceptance and age confirmation (16+).
    - Google OAuth sign-in integration and passwordless magic link authentication.
  - Enhanced session security (`src/services/session.ts` and `src/middleware.ts`):
    - Gatekeeping against `suspended` and `pending_deletion` accounts across all server calls.
    - MFA assurance verification (AAL2) for administrative routes.
    - Route guards protecting `/admin` and authenticated app pathways (`/workspace`, `/brands`, `/library`, `/entries`, `/settings`).
  - Unit test suites:
    - `tests/unit/authz.test.ts` (30 tests) testing every cell of the permission matrix and role boundaries.
    - `tests/unit/entitlements.test.ts` (5 tests) testing staff unlimited limits, plan tiers, and override merging.
    - `tests/unit/accountService.test.ts` (7 tests) testing deletion lifecycle, remaining days calculation, and disposable email rejection.
  - Expanded project test suite to 138 passing tests across 18 test files.

  - Migration `supabase/migrations/0002_roles_plans.sql`:
    - Enums: `app_role` (`'owner'`, `'admin'`, `'user'`), `account_status` (`'active'`, `'suspended'`, `'pending_deletion'`).
    - Tables: `plans` (seeded with `free` and `plus`), `profiles` (with partial unique index `one_owner`), `subscriptions`, `webhook_events`, `quota_overrides`, `app_settings`, `audit_log`, `consent_records`.
    - Immutability: revoked update and delete on `audit_log` from all non-superuser roles.
    - Security Definer functions: `public.has_role()` and `public.effective_limit()`, ensuring staff accounts resolve to `null` (unlimited).
    - Database trigger `enforce_brand_limit()` on `brands` to prevent API limit circumvention.
    - Automatic `handle_new_user()` trigger creating `profiles` rows on `auth.users` sign-up.
    - Protection trigger `protect_owner_role()` restricting owner role modification to offline bootstrap.
  - Script `scripts/bootstrap-owner.ts` for safe single-owner provisioning using `OWNER_EMAIL`.
  - Environment schema: added `OWNER_EMAIL`, `ADMIN_MFA_REQUIRED`, and `NEXT_PUBLIC_ENABLE_ADS` in `src/lib/env.ts`.
  - Unit test suite `tests/unit/rbacSql.test.ts` (8 tests) verifying schema constraints, append-only audit log, and owner exclusivity.
  - Expanded test suite to 96 passing tests across 15 suites.

- **Phase 3 Input Handling and Data Integrity**:
  - Text and slot sanitization engine (`src/lib/sanitize.ts`): strips ASCII control characters (0x00-0x1F except \t, \n, \r), zero-width characters (ZWSP, ZWNJ, ZWJ, BOM), bidirectional overrides, and normalizes Unicode (NFKC).
  - Slot constraint enforcement (`sanitizeSlotValues`): enforces length limits server-side to prevent memory bloat and model context truncation.
  - Template consistency validator (`src/domain/validateTemplate.ts`): enforces that every `{{key}}` placeholder has a corresponding slot, all defined slots are referenced, slot keys are unique, and optional blocks (`[[?key: ... ]]`) are well-formed and balanced.
  - Prompt security and brand negative rule validator (`src/domain/validateInjection.ts`): rejects `<script>`, `javascript:`, `data:text/html`, external URLs, email addresses, and enforces brand `never_do_rules` compliance across models and inputs.
  - Image magic bytes verifier and AssetService (`src/services/assetService.ts`): verifies authentic PNG (`89 50 4E 47...`), JPEG (`FF D8 FF`), and WebP (`RIFF...WEBP`) file headers, strictly rejecting SVG XSS vectors, HTML polyglots, and oversized files.
  - Authenticated upload endpoint (`/api/upload`) generating user-scoped paths (`{user_id}/{filename}`) and short-lived signed URLs (60s).
  - Shared Zod API schemas (`src/domain/apiSchemas.ts`) for all route bodies, queries, and params.
  - Static security audit test suite (`tests/unit/securitySql.test.ts`) guaranteeing zero raw SQL concatenations and zero `dangerouslySetInnerHTML`.
  - Comprehensive fuzz testing suite (`tests/fuzz/inputFuzz.test.ts`) with 17 tests verifying 1MB payloads, SQL/XSS injections, unicode fuzzing, polyglots, and corrupt headers.
  - Expanded test suite from 37 to 88 passing tests across 14 test files.

- **Dynamic Brand Color & Theming Engine**:
  - Pure brand theme resolver (`src/lib/brandTheme.ts`) mapping brand color palettes to CSS variables (`--primary`, `--primary-rgb`, `--accent`, `--accent-rgb`, `--brand-layer`, etc.) with WCAG contrast foreground calculation and neutral-ink detection.
  - Server-side dynamic CSS `<style>` injection in `AppLayout` (`src/app/(app)/layout.tsx`) preventing flash-of-unstyled-content (FOUC).
  - Client-side `BrandContext` and `BrandProvider` (`src/context/BrandContext.tsx`) managing active brand state, cookie sync (`anyref_active_brand`), and real-time DOM CSS variable updates without page reload.
  - Reactive Anyref logo and wordmark badge in `Navigation` adopting active brand's primary border/stroke, accent dot (`fill="var(--accent)"`), and active wordmark pill.
  - Live brand theme switching in `BrandsPage` with one-tap "Use [Brand] Colors" button and active theme indicators.
  - Brand theme unit test suite (`tests/unit/brandTheme.test.ts`), expanding passing test coverage to 37 tests.

### Changed
- **UI/UX Craft & Tone Overhaul**:
  - Eliminated all emoji icons across all views; replaced with dedicated, sharp `lucide-react` SVG icons (`Trophy`, `Sliders`, `XCircle`, `FileText`, `Sparkles`, `UploadCloud`, `Package`, `ShieldCheck`, `CheckCircle2`, `Copy`, `Plus`, `Eye`, `ArrowRight`, `ChevronDown`, `LogOut`).
  - Humanized UI copy across all pages: removed inflated marketing AI jargon, promotional buzzwords, and repetitive headers, replacing them with direct, grounded human language.
  - Upgraded Navigation with active indicator pills, smooth interactive hover states, accessible touch targets (≥44px), and integrated brand switcher chevron.
  - Upgraded Reference Deconstruction Studio with responsive drag-and-drop zone, active drag-over indicator ring, animated progress indicator during Gemini parsing, one-click template copying with check feedback, and tri-color slot pills.
  - Upgraded Prompt Workbench with character-counter warning thresholds, live prompt output pane with tactile copy feedback, and numbered "Attach in Flow" cards.
  - Upgraded Visual Compare & Winner Vault with interactive verdict buttons, clipboard paste zone (`Ctrl+V`), and evaluation notes.
  - Upgraded Smart Autofill Studio with prominent Layout-Fit warning alert banner, provenance badges (`Brand Default`, `AI Inferred`, `Needs You`), and ephemeral photo handling cues.
  - Upgraded Brand Management with tactile color swatches, active palette deletion pills, and clean modal form states.

### Added
- **Phase 2 Core Features**:
  - Brand domain, repository, and service (`src/domain/brand.ts`, `src/data/brandRepo.ts`, `src/services/brandService.ts`) with hex-color validation, CRUD operations, and cross-tenant isolation.
  - Brand management API endpoints (`/api/brands`, `/api/brands/[id]`) and UI (`src/app/(app)/brands/page.tsx`).
  - Global `BrandSwitcher` component with active brand cookie persistence (`anyref_active_brand`).
  - Entries domain, repository, and service (`src/domain/entry.ts`, `src/data/entryRepo.ts`, `src/services/entryService.ts`) supporting status filtering, brand ownership validation, and remixing.
  - Entries API endpoints (`/api/entries`, `/api/entries/[id]`, `/api/entries/[id]/remix`).
  - Library UI (`src/app/(app)/library/page.tsx`) with status filters (`Winner`, `Needs Tweak`, `Failed`, `Draft`), poster type filters, and one-tap prompt copying.
  - Pluggable AI Vision interface (`src/ai/AiProvider.ts`) and Google Gemini implementation (`src/ai/geminiProvider.ts`) with structured output validation and retry-once logic.
  - Reference Deconstruction Studio (`/workspace/generate` and `/api/generate`) with live decomposition preview and tri-color syntax highlighting (Blue = Brand, Orange = Campaign, Gray = Layout).
  - Fill & Prompt Workbench (`/entries/[id]`) with dynamic form rendering by slot type, brand auto-filling, `Needs You` flags, live client-side prompt rendering, and ordered **Attach in Flow** checklist.
  - Visual Compare & Winner Vault (`/entries/[id]/compare`) with dual-panel inspector, clipboard image paste (`Ctrl+V`), status verdict switcher, and engineering notes.
  - Autofill Studio (`/workspace/autofill` and `/api/autofill`) with layout-fit warning detection and Hard Rule 3 programmatic post-filter clearing unauthorized guesses for `never_invent` slots.
  - Full unit test coverage across 8 suites, expanding passing tests to 32.

- **Phase 1 Data and Auth**:
  - Supabase database migration `supabase/migrations/0001_init.sql` with full schema (`brands`, `entries`, `system_prompts`, `ai_usage`), automatic `updated_at` triggers, and engine-level Row Level Security (RLS) policies.
  - Storage buckets `references`, `results`, and `logos` with strict `{user_id}/*` path-prefix RLS policies.
  - Default seed data in `supabase/seed.sql` for initial brands (*Rewired*, *Riwayat*) and version 1 system prompts.
  - Supabase SSR cookie-based server client (`src/lib/supabaseServer.ts`) and browser client (`src/lib/supabaseBrowser.ts`).
  - Session and user resolution service (`src/services/session.ts`) with type-safe `requireUser()` and non-throwing `getUser()`.
  - Route protection middleware (`src/middleware.ts`) enforcing authenticated access on `(app)` routes (`/workspace`, `/brands`, `/library`, `/entries`) and refreshing session tokens.
  - Accessible magic-link login page (`src/app/(auth)/login/page.tsx`) with real-time validation and accessible status announcements.
  - Authentication handlers for OAuth/magic-link exchange (`/api/auth/callback`) and session termination (`/api/auth/logout`).
  - Next.js 15 App Router root layout and home landing page (`src/app/page.tsx`) with live brand token styling.
  - Session test suite (`tests/unit/session.test.ts`), expanding total passing unit test coverage to 18 tests.

- **Phase 0 Foundation**:
  - Ubiquitous language glossary in `CONTEXT.md`.
  - Architecture specifications in `docs/architecture.md`.
  - API and contracts documentation in `docs/api.md`.
  - Product and UX guide in `docs/ux-and-product.md`.
  - Architectural Decision Records: `0001-no-image-generation`, `0002-supabase-rls-multi-tenancy`, `0003-ai-provider-abstraction`, `0004-ephemeral-product-photos`.
  - Operational runbooks: `local-setup.md`, `eval-ai-spike.md`, `provider-swap.md`, `maintenance.md`.
  - Environment schema and validation with Zod (`src/lib/env.ts` and `scripts/check-env.ts`).
  - Domain models: `Slot` schema (`src/domain/slot.ts`) and AI contracts (`src/ai/schemas.ts`).
  - Pure prompt rendering engine (`src/domain/renderPrompt.ts`).
  - Brand assets and logo vector graphics (`public/brand/`).
  - TDD test suites with Vitest (15 tests covering seams 1, 2, and 3).
