import { createClient } from '../lib/supabaseServer';

export interface AuditEntry {
  actor_id?: string | null;
  action: string;
  target_user_id?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
  ip?: string | null;
  user_agent?: string | null;
}

/**
 * Appends a record to the append-only audit_log table.
 * RLS blocks UPDATE and DELETE on this table.
 */
export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('audit_log').insert({
      actor_id: entry.actor_id ?? null,
      action: entry.action,
      target_user_id: entry.target_user_id ?? null,
      target_type: entry.target_type ?? null,
      target_id: entry.target_id ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      reason: entry.reason ?? null,
      ip: entry.ip ?? null,
      user_agent: entry.user_agent ?? null,
    });

    if (error) {
      console.error('[AuditLog] Failed to insert audit log entry:', error);
    }
  } catch (err) {
    console.error('[AuditLog] Exception while logging audit event:', err);
  }
}
