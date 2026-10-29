# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

- **Phase 1 Data & Auth**:
  - Core Supabase PostgreSQL migration (`supabase/migrations/0001_init.sql`) with `brands`, `entries`, `system_prompts`, and `ai_usage` tables.
  - Row Level Security (RLS) policies enforcing strict `user_id = auth.uid()` multi-tenancy and cross-entity checks.
  - Private storage buckets (`references`, `results`, `logos`) with `{user_id}/*` path-prefix security.
  - Initial seed data (`supabase/seed.sql`) with default *Rewired* and *Riwayat* brands and v1 system prompts.
  - Supabase SSR cookie authentication integration (`src/lib/supabaseServer.ts`, `src/lib/supabaseBrowser.ts`).
  - Typed `AppError` hierarchy (`src/lib/errors.ts`) with HTTP status mappings.
  - Session service with `requireUser()` and non-throwing `getUser()` (`src/services/session.ts`).
  - Route protection middleware (`src/middleware.ts`) with session cookie refresh and login redirects.
  - Magic-link authentication route handlers (`/api/auth/callback`, `/api/auth/logout`).
  - Accessible magic link login interface (`src/app/(auth)/login/page.tsx`) adhering to WCAG 2.1 AA.
  - Live Next.js 15 App Router landing page (`src/app/page.tsx`) with Tailwind CSS brand token integration.
  - Session test suite (`tests/unit/session.test.ts`), expanding test coverage to 18 passing tests.
