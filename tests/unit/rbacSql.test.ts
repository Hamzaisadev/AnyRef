import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 3R Migration & RBAC Schema Integrity Tests', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/0002_roles_plans.sql'
  );

  it('migration 0002_roles_plans.sql exists and is non-empty', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content.length).toBeGreaterThan(500);
  });

  it('defines the three locked app roles (owner, admin, user)', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain("create type app_role as enum ('owner', 'admin', 'user')");
  });

  it('enforces single owner via partial unique index', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toMatch(/create\s+unique\s+index\s+.*on\s+profiles\s*\(\s*role\s*\)\s*where\s+role\s*=\s*'owner'/i);
  });

  it('seeds free and plus plans with explicit limit definitions', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain("('free', 'Free'");
    expect(content).toContain("('plus', 'Plus'");
    expect(content).toContain('"max_brands":2');
    expect(content).toContain('"generate_per_day":5');
    expect(content).toContain('show_ads boolean not null');
    expect(content).toContain('1}\'::jsonb, true)');
  });

  it('revokes update and delete on audit_log to guarantee append-only immutability', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toMatch(/revoke\s+update,\s*delete\s+on\s+audit_log\s+from/i);
  });

  it('implements effective_limit returning null (unlimited) for owner and admin', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('create or replace function public.effective_limit');
    expect(content).toMatch(/if\s+r\s+in\s*\(\s*'owner',\s*'admin'\s*\)\s*then\s+return\s+null;/i);
  });

  it('protects profiles against user-side role escalation by having no update policy for standard users', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('alter table profiles enable row level security;');
    expect(content).toContain('create policy "profiles_select_own"');
    // Ensure there is NO user update policy on profiles
    expect(content).not.toMatch(/create\s+policy\s+"profiles_update_own"/i);
  });

  it('preserves user privacy boundary by not giving admins RLS read access to user brands or entries', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    // Migration 0002 should NOT add admin select policies on brands or entries
    expect(content).not.toMatch(/create\s+policy\s+.*on\s+brands\s+for\s+select\s+using\s*\(.*has_role/i);
    expect(content).not.toMatch(/create\s+policy\s+.*on\s+entries\s+for\s+select\s+using\s*\(.*has_role/i);
  });
});
