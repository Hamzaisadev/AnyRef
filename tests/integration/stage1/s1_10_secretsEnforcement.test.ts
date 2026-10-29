import { describe, it, expect } from 'vitest';
import { GET as cronCleanup } from '@/app/api/cron/cleanup/route';
import { POST as billingWebhook } from '@/app/api/webhooks/billing/route';
import { adminClient } from '../helpers/dbHarness';

describe('S1-10: Secret enforcement on sensitive routes', () => {
  // Ensure harness initializes environment
  adminClient();

  it('rejects unauthorized cron cleanup invocation without secret header', async () => {
    const req = new Request('http://localhost/api/cron/cleanup', {
      method: 'GET',
    });
    const res = await cronCleanup(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Unauthorized cron invocation');
  });

  it('rejects cron cleanup with invalid bearer token', async () => {
    const req = new Request('http://localhost/api/cron/cleanup', {
      method: 'GET',
      headers: {
        authorization: 'Bearer wrong_token',
      },
    });
    const res = await cronCleanup(req);
    expect(res.status).toBe(401);
  });

  it('rejects billing webhook with invalid signature', async () => {
    const req = new Request('http://localhost/api/webhooks/billing', {
      method: 'POST',
      headers: {
        'x-signature': 'invalid_signature_hash',
      },
      body: JSON.stringify({ event_type: 'subscription.created' }),
    });
    const res = await billingWebhook(req);
    expect(res.status).toBe(400);
  });
});
