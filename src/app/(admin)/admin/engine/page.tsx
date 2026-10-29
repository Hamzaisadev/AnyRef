import { requireAdmin } from '@/services/session';
import { createClient } from '@/lib/supabaseServer';
import { can } from '@/services/authz';
import { ForbiddenError } from '@/lib/errors';
import { Cpu, ShieldCheck, History, Save } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/data/auditRepo';

interface SystemPromptRow {
  id: string;
  purpose: string;
  version: number;
  body: string;
  created_at: string;
}

export default async function AdminEnginePage() {
  const profile = await requireAdmin();

  if (!can({ id: profile.id, role: profile.role, status: profile.status }, 'edit_system_prompts')) {
    throw new ForbiddenError('Owner privileges required to inspect or modify the prompt engine.');
  }

  const supabase = await createClient();
  const { data: prompts } = await supabase
    .from('system_prompts')
    .select('*')
    .order('purpose', { ascending: true })
    .order('version', { ascending: false });

  async function updatePromptAction(formData: FormData) {
    'use server';
    const currentProfile = await requireAdmin();
    if (!can({ id: currentProfile.id, role: currentProfile.role, status: currentProfile.status }, 'edit_system_prompts')) {
      throw new ForbiddenError('Only the platform owner can deploy engine prompts.');
    }

    const purpose = formData.get('purpose') as string;
    const body = formData.get('body') as string;
    const client = await createClient();

    // Get current max version
    const { data: latest } = await client
      .from('system_prompts')
      .select('version')
      .eq('purpose', purpose)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latest?.version || 1) + 1;

    await client.from('system_prompts').insert({
      purpose,
      version: nextVersion,
      body,
      updated_by: currentProfile.id,
    });

    await logAuditEvent({
      actor_id: currentProfile.id,
      action: 'engine_prompt_deployed',
      target_type: 'system_prompt',
      target_id: `${purpose}:v${nextVersion}`,
      after: { purpose, version: nextVersion },
      reason: `Deployed engine prompt v${nextVersion} for ${purpose}`,
    });

    revalidatePath('/admin/engine');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
          <Cpu className="w-6 h-6 text-indigo-400" />
          <span>Prompt Engine Architecture</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Rule 6: The prompt engine is the proprietary core product. System prompts are server-only, never sent to clients, never logged to telemetry, and editable exclusively by the platform owner.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {['deconstruct', 'autofill'].map((purposeKey) => {
          const matching = (prompts as SystemPromptRow[] || []).filter((p) => p.purpose === purposeKey);
          const activePrompt = matching[0] || {
            purpose: purposeKey,
            version: 1,
            body: `You are the Anyref Prompt Engine for ${purposeKey}. Return strictly valid JSON adhering to schema.`,
          };

          return (
            <form
              key={purposeKey}
              action={updatePromptAction}
              className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-4 flex flex-col justify-between"
            >
              <input type="hidden" name="purpose" value={purposeKey} />

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white capitalize">
                      {purposeKey} System Prompt
                    </h2>
                    <span className="text-xs text-indigo-400 font-mono">
                      Active: v{activePrompt.version}
                    </span>
                  </div>
                  <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono border border-indigo-500/30">
                    Platform Secret
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Engine Instructions & Constraints
                  </label>
                  <textarea
                    name="body"
                    rows={12}
                    defaultValue={activePrompt.body}
                    required
                    className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>{matching.length} version(s) in database</span>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center space-x-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Deploy New Version</span>
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
