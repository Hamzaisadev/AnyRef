import { createAdminClient } from '../lib/supabaseServer';

export type ConsentKind = 'tos' | 'privacy' | 'ads_personalized' | 'ads_basic';

export interface ConsentRecord {
  kind: ConsentKind;
  version: string;
  granted: boolean;
  created_at: string;
}

/**
 * Service to record and query user consent for GDPR, privacy laws, and ad personalization.
 */
export class ConsentService {
  /**
   * Records a user's consent choice in the consent_records table, and synchronizes
   * tos/age consent timestamps to profiles table using the admin client.
   */
  static async recordConsent(params: {
    userId?: string | null;
    kind: ConsentKind;
    version: string;
    granted: boolean;
  }): Promise<void> {
    try {
      const admin = createAdminClient();
      await admin.from('consent_records').insert({
        user_id: params.userId ?? null,
        kind: params.kind,
        version: params.version,
        granted: params.granted,
      });

      if (params.userId && params.granted) {
        const now = new Date().toISOString();
        if (params.kind === 'tos') {
          await admin
            .from('profiles')
            .update({
              tos_version: params.version,
              tos_accepted_at: now,
            })
            .eq('user_id', params.userId);
        } else if (params.kind === 'privacy') {
          await admin
            .from('profiles')
            .update({
              age_confirmed_at: now,
            })
            .eq('user_id', params.userId);
        }
      }
    } catch (err) {
      console.error('[ConsentService] Failed to record consent:', err);
    }
  }

  /**
   * Records full user consent across both consent_records and profiles.
   */
  static async recordUserConsent(params: {
    userId: string;
    tosVersion?: string;
    tosAccepted?: boolean;
    ageConfirmed?: boolean;
  }): Promise<void> {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const version = params.tosVersion || '2026-01';

    if (params.tosAccepted) {
      await admin.from('consent_records').insert({
        user_id: params.userId,
        kind: 'tos',
        version,
        granted: true,
      });
    }

    if (params.ageConfirmed) {
      await admin.from('consent_records').insert({
        user_id: params.userId,
        kind: 'privacy',
        version,
        granted: true,
      });
    }

    const profileUpdate: Record<string, unknown> = {};
    if (params.tosAccepted) {
      profileUpdate.tos_version = version;
      profileUpdate.tos_accepted_at = now;
    }
    if (params.ageConfirmed) {
      profileUpdate.age_confirmed_at = now;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await admin
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', params.userId);
    }
  }

  /**
   * Fetches the latest consent state for a user.
   */
  static async getLatestConsent(
    userId: string,
    kind: ConsentKind
  ): Promise<boolean | null> {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('consent_records')
        .select('granted')
        .eq('user_id', userId)
        .eq('kind', kind)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data?.granted ?? null;
    } catch {
      return null;
    }
  }
}
