import { createClient } from '../lib/supabaseServer';

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
   * Records a user's consent choice in the consent_records table.
   */
  static async recordConsent(params: {
    userId?: string | null;
    kind: ConsentKind;
    version: string;
    granted: boolean;
  }): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('consent_records').insert({
        user_id: params.userId ?? null,
        kind: params.kind,
        version: params.version,
        granted: params.granted,
      });
    } catch (err) {
      console.error('[ConsentService] Failed to record consent:', err);
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
      const supabase = await createClient();
      const { data } = await supabase
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
