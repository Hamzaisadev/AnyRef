# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
