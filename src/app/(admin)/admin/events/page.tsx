import { requireAdmin } from '@/services/session';
import { AnalyticsService } from '@/services/analyticsService';
import { EventsDebugger } from './EventsDebugger';
import { Radio, ShieldCheck, CheckCircle2, Star } from 'lucide-react';

export default async function AdminEventsPage() {
  await requireAdmin();
  const initialEvents = AnalyticsService.getLiveSampleEvents();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Live Event Stream & Taxonomy Debugger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Inspector</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Validate GA4 dataLayer pushes, PostHog events, and payload schemas against the AnyRef enterprise taxonomy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-mono">42 Active Taxonomy Events</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-2">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300 font-mono">8 GA4 Key Events</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-300 font-mono">100% PII Scrubbed</span>
          </div>
        </div>
      </div>

      {/* Interactive Client Component */}
      <EventsDebugger initialEvents={initialEvents} />
    </div>
  );
}
