# Contributing to Anyref

Thank you for your interest in contributing to Anyref. Because this project is currently private and proprietary, external contributions are by invitation only.

---

## Engineering Standards

- **TypeScript Strict**: `strict: true` and `noUncheckedIndexedAccess: true` must pass on all code.
- **Layering**:
  - `src/app/api/` (Routes / Validation)
  - `src/services/` (Business Logic & Quota Guards)
  - `src/data/` (Supabase Access Only)
- **TDD Workflow**: We adhere to test-driven development. Unit tests are written against public interfaces/seams before implementation code.
- **Commit Style**: We follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

---

## Development Workflow

1. Create a feature branch: `git checkout -b feat/your-feature-name`
2. Run local tests: `pnpm test`
3. Check types: `pnpm typecheck`
4. Verify environment: `pnpm check-env`
5. Open a Pull Request referencing the design ticket or issue.
