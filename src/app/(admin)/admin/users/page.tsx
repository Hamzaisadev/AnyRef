import { requireAdmin } from '@/services/session';
import { AdminService } from '@/services/adminService';
import { Users, Shield, UserX, UserCheck, Gift, Sliders } from 'lucide-react';
import {
  suspendUserAction,
  unsuspendUserAction,
  grantCompPlanAction,
  setQuotaOverrideAction,
} from '../actions';

interface PageProps {
  searchParams: Promise<{
    role?: string;
    status?: string;
    plan?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const profile = await requireAdmin();
  const params = await searchParams;

  const { users, total } = await AdminService.listUsers(
    { id: profile.id, role: profile.role, status: profile.status },
    {
      role: params.role,
      status: params.status,
      planId: params.plan,
      limit: 50,
    }
  );

  const isOwner = profile.role === 'owner';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Users & Quotas</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage multi-tenant accounts, enforce role boundaries, apply quota overrides, and grant comps.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Total Users: <strong className="text-white">{total}</strong>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="rounded-2xl bg-[#0F111E] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">User ID</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Plan</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {users.map((u) => {
                const canAct =
                  isOwner || (profile.role === 'admin' && u.role === 'user');

                return (
                  <tr key={u.user_id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-200">
                      {u.user_id}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                          u.role === 'owner'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : u.status === 'suspended'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-semibold text-xs capitalize ${
                            u.plan_id === 'plus' ? 'text-primary' : 'text-slate-300'
                          }`}
                        >
                          {u.plan_id}
                        </span>
                        {u.plan_source === 'comp' && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                            comp
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {canAct && u.user_id !== profile.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          {/* Suspend / Unsuspend */}
                          {u.status === 'active' ? (
                            <form
                              action={async (formData: FormData) => {
                                'use server';
                                const reason =
                                  (formData.get('reason') as string) ||
                                  'Suspended by administrator via control panel';
                                await suspendUserAction(u.user_id, reason);
                              }}
                              className="inline-flex"
                            >
                              <input type="hidden" name="reason" value="Suspended via admin panel" />
                              <button
                                type="submit"
                                className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium transition-colors flex items-center space-x-1"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </button>
                            </form>
                          ) : (
                            <form
                              action={async (formData: FormData) => {
                                'use server';
                                const reason =
                                  (formData.get('reason') as string) ||
                                  'Unsuspended by administrator';
                                await unsuspendUserAction(u.user_id, reason);
                              }}
                              className="inline-flex"
                            >
                              <input type="hidden" name="reason" value="Unsuspended via admin panel" />
                              <button
                                type="submit"
                                className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-medium transition-colors flex items-center space-x-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </button>
                            </form>
                          )}

                          {/* Grant Plus Comp */}
                          {u.plan_id !== 'plus' && (
                            <form
                              action={async () => {
                                'use server';
                                await grantCompPlanAction(
                                  u.user_id,
                                  'plus',
                                  'Granted complimentary Plus plan by administrator'
                                );
                              }}
                              className="inline-flex"
                            >
                              <button
                                type="submit"
                                className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-medium transition-colors flex items-center space-x-1"
                              >
                                <Gift className="w-3.5 h-3.5" />
                                <span>Comp Plus</span>
                              </button>
                            </form>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No users matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
