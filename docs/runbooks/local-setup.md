# Runbook: Local Development Setup

This guide walks through configuring a complete local development environment for Anyref, including Supabase local CLI, database migrations, environment variables, and the Next.js development server.

---

## Prerequisites
- **Node.js**: Current LTS (pinned in `.nvmrc` and `package.json` `engines`)
- **pnpm**: `corepack enable && pnpm --version`
- **Docker Desktop**: Required to run Supabase locally
- **Supabase CLI**: `npm install -g supabase` or `brew install supabase/tap/supabase`

---

## 1. Clone & Install Dependencies

```bash
git clone git@github.com:anyref-app/anyref.git
cd anyref
pnpm install
```

---

## 2. Environment Configuration

1. Copy the template:
   ```bash
   cp .env.example .env.local
   ```
2. Verify required environment variables:
   ```bash
   pnpm tsx scripts/check-env.ts
   ```

### Critical Variables:
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Local Supabase URL (e.g. `http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local Anon public key from `supabase status` |
| `SUPABASE_SERVICE_ROLE_KEY` | Local Service Role key (server-only) |
| `AI_PROVIDER` | `gemini` (default) or `claude` |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `AI_DAILY_CALL_LIMIT` | `50` |
| `AI_DAILY_COST_CAP_USD` | `2.00` |

---

## 3. Initialize Local Supabase

1. Start Supabase containers:
   ```bash
   supabase start
   ```
2. Apply database migrations and seeds:
   ```bash
   supabase db reset
   ```
   This will:
   - Run `supabase/migrations/0001_init.sql`
   - Apply Row Level Security policies
   - Create storage buckets: `references`, `results`, `logos`
   - Run `supabase/seed.sql` to populate default brands (*Rewired* and *Riwayat*)

3. Check container credentials:
   ```bash
   supabase status
   ```

---

## 4. Run Development Server

```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Running Tests & Quality Checks

```bash
# Typecheck
pnpm typecheck

# Unit & Integration Tests
pnpm test

# Linting & Code Style
pnpm lint
pnpm format:check

# E2E Tests (Playwright)
pnpm test:e2e
```
