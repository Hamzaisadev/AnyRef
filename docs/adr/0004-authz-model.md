# ADR 0004: Role-Based Access Control and Staff Security Model

## Context
With Anyref transitioning to a public platform, privileged capabilities (quota overrides, engine prompt tuning, user suspension, abuse investigation, and financial metrics) must be isolated from standard customer capabilities while ensuring staff members cannot violate user privacy.

## Decision
1. **Three-Tier Role Hierarchy (`app_role`)**:
   - `owner`: Exactly one root principal. Possesses non-delegable authority: promote/demote admins, edit engine system prompts, modify plan pricing/limits, hard-delete accounts.
   - `admin`: Operational staff. Can access `/admin`, view platform metrics, manage user statuses (suspend/unsuspend), grant comp subscriptions, and perform audit-logged abuse reviews.
   - `user`: Standard customer accounts bound to their active plan limits.

2. **Single-Owner Protection & Immutability**:
   - The owner is established strictly via a secure offline script (`scripts/bootstrap-owner.ts`) using the verified `OWNER_EMAIL`.
   - A PostgreSQL partial unique index (`one_owner on profiles (role) where role = 'owner'`) and a database trigger strictly prevent multiple owners or runtime role escalations.

3. **TOTP MFA & Session Hardening**:
   - Staff accounts (`owner`, `admin`) are strictly required to use Time-based One-Time Password Multi-Factor Authentication (Supabase MFA AAL2) to access `/admin`.
   - Staff sessions are capped at an 8-hour rolling lifetime with forced re-authentication.

4. **Zero-Content-Inspection Privacy Boundary**:
   - Platform admins have access to account metadata, spend analytics, and quota logs, but have **zero direct RLS read access** to user brands, reference posters, workbench prompts, or uploaded images.
   - User content inspection is only accessible via a formalized Abuse Review workflow requiring a mandatory justification reason and generating an immutable audit record in `audit_log`.

5. **Defense-in-Depth Authorization**:
   - Authorization decisions are centralized in a single module: `src/services/authz.ts` implementing `can(actor, action, target)`.
   - Hard storage and brand counts are safeguarded by database-level triggers (`enforce_brand_limit()`) using `effective_limit()`, guaranteeing that no API bug or client tampering can exceed plan thresholds.

## Consequences
- Requires migration `0002_roles_plans.sql` introducing `profiles`, `audit_log`, `plans`, and security definer functions.
- Every administrative mutating action must append a row to `audit_log` in the same database transaction.
