import { createClient } from '../lib/supabaseServer';
import { logAuditEvent } from '../data/auditRepo';
import { NotFoundError, BadRequestError } from '../lib/errors';

export interface DeletionStatus {
  isPendingDeletion: boolean;
  deletionRequestedAt: string | null;
  daysRemaining: number | null;
}

const DELETION_GRACE_PERIOD_DAYS = 14;

/**
 * Requests self-serve account deletion.
 * Sets the account status to 'pending_deletion', starts the 14-day grace period,
 * and logs the action in the audit log.
 */
export async function requestAccountDeletion(
  userId: string,
  context?: { ip?: string; userAgent?: string }
): Promise<DeletionStatus> {
  const supabase = await createClient();

  const { data: profile, error: fetchErr } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr || !profile) {
    throw new NotFoundError('User profile not found.');
  }

  if (profile.role === 'owner') {
    throw new BadRequestError('The platform owner cannot delete their account directly. Transfer ownership first.');
  }

  const requestedAt = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      status: 'pending_deletion',
      deletion_requested_at: requestedAt,
    })
    .eq('user_id', userId);

  if (updateErr) {
    throw new Error(`Failed to request account deletion: ${updateErr.message}`);
  }

  await logAuditEvent({
    actor_id: userId,
    action: 'account_deletion_requested',
    target_user_id: userId,
    target_type: 'profile',
    target_id: userId,
    before: { status: profile.status },
    after: { status: 'pending_deletion', deletion_requested_at: requestedAt },
    ip: context?.ip,
    user_agent: context?.userAgent,
  });

  return {
    isPendingDeletion: true,
    deletionRequestedAt: requestedAt,
    daysRemaining: DELETION_GRACE_PERIOD_DAYS,
  };
}

/**
 * Cancels a pending account deletion within the 14-day grace window.
 * Restores status to 'active' and clears deletion_requested_at.
 */
export async function cancelAccountDeletion(
  userId: string,
  context?: { ip?: string; userAgent?: string }
): Promise<DeletionStatus> {
  const supabase = await createClient();

  const { data: profile, error: fetchErr } = await supabase
    .from('profiles')
    .select('status, deletion_requested_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr || !profile) {
    throw new NotFoundError('User profile not found.');
  }

  if (profile.status !== 'pending_deletion') {
    return {
      isPendingDeletion: false,
      deletionRequestedAt: null,
      daysRemaining: null,
    };
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      status: 'active',
      deletion_requested_at: null,
    })
    .eq('user_id', userId);

  if (updateErr) {
    throw new Error(`Failed to cancel account deletion: ${updateErr.message}`);
  }

  await logAuditEvent({
    actor_id: userId,
    action: 'account_deletion_cancelled',
    target_user_id: userId,
    target_type: 'profile',
    target_id: userId,
    before: { status: 'pending_deletion', deletion_requested_at: profile.deletion_requested_at },
    after: { status: 'active', deletion_requested_at: null },
    ip: context?.ip,
    user_agent: context?.userAgent,
  });

  return {
    isPendingDeletion: false,
    deletionRequestedAt: null,
    daysRemaining: null,
  };
}

/**
 * Gets the current account deletion status and days remaining in grace period.
 */
export async function getAccountDeletionStatus(userId: string): Promise<DeletionStatus> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('status, deletion_requested_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile || profile.status !== 'pending_deletion' || !profile.deletion_requested_at) {
    return {
      isPendingDeletion: false,
      deletionRequestedAt: null,
      daysRemaining: null,
    };
  }

  const requestedDate = new Date(profile.deletion_requested_at);
  const expiryDate = new Date(requestedDate.getTime() + DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const msRemaining = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    isPendingDeletion: true,
    deletionRequestedAt: profile.deletion_requested_at,
    daysRemaining,
  };
}
