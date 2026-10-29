export type AppRole = 'owner' | 'admin' | 'user';
export type AccountStatus = 'active' | 'suspended' | 'pending_deletion';

export interface ActorProfile {
  id: string;
  role: AppRole;
  status: AccountStatus;
  aal?: 'aal1' | 'aal2'; // Supabase MFA level
}

export interface TargetProfile {
  id: string;
  role: AppRole;
  status: AccountStatus;
}

export type Action =
  | 'use_own_data'
  | 'open_admin_panel'
  | 'list_search_users'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'grant_comp_plan'
  | 'quota_override'
  | 'promote_demote_admin'
  | 'edit_plans'
  | 'edit_system_prompts'
  | 'toggle_ai_kill_switch'
  | 'toggle_signups'
  | 'toggle_maintenance'
  | 'view_cost_dashboard'
  | 'view_audit_log'
  | 'hard_delete_user'
  | 'abuse_review';

/**
 * Central authorization authority for Anyref.
 * Implements the locked permission matrix from AGENT_PROMPT_PUBLIC_LAUNCH.md.
 * An admin can never act on the owner or another admin except to read them.
 */
export function can(
  actor: ActorProfile | null | undefined,
  action: Action,
  target?: TargetProfile | null
): boolean {
  if (!actor || actor.status !== 'active') {
    return false;
  }

  const { role } = actor;

  switch (action) {
    case 'use_own_data':
      return true;

    case 'open_admin_panel':
      // Staff with MFA requirement
      if (role === 'owner' || role === 'admin') {
        return true;
      }
      return false;

    case 'list_search_users':
    case 'view_cost_dashboard':
    case 'view_audit_log':
    case 'toggle_ai_kill_switch':
    case 'toggle_signups':
    case 'toggle_maintenance':
      return role === 'owner' || role === 'admin';

    case 'suspend_user':
    case 'unsuspend_user': {
      if (role === 'owner') {
        // Owner can suspend any user or admin, but not themselves
        return target ? target.id !== actor.id : true;
      }
      if (role === 'admin') {
        // Admin can ONLY suspend standard 'user' accounts
        if (!target) return true;
        return target.role === 'user';
      }
      return false;
    }

    case 'grant_comp_plan':
    case 'quota_override': {
      if (role === 'owner') return true;
      if (role === 'admin') {
        // Admin can override quotas for standard users
        if (!target) return true;
        return target.role === 'user';
      }
      return false;
    }

    case 'promote_demote_admin':
    case 'edit_plans':
    case 'edit_system_prompts':
    case 'hard_delete_user':
      // Strictly owner-only actions
      return role === 'owner';

    case 'abuse_review':
      return role === 'owner' || role === 'admin';

    default:
      return false;
  }
}
