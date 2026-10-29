import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { ensureUserSeeded } from '@/services/accountService';
import { ConsentService } from '@/services/consentService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/library';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data?.user?.id) {
        await ensureUserSeeded(data.user.id);
        const metadata = data.user.user_metadata || {};
        if (metadata.tos_accepted || metadata.age_confirmed) {
          await ConsentService.recordUserConsent({
            userId: data.user.id,
            tosVersion: metadata.tos_version || '2026-01',
            tosAccepted: Boolean(metadata.tos_accepted),
            ageConfirmed: Boolean(metadata.age_confirmed),
          });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
