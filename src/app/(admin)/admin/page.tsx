import { requireAdmin } from '@/services/session';
import { AdminService } from '@/services/adminService';
import {
  Users,
  CreditCard,
  Zap,
  DollarSign,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';
import { toggleSettingAction } from './actions';

export default async function AdminOverviewPage() {
  const profile = await requireAdmin();
  const metrics = await AdminService.getOverviewMetrics({
    id: profile.id,
    role: profile.role,
    status: profile.status,
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-tenant platform metrics, AI call telemetry, and safety controls.
          </p>
        </div>

        {/* Global Kill Switch Banner / Status */}
        <div className="flex items-center space-x-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                metrics.aiKillSwitch ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="font-semibold text-slate-200">
              AI Engine: {metrics.aiKillSwitch ? 'KILL SWITCH ACTIVE' : 'Operational'}
            </span>
          </div>
        </div>
      </div>

      {/* Safety Controls Card */}
      <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Radio className="w-4 h-4 text-primary" />
          <span>Global Emergency & Operational Flags</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* AI Kill Switch Toggle */}
          <form
            action={async () => {
              'use server';
              await toggleSettingAction(
                'ai_kill_switch',
                !metrics.aiKillSwitch,
                'Toggled via Overview dashboard'
              );
            }}
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-300 block">AI Kill Switch</span>
              <span className="text-[11px] text-slate-400">Halts all model inference</span>
            </div>
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                metrics.aiKillSwitch
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {metrics.aiKillSwitch ? 'Disable Kill' : 'Trip Switch'}
            </button>
          </form>

          {/* Signups Toggle */}
          <form
            action={async () => {
              'use server';
              await toggleSettingAction(
                'signups_enabled',
                !metrics.signupsEnabled,
                'Toggled signups via Overview'
              );
            }}
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Open Sign-ups</span>
              <span className="text-[11px] text-slate-400">Allow new public registrations</span>
            </div>
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                metrics.signupsEnabled
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {metrics.signupsEnabled ? 'Open' : 'Paused'}
            </button>
          </form>

          {/* Maintenance Mode */}
          <form
            action={async () => {
              'use server';
              await toggleSettingAction(
                'maintenance_mode',
                !metrics.maintenanceMode,
                'Toggled maintenance mode'
              );
            }}
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Maintenance</span>
              <span className="text-[11px] text-slate-400">System maintenance banner</span>
            </div>
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                metrics.maintenanceMode
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {metrics.maintenanceMode ? 'Active' : 'Off'}
            </button>
          </form>

          {/* Global Ads Switch */}
          <form
            action={async () => {
              'use server';
              await toggleSettingAction(
                'ads_enabled_global',
                !metrics.adsEnabledGlobal,
                'Toggled global ads'
              );
            }}
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Global Ad Slots</span>
              <span className="text-[11px] text-slate-400">Render ads on free tier</span>
            </div>
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                metrics.adsEnabledGlobal
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {metrics.adsEnabledGlobal ? 'Serving' : 'Disabled'}
            </button>
          </form>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{metrics.totalUsers}</div>
          <div className="text-xs text-slate-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{metrics.activeUsers} active accounts</span>
          </div>
        </div>

        {/* Plus Plan Subscribers */}
        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Plus Subscribers</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{metrics.plusSubscribers}</div>
          <div className="text-xs text-slate-400">
            ~${metrics.plusSubscribers * 5}/mo estimated MRR
          </div>
        </div>

        {/* AI Calls (Today & 7d) */}
        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">AI Generations</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{metrics.aiCallsToday}</div>
          <div className="text-xs text-slate-400 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{metrics.aiCalls7d} calls in last 7 days</span>
          </div>
        </div>

        {/* Estimated AI Spend */}
        <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Estimated Model Spend</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${metrics.estimatedCostTodayUsd.toFixed(3)}
          </div>
          <div className="text-xs text-slate-400">
            ${metrics.estimatedCost7dUsd.toFixed(3)} in last 7 days
          </div>
        </div>
      </div>
    </div>
  );
}
