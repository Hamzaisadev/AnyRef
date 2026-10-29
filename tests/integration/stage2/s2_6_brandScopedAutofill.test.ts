import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';
import { EntryService } from '@/services/entryService';
import { SupabaseEntryRepo } from '@/data/entryRepo';
import { SupabaseBrandRepo } from '@/data/brandRepo';
import { renderPrompt } from '@/domain/renderPrompt';

describe('S2-5 & S2-6: Autofill brand scoping and human-in-the-loop slot rendering', () => {
  afterAll(async () => {
    await resetDb();
  });

  it('scopes entries to active brand and permits human completion of needs_you slots for live prompt rendering', async () => {
    const testUser = await createTestUser('user');
    const admin = adminClient();

    // 1. Create Brand A with specific default values
    const { data: brandA } = await admin
      .from('brands')
      .insert({
        user_id: testUser.user.id,
        name: 'Brand Aurora',
        colors: ['#3B82F6', '#10B981'],
        wordmark: 'AURORA',
        default_values: { headline: 'Winter Collection 2026' },
      })
      .select()
      .single();

    const userEntryService = new EntryService(
      new SupabaseEntryRepo(() => testUser.client),
      new SupabaseBrandRepo(() => testUser.client)
    );

    // 2. Create entry with never_invent slot (discount) and brand slot (wordmark)
    const entryA = await userEntryService.createEntry(testUser.user.id, {
      brand_id: brandA!.id,
      prompt_template: 'Minimal poster for {{brand_wordmark}}: {{headline}} with {{discount}} off.',
      slots: [
        {
          key: 'brand_wordmark',
          label: 'Brand Wordmark',
          type: 'short_text',
          required: true,
          optional_block: false,
          brand_field: 'wordmark',
        },
        {
          key: 'headline',
          label: 'Campaign Headline',
          type: 'short_text',
          required: true,
          optional_block: false,
          brand_field: null,
        },
        {
          key: 'discount',
          label: 'Discount',
          type: 'short_text',
          required: true,
          optional_block: false,
          never_invent: true,
          brand_field: null,
        },
      ],
      status: 'draft',
      note: 'Autofill studio test entry',
    });

    // 3. Verify entry query filtered by brand_id returns Entry A
    const { GET: listHandler } = await import('@/app/api/entries/route');
    const listReq = new Request(`http://localhost:3000/api/entries?brand_id=${brandA!.id}`, {
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    const listRes = await listHandler(listReq as any);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.entries).toHaveLength(1);
    expect(listData.entries[0].id).toBe(entryA.id);

    // 4. Simulate human completion of the "needs_you" slot and brand slots
    const editedValues: Record<string, string> = {
      brand_wordmark: brandA!.wordmark,
      headline: 'Winter Collection 2026',
      discount: '30%', // Human fills in verified price/discount
    };

    const rendered = renderPrompt(entryA.prompt_template, entryA.slots, editedValues);

    expect(rendered.missingRequired).toHaveLength(0);
    expect(rendered.text).toContain('"AURORA"');
    expect(rendered.text).toContain('"Winter Collection 2026"');
    expect(rendered.text).toContain('"30%"');
  });
});
