import { createClient, createAdminClient } from '../lib/supabaseServer';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';
import type { User } from '@supabase/supabase-js';
import type { AppRole, AccountStatus } from './authz';
import { can } from './authz';

export interface UserProfile {
  id: string;
  email: string;
  role: AppRole;
  status: AccountStatus;
  plan_id: string;
  tos_version?: string | null;
  tos_accepted_at?: string | null;
  age_confirmed_at?: string | null;
  hasConsented?: boolean;
  rawUser: User;
}

export async function getUser(req?: Request): Promise<UserProfile | null> {
  try {
    let authHeader: string | null = null;
    if (req) {
      authHeader = req.headers.get('authorization');
    }
    if (!authHeader) {
      try {
        const { headers } = await import('next/headers');
        const h = await headers();
        authHeader = h.get('authorization');
      } catch {
        // Outside request context
      }
    }

    let user: User | null = null;
    let supabaseClient: any;

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim();
      const admin = createAdminClient();
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) {
        return null;
      }
      user = data.user;
      supabaseClient = admin;
    } else {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return null;
      }
      user = data.user;
      supabaseClient = supabase;
    }

    if (!user) {
      return null;
    }

    // Fetch corresponding profile from profiles table
    let { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, status, plan_id, tos_version, tos_accepted_at, age_confirmed_at')
      .eq('user_id', user.id)
      .maybeSingle();

    // Auto-heal: If profile row is missing, insert initial default
    if (!profile) {
      const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
      const userEmail = user.email?.toLowerCase();
      const initialRole: AppRole = ownerEmail && userEmail === ownerEmail ? 'owner' : 'user';

      const { data: newProfile } = await supabaseClient
        .from('profiles')
        .insert({
          user_id: user.id,
          role: initialRole,
          status: 'active',
          plan_id: 'free',
          plan_source: 'default',
        })
        .select('role, status, plan_id, tos_version, tos_accepted_at, age_confirmed_at')
        .single();

      profile = newProfile;
    }

    const role = (profile?.role as AppRole) || 'user';
    const status = (profile?.status as AccountStatus) || 'active';
    const plan_id = (profile?.plan_id as string) || 'free';
    const tos_version = profile?.tos_version ?? null;
    const tos_accepted_at = profile?.tos_accepted_at ?? null;
    const age_confirmed_at = profile?.age_confirmed_at ?? null;
    const hasConsented = Boolean(tos_accepted_at && age_confirmed_at);

    return {
      id: user.id,
      email: user.email || '',
      role,
      status,
      plan_id,
      tos_version,
      tos_accepted_at,
      age_confirmed_at,
      hasConsented,
      rawUser: user,
    };
  } catch {
    return null;
  }
}

export async function requireUser(req?: Request): Promise<UserProfile> {
  const profile = await getUser(req);
  if (!profile) {
    throw new UnauthorizedError('Authentication required to access this resource.');
  }

  // Account lifecycle gates
  if (profile.status === 'suspended') {
    throw new ForbiddenError('Your account has been suspended. Please contact support.');
  }

  if (profile.status === 'pending_deletion') {
    throw new ForbiddenError('This account is pending deletion.');
  }

  return profile;
}

export async function requireAdmin(requireMfa = true): Promise<UserProfile> {
  const profile = await requireUser();

  const isStaff = can(
    { id: profile.id, role: profile.role, status: profile.status },
    'open_admin_panel'
  );

  if (!isStaff) {
    throw new ForbiddenError('Access denied: Administrator privileges required.');
  }

  // Enforce TOTP MFA (AAL2) for staff in production if configured
  if (requireMfa && process.env.ADMIN_MFA_REQUIRED === 'true') {
    const supabase = await createClient();
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData && aalData.currentLevel !== 'aal2' && process.env.NODE_ENV === 'production') {
      throw new ForbiddenError('Multi-Factor Authentication (AAL2) required for administrative access.');
    }
  }

  return profile;
}
