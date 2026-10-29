import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest';
import { getActiveSystemPrompt, clearPromptCache } from '@/services/promptService';
import { GenerateService } from '@/services/generateService';
import { DEFAULT_GENERATE_SYSTEM_PROMPT } from '@/ai/geminiProvider';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';
import type { AiProvider } from '@/ai/AiProvider';
import type { BrandRepo } from '@/data/brandRepo';

describe('S1-9: Dynamic versioned system prompts from database', () => {
  const admin = adminClient();

  beforeEach(async () => {
    clearPromptCache();
    await admin.from('system_prompts').delete().eq('version', 99);
  });

  afterAll(async () => {
    await admin.from('system_prompts').delete().eq('version', 99);
    await resetDb();
  });

  it('falls back to default prompt when no active prompt exists in database', async () => {
    const prompt = await getActiveSystemPrompt('generate');
    expect(prompt.version).toBeNull();
    expect(prompt.body).toBe(DEFAULT_GENERATE_SYSTEM_PROMPT);
  });

  it('reads highest version prompt from system_prompts and passes to provider and proposal', async () => {
    const testUser = await createTestUser('owner');

    // 1. Insert a custom system prompt row into system_prompts table
    const customPromptBody = 'Custom system prompt v99: Follow strict brand guidelines.';
    const { error: insertErr } = await admin.from('system_prompts').insert({
      purpose: 'generate',
      version: 99,
      body: customPromptBody,
      user_id: testUser.user.id,
    });
    expect(insertErr).toBeNull();

    clearPromptCache();

    // 2. Verify getActiveSystemPrompt returns this DB prompt
    const loadedPrompt = await getActiveSystemPrompt('generate');
    expect(loadedPrompt.version).toBe(99);
    expect(loadedPrompt.body).toBe(customPromptBody);

    // 3. Test generateService passes custom prompt to provider and records version on proposal
    const mockBrand = {
      id: 'b1111111-1111-1111-1111-111111111111',
      user_id: testUser.user.id,
      name: 'Prompt Test Brand',
      what_you_sell: 'Apparel',
      why: 'Style',
      tone: 'Modern',
      colors: ['#ffffff'],
      wordmark: 'STYLE',
      slogan: 'Wear it',
      never_do_rules: 'No retro',
      default_values: {},
      created_at: 'now',
      updated_at: 'now',
    };

    const mockBrandRepo = {
      findById: vi.fn().mockResolvedValue(mockBrand),
    } as unknown as BrandRepo;

    let receivedSystemPrompt = '';
    const mockProvider: AiProvider = {
      name: 'mock',
      draftBrand: vi.fn(),
      generateTemplate: vi.fn().mockImplementation(async (input) => {
        receivedSystemPrompt = input.systemPrompt || '';
        return {
          prompt_template:
            'A wide studio banner with clean floor. In the center sits the exact product in the attached product image, reproduced faithfully and unchanged. Top reads {{wordmark}}.',
          slots: [
            {
              key: 'wordmark',
              label: 'Wordmark',
              type: 'short_text',
              required: true,
              brand_field: 'wordmark',
              optional_block: false,
              never_invent: false,
            },
          ],
          poster_type: 'launch',
          intended_product_shape: 'tall',
          layout_notes: 'Studio layout',
        };
      }),
      autofillSlots: vi.fn(),
    };

    const service = new GenerateService(mockBrandRepo, () => mockProvider);

    const validJpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    ]);

    const proposal = await service.generate(
      testUser.user.id,
      mockBrand.id,
      validJpegBuffer,
      'image/jpeg'
    );

    // Provider received the DB prompt body
    expect(receivedSystemPrompt).toBe(customPromptBody);

    // Proposal has version 99 recorded
    expect(proposal.system_prompt_version).toBe(99);

    // Hard Rule 5: System prompt body is NEVER returned in the proposal
    expect((proposal as any).system_prompt_body).toBeUndefined();
    expect((proposal as any).body).toBeUndefined();
  });
});
