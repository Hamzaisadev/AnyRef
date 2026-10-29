import { requireAdmin } from '@/services/session';
import { createClient } from '@/lib/supabaseServer';
import { can } from '@/services/authz';
import { ForbiddenError } from '@/lib/errors';
import { Shield, UserPlus, UserMinus, ShieldAlert } from 'lucide-react';
import { promoteDemoteAdminAction } from '../actions';

interface StaffProfile {
  user_id: string;
  role: 'owner' | 'admin' | 'user';
  status: string;
  created_at: string;
}

export default async function AdminStaffPage() {
  const profile = await requireAdmin();

  if (!can({ id: profile.id, role: profile.role, status: profile.status }, 'promote_demote_admin')) {
    throw new ForbiddenError('Owner privileges required to manage administrative staff.');
  }

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from('profiles')
    .select('user_id, role, status, created_at')
    .in('role', ['owner', 'admin'])
    .order('role', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
          <Shield className="w-6 h-6 text-purple-400" />
          <span>Staff Privileges & Administrative Roles</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Owner-only staff controls. Platform invariant: Exactly one owner exists, protected by PostgreSQL unique partial index.
        </p>
      </div>

      {/* Staff List */}
      <div className="rounded-2xl bg-[#0F111E] border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Current Administrative Staff
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {staff?.length || 0} Staff Member(s)
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 font-sans">
          {(staff as StaffProfile[] || []).map((member) => (
            <div
              key={member.user_id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    member.role === 'owner'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {member.role === 'owner' ? 'OW' : 'AD'}
                </div>
                <div>
                  <div className="font-mono text-xs text-white font-medium">
                    {member.user_id}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Added {new Date(member.created_at).toLocaleDateString()} • Status:{' '}
                    <span className="text-emerald-400 font-medium">{member.status}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                {member.role === 'admin' ? (
                  <form
                    action={async () => {
                      'use server';
                      await promoteDemoteAdminAction(
                        member.user_id,
                        'user',
                        'Demoted from admin by owner'
                      );
                    }}
                  >
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Demote to User</span>
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-amber-400 font-mono font-semibold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                    Primary Owner
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promote User Form */}
      <div className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-4 max-w-xl">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <span>Promote Existing User to Administrator</span>
        </h2>

        <form
          action={async (formData: FormData) => {
            'use server';
            const targetUserId = formData.get('userId') as string;
            const reason = (formData.get('reason') as string) || 'Promoted to admin by platform owner';
            await promoteDemoteAdminAction(targetUserId, 'admin', reason);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              User UUID
            </label>
            <input
              type="text"
              name="userId"
              required
              placeholder="e.g. 11111111-2222-3333-4444-555555555555"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Promotion Justification
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="e.g. Appointed as Operations Moderator"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Promote User to Admin
          </button>
        </form>
      </div>
    </div>
  );
}
