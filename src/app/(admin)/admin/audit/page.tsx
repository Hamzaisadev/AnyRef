import { requireAdmin } from '@/services/session';
import { AdminService } from '@/services/adminService';
import { FileText, Shield } from 'lucide-react';

interface AuditLogRow {
  id: number;
  actor_id: string | null;
  action: string;
  target_user_id: string | null;
  target_type: string | null;
  target_id: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
  ip: string | null;
  created_at: string;
}

export default async function AdminAuditLogPage() {
  const profile = await requireAdmin();
  const { logs, total } = await AdminService.getAuditLogs(
    { id: profile.id, role: profile.role, status: profile.status },
    { limit: 100 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
            <FileText className="w-6 h-6 text-slate-300" />
            <span>Immutable Audit Log</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Append-only security log. Database triggers and RLS strictly prevent UPDATE and DELETE operations.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Recorded Events: <strong className="text-white">{total}</strong>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#0F111E] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Target</th>
                <th className="px-5 py-3.5">Reason / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(logs as AuditLogRow[]).map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      {log.action}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-slate-300">
                    {log.actor_id ? log.actor_id.slice(0, 8) + '...' : 'system'}
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-slate-300">
                    {log.target_user_id
                      ? log.target_user_id.slice(0, 8) + '...'
                      : log.target_id || '—'}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-400 max-w-md truncate">
                    {log.reason || '—'}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No audit log records recorded yet.
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
