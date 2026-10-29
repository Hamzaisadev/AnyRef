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
