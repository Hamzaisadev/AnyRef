import { createClient } from '../lib/supabaseServer';
import { UnauthorizedError } from '../lib/errors';
import type { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    throw new UnauthorizedError('Authentication required to access this resource.');
  }
  return user;
}
