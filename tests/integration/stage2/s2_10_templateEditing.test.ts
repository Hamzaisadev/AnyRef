import { describe, it, expect, afterAll } from 'vitest';
import { createTestUser, resetDb } from '../helpers/dbHarness';
import { validatePromptTemplate } from '@/domain/validateTemplate';

describe('S2-10: Workbench template editing, make slot, collapse to text, and validation', () => {
  afterAll(async () => {
    await resetDb();
  });

  it('allows promoting text to a slot and collapsing a slot to text with validation before saving', async () => {
    const testUser = await createTestUser('user');

    // 1. Create a brand
    const { POST: createBrandHandler } = await import('@/app/api/brands/route');
    const brandReq = new Request('http://localhost:3000/api/brands', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Vanguard Studios',
        colors: ['#0F1020', '#3B82F6'],
        wordmark: 'VANGUARD',
      }),
    });
    const brandRes = await createBrandHandler(brandReq as any);
    expect(brandRes.status).toBe(201);
    const { brand } = await brandRes.json();

    // 2. Create initial entry
    const { POST: createEntryHandler, GET: listEntriesHandler } = await import('@/app/api/entries/route');
    const entryReq = new Request('http://localhost:3000/api/entries', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand_id: brand.id,
        prompt_template: 'Poster for {{brand_name}}: {{headline}} at dusk.',
        slots: [
          {
            key: 'brand_name',
            label: 'Brand Wordmark',
            type: 'short_text',
            required: true,
            optional_block: false,
            brand_field: 'wordmark',
          },
          {
            key: 'headline',
            label: 'Headline',
            type: 'short_text',
            required: true,
            optional_block: false,
            brand_field: null,
          },
        ],
        status: 'draft',
        note: 'Template editing initial entry',
      }),
    });
    const entryRes = await createEntryHandler(entryReq as any);
    expect(entryRes.status).toBe(201);
    const { entry } = await entryRes.json();

    // 3. Test Collapse to Text:
    // User collapses {{headline}} to static text "Summer Solstice Sale"
    const collapsedTemplate = 'Poster for {{brand_name}}: Summer Solstice Sale at dusk.';
    const collapsedSlots = entry.slots.filter((s: any) => s.key !== 'headline');

    // Validate before save
    const validationAfterCollapse = validatePromptTemplate(collapsedTemplate, collapsedSlots);
    expect(validationAfterCollapse.valid).toBe(true);

    const { PATCH: updateEntryHandler, GET: getEntryHandler } = await import('@/app/api/entries/[id]/route');
    const collapsePatchReq = new Request(`http://localhost:3000/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt_template: collapsedTemplate,
        slots: collapsedSlots,
      }),
    });
    const collapsePatchRes = await updateEntryHandler(collapsePatchReq as any, {
      params: Promise.resolve({ id: entry.id }),
    });
    expect(collapsePatchRes.status).toBe(200);
    const { entry: entryAfterCollapse } = await collapsePatchRes.json();
    expect(entryAfterCollapse.prompt_template).toBe(collapsedTemplate);
    expect(entryAfterCollapse.slots).toHaveLength(1);

    // 4. Test Make Slot:
    // User highlights "dusk" and promotes it to slot {{time_of_day}}
    const promotedTemplate = 'Poster for {{brand_name}}: Summer Solstice Sale at {{time_of_day}}.';
    const promotedSlots = [
      ...collapsedSlots,
      {
        key: 'time_of_day',
        label: 'Time Of Day',
        type: 'short_text',
        required: true,
        optional_block: false,
        brand_field: null,
        default: 'dusk',
      },
    ];

    const validationAfterPromote = validatePromptTemplate(promotedTemplate, promotedSlots);
    expect(validationAfterPromote.valid).toBe(true);

    const promotePatchReq = new Request(`http://localhost:3000/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt_template: promotedTemplate,
        slots: promotedSlots,
      }),
    });
    const promotePatchRes = await updateEntryHandler(promotePatchReq as any, {
      params: Promise.resolve({ id: entry.id }),
    });
    expect(promotePatchRes.status).toBe(200);
    const { entry: entryAfterPromote } = await promotePatchRes.json();
    expect(entryAfterPromote.prompt_template).toBe(promotedTemplate);
    expect(entryAfterPromote.slots).toHaveLength(2);
    expect(entryAfterPromote.slots.some((s: any) => s.key === 'time_of_day')).toBe(true);
  });
});
