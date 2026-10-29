import { describe, it, expect } from 'vitest';
import { adminClient } from './helpers/dbHarness';
import type { Database } from '@/types/database.types';

describe('Schema Contract Test — Database vs Code Schema Alignment', () => {
  const admin = adminClient();

  it('connects to Supabase database with service role client', async () => {
    const { data, error } = await admin.from('app_settings').select('key, value');
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  describe('Table Column Schema Verifications', () => {
    it('verifies ai_usage schema contract (S1-1, S1-3: kind & est_cost_usd exist, cost_usd does not)', async () => {
      // 1. Select the real columns
      const { data, error } = await admin
        .from('ai_usage')
        .select('id, user_id, kind, input_tokens, output_tokens, est_cost_usd, created_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 2. Assert querying non-existent columns fails at the database level
      const { error: costUsdError } = await admin.from('ai_usage').select('cost_usd').limit(1);
      expect(costUsdError).not.toBeNull();

      const { error: modelError } = await admin.from('ai_usage').select('model').limit(1);
      expect(modelError).not.toBeNull();
    });

    it('verifies brands table schema contract', async () => {
      const { data, error } = await admin
        .from('brands')
        .select('id, user_id, name, what_you_sell, why, tone, colors, wordmark, logo_path, footer_text, slogan, never_do_rules, default_values, created_at, updated_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const { error: descError } = await admin.from('brands').select('description').limit(1);
      expect(descError).not.toBeNull();
    });

    it('verifies entries table schema contract', async () => {
      const { data, error } = await admin
        .from('entries')
        .select('id, user_id, brand_id, reference_path, result_path, prompt_template, slots, status, poster_type, intended_product_shape, note, parent_entry_id, system_prompt_version, created_at, updated_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const { error: titleError } = await admin.from('entries').select('title, category').limit(1);
      expect(titleError).not.toBeNull();
    });

    it('verifies profiles table schema contract (including consent fields S1-12)', async () => {
      const { data, error } = await admin
        .from('profiles')
        .select('user_id, role, status, plan_id, plan_source, comp_until, tos_version, tos_accepted_at, age_confirmed_at, deletion_requested_at, created_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('verifies system_prompts table schema contract', async () => {
      const { data, error } = await admin
        .from('system_prompts')
        .select('id, user_id, version, purpose, body, updated_by, created_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('verifies audit_log table schema contract', async () => {
      const { data, error } = await admin
        .from('audit_log')
        .select('id, actor_id, action, target_user_id, target_type, target_id, before, after, reason, ip, user_agent, created_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});
