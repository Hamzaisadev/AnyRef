import { describe, it, expect, afterAll, vi } from 'vitest';
import { adminClient, createTestUser, resetDb } from './helpers/dbHarness';
import { QuotaService } from '@/services/quotaService';
import { QuotaExceededError, ForbiddenError, ValidationError } from '@/lib/errors';
import { BrandDraftService } from '@/services/brandDraftService';
import { SupabaseBrandRepo } from '@/data/brandRepo';
import type { AiProvider } from '@/ai/AiProvider';
import type { BrandDraftOutput } from '@/ai/schemas';
import type { UserProfile } from '@/services/session';

describe('AI Brand Draft Integration Tests', () => {
  afterAll(async () => {
    await resetDb();
  });

  const mockDraftResult: BrandDraftOutput = {
    name: { value: 'Organic Tea Co.', source: 'you_said' },
    what_you_sell: { value: 'Single-origin green and herbal teas', source: 'you_said' },
    why: { value: 'Promoting wellness and sustainable farming', source: 'inferred' },
    tone: { value: 'Calm, mindful, and natural', source: 'inferred' },
    colors: { value: ['#2F5233', '#B1D8B7'], source: 'inferred', note: "approximate from 'green'" },
    wordmark: { value: 'ORGANIC TEA', source: 'you_said' },
    slogan: { value: 'Sip in peace', source: 'you_said' },
    footer_text: { value: 'Free shipping on orders over $40', source: 'you_said' },
    never_do_rules: { value: 'Never use synthetic flavors or plastic bags', source: 'you_said' },
    default_values: { value: { cta: 'Shop Tea' }, source: 'inferred' },
    missing: [],
  };

  const createMockAiProvider = (): AiProvider => ({
    name: 'mock-gemini',
    generateTemplate: vi.fn(),
    autofillSlots: vi.fn(),
    draftBrand: vi.fn().mockResolvedValue({
      ...mockDraftResult,
      usage: { inputTokens: 400, outputTokens: 200, costUsd: 0.00009 },
    }),
  });

  const toUserProfile = (u: any): UserProfile => ({
    id: u.user.id,
    email: u.email,
    role: u.role,
    plan_id: u.role === 'admin' ? 'plus' : 'free',
    status: 'active',
    rawUser: u.user,
  });

  describe('1. Quota & Plan Limits (brand_draft_per_day)', () => {
    it('free user is allowed within limit and blocked when quota is exceeded with limit and reset time', async () => {
      const freeUser = await createTestUser('user');
      const userId = freeUser.user.id;

      // 1. Initial quota check: allowed, limit = 5, used = 0
      const initialQuota = await QuotaService.checkDailyQuota(userId, 'brand_draft_per_day');
      expect(initialQuota.allowed).toBe(true);
      expect(initialQuota.limit).toBe(5);
      expect(initialQuota.used).toBe(0);
      expect(initialQuota.remaining).toBe(5);
      expect(initialQuota.resetAt).toBeDefined();

      // 2. Requesting 6 items exceeds limit
      await expect(
        QuotaService.checkDailyQuota(userId, 'brand_draft_per_day', 6)
      ).rejects.toThrow(QuotaExceededError);

      try {
        await QuotaService.checkDailyQuota(userId, 'brand_draft_per_day', 6);
      } catch (err: any) {
        expect(err.message).toContain('Daily brand draft limit reached');
        expect(err.details.limit).toBe(5);
        expect(err.details.resetAt).toBeDefined();
      }
    });

    it('staff user (admin) has unlimited quota (limit = null) and is never blocked', async () => {
      const staffUser = await createTestUser('admin');
      const quota = await QuotaService.checkDailyQuota(staffUser.user.id, 'brand_draft_per_day', 100);

      expect(quota.allowed).toBe(true);
      expect(quota.limit).toBeNull();
      expect(quota.remaining).toBeNull();
    });
  });

  describe('2. Cross-User Asset Isolation', () => {
    it('prevents user B from referencing user A logo asset', async () => {
      const userA = await createTestUser('user');
      const userB = await createTestUser('user');

      const mockProvider = createMockAiProvider();
      const service = new BrandDraftService(() => mockProvider);
      const userALogoPath = `${userA.user.id}/secret-logo.png`;

      // User B tries to use user A's logo path in brand drafting
      await expect(
        service.draftBrand(toUserProfile(userB), {
          description: 'A coffee brand that sources beans from high-altitude farms.',
          logo_path: userALogoPath,
        })
      ).rejects.toThrow(ForbiddenError);

      try {
        await service.draftBrand(toUserProfile(userB), {
          description: 'A coffee brand that sources beans from high-altitude farms.',
          logo_path: userALogoPath,
        });
      } catch (err: any) {
        expect(err.message).toContain('permission to access this logo asset');
      }
    });
  });

  describe('3. Draft Persistence Semantics (Human-in-the-loop)', () => {
    it('does NOT create a brand in database when drafting; persists only when user saves', async () => {
      const user = await createTestUser('user');
      const admin = adminClient();
      const mockProvider = createMockAiProvider();
      const service = new BrandDraftService(() => mockProvider);

      // 1. Generate draft
      const result = await service.draftBrand(toUserProfile(user), {
        description: 'We are Organic Tea Co. selling single-origin green and herbal teas. Slogan: Sip in peace.',
      });

      expect(result.draft).toBeDefined();
      expect(result.draft.name.value).toBe('Organic Tea Co.');
      expect(result.draft.name.source).toBe('you_said');

      // 2. Verify NO brand was saved to the database
      const { data: brandsAfterDraft } = await admin
        .from('brands')
        .select('*')
        .eq('user_id', user.user.id);

      expect(brandsAfterDraft).toHaveLength(0);

      // 3. User reviews, edits, and explicitly saves through BrandRepo
      const brandRepo = new SupabaseBrandRepo(() => user.client);
      const savedBrand = await brandRepo.create(user.user.id, {
        name: result.draft.name.value,
        what_you_sell: result.draft.what_you_sell.value,
        why: result.draft.why.value,
        tone: result.draft.tone.value,
        colors: result.draft.colors.value,
        wordmark: result.draft.wordmark.value,
        slogan: result.draft.slogan.value,
        footer_text: result.draft.footer_text.value,
        never_do_rules: result.draft.never_do_rules.value,
        default_values: result.draft.default_values.value,
      });

      expect(savedBrand.id).toBeDefined();
      expect(savedBrand.name).toBe('Organic Tea Co.');

      // 4. Verify exactly 1 brand now exists in the database
      const { data: brandsAfterSave } = await admin
        .from('brands')
        .select('*')
        .eq('user_id', user.user.id);

      expect(brandsAfterSave).toHaveLength(1);
      expect(brandsAfterSave?.[0]?.name).toBe('Organic Tea Co.');
      expect(brandsAfterSave?.[0]?.slogan).toBe('Sip in peace');
      expect(brandsAfterSave?.[0]?.colors).toEqual(['#2F5233', '#B1D8B7']);
    });
  });

  describe('4. Input Validation Constraints', () => {
    it('rejects description under 20 characters', async () => {
      const user = await createTestUser('user');
      const mockProvider = createMockAiProvider();
      const service = new BrandDraftService(() => mockProvider);

      await expect(
        service.draftBrand(toUserProfile(user), {
          description: 'Too short',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects description over 2000 characters', async () => {
      const user = await createTestUser('user');
      const mockProvider = createMockAiProvider();
      const service = new BrandDraftService(() => mockProvider);
      const longDescription = 'A'.repeat(2001);

      await expect(
        service.draftBrand(toUserProfile(user), {
          description: longDescription,
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
