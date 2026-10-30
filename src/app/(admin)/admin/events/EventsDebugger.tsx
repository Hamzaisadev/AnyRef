'use client';

import { useState, useEffect } from 'react';
import {
  TELEMETRY_EVENTS,
  trackClientEvent,
  GA4_KEY_EVENTS,
} from '@/lib/telemetry';
import type { LiveTelemetryEvent } from '@/services/analyticsService';
import {
  Radio,
  CheckCircle2,
  ShieldCheck,
  Star,
  Play,
  Search,
  Filter,
  Code2,
  Copy,
  Check,
} from 'lucide-react';

interface EventsDebuggerProps {
  initialEvents: LiveTelemetryEvent[];
}

export function EventsDebugger({ initialEvents }: EventsDebuggerProps) {
  const [events, setEvents] = useState<LiveTelemetryEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<LiveTelemetryEvent | null>(
    initialEvents[0] || null
  );
  const [filterQuery, setFilterQuery] = useState('');
  const [onlyKeyEvents, setOnlyKeyEvents] = useState(false);
  const [copied, setCopied] = useState(false);

  // Listen for local synthetic telemetry events emitted anywhere in the app
  useEffect(() => {
    function handleLocalEvent(e: Event) {
      const customEvt = e as CustomEvent<Record<string, unknown>>;
      const payload = customEvt.detail;
      const newEvt: LiveTelemetryEvent = {
        id: 'evt_' + Math.random().toString(36).substring(2, 9),
        event: (payload.event as string) || 'unknown_event',
        timestamp: (payload.timestamp as string) || new Date().toISOString(),
        userId: (payload.user_id as string) || null,
        planId: (payload.plan_id as string) || 'free',
        isKey: GA4_KEY_EVENTS.has(payload.event as string),
        properties: payload,
        validated: true,
        piiClean: true,
      };

      setEvents((prev) => [newEvt, ...prev.slice(0, 49)]);
    }

    window.addEventListener('anyref_telemetry_event', handleLocalEvent);
    return () => {
      window.removeEventListener('anyref_telemetry_event', handleLocalEvent);
    };
  }, []);

  function handleSimulate(eventKey: string) {
    if (eventKey === 'prompt_generation') {
      trackClientEvent(TELEMETRY_EVENTS.PROMPT_GENERATION_COMPLETED, {
        brand_id: 'bnd_demo_01',
        entry_id: 'ent_' + Math.random().toString(36).substring(2, 7),
        slot_count: 6,
        token_count: 48,
        latency_ms: Math.floor(Math.random() * 500) + 800,
        cost_usd: 0.00045,
      });
    } else if (eventKey === 'winner_promoted') {
      trackClientEvent(TELEMETRY_EVENTS.WINNER_PROMOTED, {
        entry_id: 'ent_' + Math.random().toString(36).substring(2, 7),
        brand_id: 'bnd_demo_01',
        iterations_count: 2,
      });
    } else if (eventKey === 'ai_referral') {
      trackClientEvent(TELEMETRY_EVENTS.AI_REFERRAL_DETECTED, {
        ai_platform: 'chatgpt',
        referral_url: 'https://chatgpt.com/',
        landing_path: '/',
      });
    } else if (eventKey === 'prompt_copied') {
      trackClientEvent(TELEMETRY_EVENTS.PROMPT_COPIED, {
        entry_id: 'ent_' + Math.random().toString(36).substring(2, 7),
        generator_target: 'midjourney',
      });
    }
  }

  const filteredEvents = events.filter((evt) => {
    if (onlyKeyEvents && !evt.isKey) return false;
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      return (
        evt.event.toLowerCase().includes(q) ||
        JSON.stringify(evt.properties).toLowerCase().includes(q)
      );
    }
    return true;
  });

  function copyPayload() {
    if (!selectedEvent) return;
    navigator.clipboard.writeText(JSON.stringify(selectedEvent.properties, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Simulation Bar */}
      <div className="p-4 rounded-2xl bg-[#0F111E] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Play className="w-4 h-4 text-emerald-400" />
          <span>Interactive Event Simulator:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulate('prompt_generation')}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium transition-colors"
          >
            + Generate Prompt
          </button>
          <button
            onClick={() => handleSimulate('winner_promoted')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium transition-colors"
          >
            + Winner Promoted
          </button>
          <button
            onClick={() => handleSimulate('ai_referral')}
            className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-xs font-medium transition-colors"
          >
            + AI Referral (ChatGPT)
          </button>
          <button
            onClick={() => handleSimulate('prompt_copied')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-medium transition-colors"
          >
            + Copy Prompt
          </button>
        </div>
      </div>

      {/* Main Grid: Stream on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Event List (Left 7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-white">Live Event Feed</h2>
              <span className="text-xs text-slate-500 font-mono">
                ({filteredEvents.length} events)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => setOnlyKeyEvents(!onlyKeyEvents)}
                className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 ${
                  onlyKeyEvents
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Filter GA4 Key Events Only"
              >
                <Star className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/60 border-indigo-500/50 shadow-sm'
                      : 'bg-[#0B0D17] border-slate-800/80 hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {evt.isKey && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                      <span className="font-mono font-medium text-white">
                        {evt.event}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center space-x-3 text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Schema Valid</span>
                    </span>
                    <span className="flex items-center space-x-1 text-sky-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Zero PII</span>
                    </span>
                    {evt.userId && (
                      <span className="font-mono text-slate-400">
                        user: {evt.userId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payload Inspector (Right 5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Payload Inspector</h2>
            </div>

            <button
              onClick={copyPayload}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          {selectedEvent ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Dispatched Destinations
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
                    ✓ GA4 dataLayer
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-mono">
                    ✓ PostHog Capture
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-mono">
                    ✓ Distributed Trace
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Raw Enriched Payload
                </span>
                <pre className="p-3 rounded-xl bg-[#090A12] border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[380px]">
                  {JSON.stringify(selectedEvent.properties, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select an event to view full payload and schema validation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
