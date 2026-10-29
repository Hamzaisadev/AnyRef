import { createClient, createAdminClient } from '../lib/supabaseServer';
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
  const supabase = createAdminClient();

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
  const supabase = createAdminClient();

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
  const supabase = createAdminClient();

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

/**
 * Ensures that a user has an initial sample brand and starter entries.
 * Idempotent: does nothing if the user already has at least one brand.
 */
export async function ensureUserSeeded(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { count, error: countErr } = await admin
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countErr || (count && count > 0)) {
    return;
  }

  // 1. Create Default Sample Brand
  const { data: brand, error: brandErr } = await admin
    .from('brands')
    .insert({
      user_id: userId,
      name: 'Acme Sample Brand',
      what_you_sell: 'Premium handcrafted insulated drinkware and outdoor lifestyle gear',
      why: 'Keep your drinks at peak temperature while reducing single-use plastic waste',
      tone: 'Modern, adventurous, reliable, minimalist',
      colors: ['#1E293B', '#0EA5E9', '#F8FAFC'],
      wordmark: 'ACME',
      slogan: 'Built for Every Journey',
      footer_text: 'Designed in California. Lifetime warranty.',
      never_do_rules: 'Never show damaged or rusted tumblers; never use low-resolution clipart.',
      default_values: { cta_text: 'SHOP NOW', urgency: 'NEW ARRIVAL' },
    })
    .select('id')
    .single();

  if (brandErr || !brand) {
    return;
  }

  // 2. Create Starter Entries
  await admin.from('entries').insert([
    {
      user_id: userId,
      brand_id: brand.id,
      prompt_template:
        'A sleek product launch poster for {{brand_name}}. In the center sits the exact product in the attached product image, reproduced faithfully and unchanged against a dramatic dusk mountain backdrop. The top bold header reads "{{headline}}". Below the product, an accent pill says "{{subhead}}". Bottom footer contains wordmark "{{wordmark}}" with tag "{{slogan}}". Minimalist, studio lighting with natural rim light.',
      slots: [
        {
          key: 'brand_name',
          label: 'Brand Name',
          type: 'short_text',
          required: true,
          brand_field: 'wordmark',
          optional_block: false,
          never_invent: false,
        },
        {
          key: 'headline',
          label: 'Main Headline',
          type: 'short_text',
          required: true,
          brand_field: null,
          optional_block: false,
          never_invent: false,
        },
        {
          key: 'subhead',
          label: 'Subheading',
          type: 'short_text',
          required: false,
          brand_field: null,
          optional_block: true,
          never_invent: false,
        },
        {
          key: 'wordmark',
          label: 'Wordmark',
          type: 'short_text',
          required: true,
          brand_field: 'wordmark',
          optional_block: false,
          never_invent: false,
        },
        {
          key: 'slogan',
          label: 'Slogan',
          type: 'short_text',
          required: true,
          brand_field: 'slogan',
          optional_block: false,
          never_invent: false,
        },
      ],
      status: 'draft',
      poster_type: 'launch',
      intended_product_shape: 'tall',
      note: 'Sample Launch Poster',
    },
    {
      user_id: userId,
      brand_id: brand.id,
      prompt_template:
        'A festive promotional poster for {{brand_name}}. In the center sits the exact product in the attached product image, reproduced faithfully and unchanged, surrounded by subtle golden bokeh lights and warm festive ribbons. Top banner reads "{{headline}}". Bottom includes "{{footer_text}}" with brand mark "{{wordmark}}". Warm, celebratory, premium lighting.',
      slots: [
        {
          key: 'brand_name',
          label: 'Brand Name',
          type: 'short_text',
          required: true,
          brand_field: 'wordmark',
          optional_block: false,
          never_invent: false,
        },
        {
          key: 'headline',
          label: 'Festive Headline',
          type: 'short_text',
          required: true,
          brand_field: null,
          optional_block: false,
          never_invent: false,
        },
        {
          key: 'wordmark',
          label: 'Wordmark',
          type: 'short_text',
          required: true,
          brand_field: 'wordmark',
          optional_block: false,
          never_invent: false,
        },
        {
          key: 'footer_text',
          label: 'Footer Text',
          type: 'short_text',
          required: true,
          brand_field: 'footer_text',
          optional_block: false,
          never_invent: false,
        },
      ],
      status: 'draft',
      poster_type: 'festive',
      intended_product_shape: 'square',
      note: 'Sample Festive Poster',
    },
  ]);
}
