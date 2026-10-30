import { requireAdmin } from '@/services/session';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  CreditCard,
  Cpu,
  BarChart3,
  FileText,
  Shield,
  ArrowLeft,
  Activity,
  Radio,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Anyref Platform Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const isOwner = profile.role === 'owner';

  return (
    <div className="min-h-screen bg-[#07080D] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800/80 bg-[#0C0E17] flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">Anyref Admin</span>
              <span className="text-[11px] text-amber-400 font-mono uppercase tracking-wider block">
                {profile.role}
              </span>
            </div>
          </div>
          <Link
            href="/library"
            title="Return to App Studio"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <nav className="p-3 space-y-1 text-sm font-medium flex-1">
          <Link
            href="/admin"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Overview</span>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <Users className="w-4 h-4 text-slate-400" />
            <span>Users & Quotas</span>
          </Link>

          <Link
            href="/admin/abuse"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Abuse Review</span>
          </Link>

          <Link
            href="/admin/cost"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>Cost & Limits</span>
          </Link>

          <Link
            href="/admin/audit"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Audit Log</span>
          </Link>

          <div className="pt-3 mt-3 border-t border-slate-800/80">
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Analytics & Observability
            </span>

            <Link
              href="/admin/analytics"
              className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Funnel Analytics</span>
            </Link>

            <Link
              href="/admin/observability"
              className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>System & LLM Tracing</span>
            </Link>

            <Link
              href="/admin/events"
              className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Live Event Stream</span>
            </Link>
          </div>

          {isOwner && (
            <div className="pt-4 mt-4 border-t border-slate-800/80">
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Owner Controls
              </span>

              <Link
                href="/admin/plans"
                className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Plans & Pricing</span>
              </Link>

              <Link
                href="/admin/engine"
                className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Prompt Engine</span>
              </Link>

              <Link
                href="/admin/staff"
                className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Staff & Roles</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
          Anyref Internal Control • v1.0.0
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
