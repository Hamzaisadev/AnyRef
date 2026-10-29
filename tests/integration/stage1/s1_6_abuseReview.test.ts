import { describe, it, expect, afterAll } from 'vitest';
import { AdminService } from '@/services/adminService';
import { adminClient, createTestUser, resetDb } from '../helpers/dbHarness';
import type { ActorProfile } from '@/services/authz';

describe('S1-6: AdminService.conductAbuseReview queries real schema columns', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('successfully retrieves target user brands and entries without column errors', async () => {
    const adminUser = await createTestUser('admin');
    const targetUser = await createTestUser('user');

    // Seed target user's brand
    const { data: brand, error: brandErr } = await admin
      .from('brands')
      .insert({
        user_id: targetUser.user.id,
        name: 'Target Brand',
        what_you_sell: 'Coffee beans',
        why: 'Fresh roast',
        colors: ['#000000'],
        default_values: {},
      })
      .select()
      .single();

    expect(brandErr).toBeNull();
    expect(brand).toBeDefined();

    // Seed target user's entry
    const { data: entry, error: entryErr } = await admin
      .from('entries')
      .insert({
        user_id: targetUser.user.id,
        brand_id: brand!.id,
        prompt_template: 'A poster for {{brand}}',
        slots: [],
        status: 'draft',
      })
      .select()
      .single();

    expect(entryErr).toBeNull();
    expect(entry).toBeDefined();

    const adminActor: ActorProfile = {
      id: adminUser.user.id,
      role: 'admin',
      status: 'active',
      aal: 'aal2',
    };

    const review = await AdminService.conductAbuseReview(
      adminActor,
      targetUser.user.id,
      'Valid reason: Investigating suspicious spam report'
    );

    // Verify brands and entries were successfully queried and returned
    expect(review.brands).toHaveLength(1);
    expect(review.brands[0]).toMatchObject({
      id: brand!.id,
      name: 'Target Brand',
    });

    expect(review.entries).toHaveLength(1);
    expect(review.entries[0]).toMatchObject({
      id: entry!.id,
      prompt_template: 'A poster for {{brand}}',
    });
  });
});
