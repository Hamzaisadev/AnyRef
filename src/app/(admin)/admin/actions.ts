'use server';

import { requireAdmin } from '@/services/session';
import { AdminService } from '@/services/adminService';
import { revalidatePath } from 'next/cache';

export async function toggleSettingAction(
  key: 'ai_kill_switch' | 'signups_enabled' | 'maintenance_mode' | 'ads_enabled_global',
  value: boolean,
  reason: string
) {
  const profile = await requireAdmin();
  await AdminService.setAppSetting(
    { id: profile.id, role: profile.role, status: profile.status },
    key,
    value,
    reason || `Admin toggled ${key} to ${value}`
  );
  revalidatePath('/admin');
}

export async function suspendUserAction(targetUserId: string, reason: string) {
  const profile = await requireAdmin();
  await AdminService.suspendUser(
    { id: profile.id, role: profile.role, status: profile.status },
    targetUserId,
    reason
  );
  revalidatePath('/admin/users');
}

export async function unsuspendUserAction(targetUserId: string, reason: string) {
  const profile = await requireAdmin();
  await AdminService.unsuspendUser(
    { id: profile.id, role: profile.role, status: profile.status },
    targetUserId,
    reason
  );
  revalidatePath('/admin/users');
}

export async function grantCompPlanAction(
  targetUserId: string,
  planId: string,
  reason: string,
  until?: string | null
) {
  const profile = await requireAdmin();
  await AdminService.grantCompPlan(
    { id: profile.id, role: profile.role, status: profile.status },
    targetUserId,
    { planId, reason, until }
  );
  revalidatePath('/admin/users');
}

export async function setQuotaOverrideAction(
  targetUserId: string,
  limits: Record<string, number>,
  reason: string,
  expiresAt?: string | null
) {
  const profile = await requireAdmin();
  await AdminService.setQuotaOverride(
    { id: profile.id, role: profile.role, status: profile.status },
    targetUserId,
    { limits, reason, expiresAt }
  );
  revalidatePath('/admin/users');
}

export async function promoteDemoteAdminAction(
  targetUserId: string,
  newRole: 'admin' | 'user',
  reason: string
) {
  const profile = await requireAdmin();
  await AdminService.promoteDemoteAdmin(
    { id: profile.id, role: profile.role, status: profile.status },
    targetUserId,
    newRole,
    reason
  );
  revalidatePath('/admin/staff');
}
