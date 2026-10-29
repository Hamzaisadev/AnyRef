import { createBrowserClient } from '@supabase/ssr';
import { getClientEnv } from './clientEnv';

export function createBrowserClientInstance() {
  const env = getClientEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
