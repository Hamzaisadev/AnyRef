# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
