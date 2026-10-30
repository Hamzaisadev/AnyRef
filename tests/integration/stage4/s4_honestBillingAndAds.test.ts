import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, resetDb } from '../helpers/dbHarness';
import { StandardMoRBillingProvider } from '@/services/billingService';
import { POST as webhookHandler } from '@/app/api/webhooks/billing/route';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

describe('Stage 4: Honest Billing & Ads', () => {
  const admin = adminClient();

  afterAll(async () => {
    await resetDb();
  });

  it('S4-1: StandardMoRBillingProvider rejects checkout sessions with honest error and no fake URLs', async () => {
    const provider = new StandardMoRBillingProvider();

    await expect(
      provider.createCheckoutSession({
        userId: 'test-user-id',
        planId: 'plus',
        email: 'user@example.com',
        returnUrl: 'https://anyref.app/billing',
      })
    ).rejects.toThrow(/Plus tier is coming soon/i);

    await expect(
      provider.createCustomerPortalSession({
        customerId: 'test-customer-id',
        returnUrl: 'https://anyref.app/billing',
      })
    ).rejects.toThrow(/Customer portal is not yet active/i);
  });

  it('S4-2: Billing webhook verifies signature with configured secret and rejects tampered signature', async () => {
    const secret = process.env.BILLING_WEBHOOK_SECRET || 'test_webhook_secret';
    const payload = JSON.stringify({
      event_id: 'evt_test_sec_check_1',
      type: 'subscription.created',
      user_id: '00000000-0000-0000-0000-000000000001',
      customer_id: 'cus_123',
      subscription_id: 'sub_123',
      plan_id: 'plus',
      status: 'active',
      timestamp: new Date().toISOString(),
    });

    // 1. Genuine signature
    const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const validReq = new NextRequest('http://localhost:3000/api/webhooks/billing', {
      method: 'POST',
      headers: {
        'x-signature': validSignature,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    const validRes = await webhookHandler(validReq);
    expect(validRes.status).toBe(200);

    // 2. Tampered signature must fail with 400
    const invalidReq = new NextRequest('http://localhost:3000/api/webhooks/billing', {
      method: 'POST',
      headers: {
        'x-signature': 'tampered_signature_hex_123',
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    const invalidRes = await webhookHandler(invalidReq);
    expect(invalidRes.status).toBe(400);
  });

  it('S4-3: Live plans in database have show_ads = false', async () => {
    const { data: plans, error } = await admin.from('plans').select('id, show_ads');
    expect(error).toBeNull();
    expect(plans).toBeDefined();

    for (const plan of plans!) {
      expect(plan.show_ads).toBe(false);
    }
  });

  it('S4-3: Rendered app pages do not mount AdSlot or ConsentBanner', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/(app)/layout.tsx');
    const libraryPath = path.resolve(process.cwd(), 'src/app/(app)/library/page.tsx');

    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    const libraryContent = fs.readFileSync(libraryPath, 'utf8');

    expect(layoutContent).not.toContain('<ConsentBanner');
    expect(libraryContent).not.toContain('<AdSlot');
  });

  it('F2-9: Verified features with UI implementations exist and are marked complete in PLAN.md', () => {
    const planPath = path.resolve(process.cwd(), 'PLAN.md');
    const planContent = fs.readFileSync(planPath, 'utf8');

    // Verify corresponding UI components and scripts exist
    expect(fs.existsSync(path.resolve(process.cwd(), 'src/components/library/AddEntryModal.tsx'))).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), 'src/components/auth/TurnstileWidget.tsx'))).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), 'src/app/(admin)/admin/mfa/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), 'scripts/load-test.ts'))).toBe(true);

    // Verify marked [x] in PLAN.md now that UI implementations are delivered
    expect(planContent).toMatch(/- \[x\].*manual "add entry" UI/i);
    expect(planContent).toMatch(/- \[x\].*paste-many UI/i);
    expect(planContent).toMatch(/- \[x\].*Cloudflare Turnstile widget UI/i);
    expect(planContent).toMatch(/- \[x\].*Staff TOTP MFA enrollment UI/i);
    expect(planContent).toMatch(/- \[x\].*load test \(500 concurrent users\)/i);
  });
});

