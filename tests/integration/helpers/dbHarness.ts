import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import type { Database } from '@/types/database.types';

// Load environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !serviceKey || !anonKey) {
  throw new Error('Integration test harness requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

const createdUserIds = new Set<string>();

/**
 * Returns a privileged Supabase client using the service role key.
 */
export function adminClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl!, serviceKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Returns an unauthenticated or token-authenticated public/user Supabase client.
 */
export function asUser(token?: string): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl!, anonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });
}

export interface TestUserResult {
  user: User;
  token: string;
  client: SupabaseClient<Database>;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'owner';
}

/**
 * Creates a real user in Supabase Auth, seeds their profile, and returns an authenticated client.
 */
export async function createTestUser(
  role: 'user' | 'admin' | 'owner' = 'user'
): Promise<TestUserResult> {
  const admin = adminClient();
  const unique = Math.random().toString(36).substring(2, 10);
  const email = `test-${role}-${unique}@anyref-test.internal`;
  const password = `TestP@ss-${unique}-2026!`;

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user in Auth: ${authError?.message}`);
  }

  const user = authData.user;
  createdUserIds.add(user.id);

  // 2. Sign in to obtain a valid access token
  const authClient = asUser();
  const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    throw new Error(`Failed to sign in test user: ${signInError?.message}`);
  }

  const token = signInData.session.access_token;
  const userClient = asUser(token);

  // 3. Ensure profile role is configured
  if (role !== 'user') {
    // If owner role is requested, temporarily enable the session flag in SQL if needed
    const { error: profileErr } = await admin
      .from('profiles')
      .update({ role, status: 'active' })
      .eq('user_id', user.id);

    if (profileErr) {
      console.warn(`Could not set role ${role} on profile ${user.id}:`, profileErr.message);
    }
  }

  return {
    user,
    token,
    client: userClient,
    email,
    password,
    role,
  };
}

/**
 * Cleans up all test entities and users created during the test run.
 */
export async function resetDb(): Promise<void> {
  const admin = adminClient();

  for (const userId of Array.from(createdUserIds)) {
    try {
      // Cascade handles brands, entries, ai_usage, profiles via foreign keys
      await admin.auth.admin.deleteUser(userId);
    } catch (err) {
      console.warn(`Error deleting test user ${userId}:`, err);
    }
    createdUserIds.delete(userId);
  }
}
