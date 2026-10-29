import { NextResponse } from 'next/server';
import { processWebhookEvent } from '@/services/billingService';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature') || request.headers.get('x-webhook-signature') || '';
    const secret = env.BILLING_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Billing webhook secret not configured' }, { status: 500 });
    }
    const provider = request.headers.get('x-billing-provider') || 'mor_standard';

    const result = await processWebhookEvent({
      provider,
      rawBody,
      signature,
      secret,
    });

    return NextResponse.json({ ok: true, status: result.status }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    const status = message.includes('signature') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
