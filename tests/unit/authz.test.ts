import { describe, it, expect } from 'vitest';
import { can, type ActorProfile, type TargetProfile, type Action } from '../../src/services/authz';

describe('Central Authorization Engine (can()) - Permission Matrix', () => {
  const normalUser: ActorProfile = { id: 'u-1', role: 'user', status: 'active' };
  const adminActor: ActorProfile = { id: 'a-1', role: 'admin', status: 'active', aal: 'aal2' };
  const ownerActor: ActorProfile = { id: 'o-1', role: 'owner', status: 'active', aal: 'aal2' };

  const suspendedUser: ActorProfile = { id: 'u-2', role: 'user', status: 'suspended' };
  const pendingDeletionUser: ActorProfile = { id: 'u-3', role: 'user', status: 'pending_deletion' };

  const targetNormalUser: TargetProfile = { id: 'u-target', role: 'user', status: 'active' };
  const targetAdmin: TargetProfile = { id: 'a-target', role: 'admin', status: 'active' };
  const targetOwner: TargetProfile = { id: 'o-target', role: 'owner', status: 'active' };

  describe('Normal User Permissions', () => {
    it('can use own data', () => {
      expect(can(normalUser, 'use_own_data')).toBe(true);
    });

    const forbiddenActionsForUser: Action[] = [
      'open_admin_panel',
      'list_search_users',
      'suspend_user',
      'unsuspend_user',
      'grant_comp_plan',
      'quota_override',
      'promote_demote_admin',
      'edit_plans',
      'edit_system_prompts',
      'toggle_ai_kill_switch',
      'toggle_signups',
      'toggle_maintenance',
      'view_cost_dashboard',
      'view_audit_log',
      'hard_delete_user',
      'abuse_review',
    ];

    forbiddenActionsForUser.forEach((action) => {
      it(`denies user from action: ${action}`, () => {
        expect(can(normalUser, action)).toBe(false);
      });
    });
  });

  describe('Admin Permissions', () => {
    it('can use own data and open admin panel', () => {
      expect(can(adminActor, 'use_own_data')).toBe(true);
      expect(can(adminActor, 'open_admin_panel')).toBe(true);
    });

    it('can list/search users, view cost dashboard, view audit log, and toggle flags', () => {
      expect(can(adminActor, 'list_search_users')).toBe(true);
      expect(can(adminActor, 'view_cost_dashboard')).toBe(true);
      expect(can(adminActor, 'view_audit_log')).toBe(true);
      expect(can(adminActor, 'toggle_ai_kill_switch')).toBe(true);
      expect(can(adminActor, 'toggle_signups')).toBe(true);
      expect(can(adminActor, 'toggle_maintenance')).toBe(true);
      expect(can(adminActor, 'abuse_review')).toBe(true);
    });

    it('can suspend or unsuspend a normal user', () => {
      expect(can(adminActor, 'suspend_user', targetNormalUser)).toBe(true);
      expect(can(adminActor, 'unsuspend_user', targetNormalUser)).toBe(true);
    });

    it('CANNOT suspend or unsuspend an admin or owner', () => {
      expect(can(adminActor, 'suspend_user', targetAdmin)).toBe(false);
      expect(can(adminActor, 'suspend_user', targetOwner)).toBe(false);
      expect(can(adminActor, 'unsuspend_user', targetAdmin)).toBe(false);
      expect(can(adminActor, 'unsuspend_user', targetOwner)).toBe(false);
    });

    it('can grant comp plan or quota override for normal user', () => {
      expect(can(adminActor, 'grant_comp_plan', targetNormalUser)).toBe(true);
      expect(can(adminActor, 'quota_override', targetNormalUser)).toBe(true);
    });

    it('CANNOT grant comp plan or quota override to another admin or owner', () => {
      expect(can(adminActor, 'grant_comp_plan', targetAdmin)).toBe(false);
      expect(can(adminActor, 'grant_comp_plan', targetOwner)).toBe(false);
      expect(can(adminActor, 'quota_override', targetAdmin)).toBe(false);
      expect(can(adminActor, 'quota_override', targetOwner)).toBe(false);
    });

    it('CANNOT promote/demote admins, edit plans, edit system prompts, or hard-delete users', () => {
      expect(can(adminActor, 'promote_demote_admin')).toBe(false);
      expect(can(adminActor, 'edit_plans')).toBe(false);
      expect(can(adminActor, 'edit_system_prompts')).toBe(false);
      expect(can(adminActor, 'hard_delete_user')).toBe(false);
    });
  });

  describe('Owner Permissions', () => {
    it('can perform all administrative and owner-exclusive actions', () => {
      expect(can(ownerActor, 'use_own_data')).toBe(true);
      expect(can(ownerActor, 'open_admin_panel')).toBe(true);
      expect(can(ownerActor, 'list_search_users')).toBe(true);
      expect(can(ownerActor, 'promote_demote_admin')).toBe(true);
      expect(can(ownerActor, 'edit_plans')).toBe(true);
      expect(can(ownerActor, 'edit_system_prompts')).toBe(true);
      expect(can(ownerActor, 'toggle_ai_kill_switch')).toBe(true);
      expect(can(ownerActor, 'toggle_signups')).toBe(true);
      expect(can(ownerActor, 'toggle_maintenance')).toBe(true);
      expect(can(ownerActor, 'view_cost_dashboard')).toBe(true);
      expect(can(ownerActor, 'view_audit_log')).toBe(true);
      expect(can(ownerActor, 'hard_delete_user')).toBe(true);
      expect(can(ownerActor, 'abuse_review')).toBe(true);
    });

    it('can suspend a normal user or an admin', () => {
      expect(can(ownerActor, 'suspend_user', targetNormalUser)).toBe(true);
      expect(can(ownerActor, 'suspend_user', targetAdmin)).toBe(true);
    });

    it('cannot suspend themselves', () => {
      const targetSelf: TargetProfile = { id: ownerActor.id, role: 'owner', status: 'active' };
      expect(can(ownerActor, 'suspend_user', targetSelf)).toBe(false);
    });
  });

  describe('Non-Active Accounts (Suspended / Pending Deletion)', () => {
    it('denies suspended account from performing any action', () => {
      expect(can(suspendedUser, 'use_own_data')).toBe(false);
      expect(can(suspendedUser, 'open_admin_panel')).toBe(false);
    });

    it('denies pending_deletion account from performing any action', () => {
      expect(can(pendingDeletionUser, 'use_own_data')).toBe(false);
      expect(can(pendingDeletionUser, 'open_admin_panel')).toBe(false);
    });

    it('denies null or undefined actor', () => {
      expect(can(null, 'use_own_data')).toBe(false);
      expect(can(undefined, 'use_own_data')).toBe(false);
    });
  });
});
