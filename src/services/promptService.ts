import { createAdminClient } from '../lib/supabaseServer';
import {
  DEFAULT_GENERATE_SYSTEM_PROMPT,
  DEFAULT_AUTOFILL_SYSTEM_PROMPT,
} from '../ai/geminiProvider';

export interface ActiveSystemPrompt {
  version: number | null;
  body: string;
}

interface CacheEntry {
  prompt: ActiveSystemPrompt;
  cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const promptCache = new Map<string, CacheEntry>();

/**
 * Loads the active system prompt from the database system_prompts table.
 * Caches in-memory with a 5-minute TTL.
 * Falls back to default static prompts if no versioned prompt is in DB.
 * System prompt body NEVER leaves the server (Hard Rule 5).
 */
export async function getActiveSystemPrompt(
  purpose: 'generate' | 'autofill'
): Promise<ActiveSystemPrompt> {
  const cached = promptCache.get(purpose);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.prompt;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('system_prompts')
      .select('version, body')
      .eq('purpose', purpose)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const activePrompt: ActiveSystemPrompt = {
        version: data.version,
        body: data.body,
      };
      promptCache.set(purpose, { prompt: activePrompt, cachedAt: Date.now() });
      return activePrompt;
    }
  } catch {
    // If DB read fails, fall back gracefully to default static prompt
  }

  const defaultPrompt: ActiveSystemPrompt = {
    version: null,
    body:
      purpose === 'generate'
        ? DEFAULT_GENERATE_SYSTEM_PROMPT
        : DEFAULT_AUTOFILL_SYSTEM_PROMPT,
  };

  return defaultPrompt;
}

export function clearPromptCache(): void {
  promptCache.clear();
}
