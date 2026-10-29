/**
 * scripts/bootstrap-owner.ts
 *
 * Bootstraps the root platform owner account using OWNER_EMAIL.
 * Exactly one owner can exist; guarded by a database partial unique index.
 *
 * Usage:
 *   pnpm tsx scripts/bootstrap-owner.ts [email]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function bootstrapOwner() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const targetEmail = process.argv[2] || process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  if (!targetEmail) {
    console.error('❌ Please specify owner email via argument or OWNER_EMAIL environment variable.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log(`🔍 Locating user with email: ${targetEmail}...`);

  // 1. Check existing users in auth.users
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  let user = usersData.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());

  if (!user) {
    console.log(`ℹ️ User "${targetEmail}" does not exist yet. Creating auth user...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: targetEmail,
      email_confirm: true,
    });

    if (createError || !newUser.user) {
      console.error('❌ Failed to create user:', createError?.message);
      process.exit(1);
    }
    user = newUser.user;
    console.log(`✅ Created auth user with ID: ${user.id}`);
  } else {
    console.log(`✅ Found existing auth user: ${user.id}`);
  }

  // 2. Set session configuration and update profiles to owner
  console.log(`👑 Promoting user ${user.id} to root owner...`);

  // Execute owner promotion
  let profileError: { message: string } | null = null;
  try {
    const { error: rpcError } = await supabase.rpc('set_claim_or_run_sql', {
      sql_query: `
        set local "app.allow_owner_change" = 'on';
        insert into public.profiles (user_id, role, status, plan_id, plan_source)
        values ('${user.id}', 'owner', 'active', 'free', 'default')
        on conflict (user_id) do update set
          role = 'owner',
          status = 'active';
      `,
    });
    if (rpcError) {
      // Fallback: direct upsert using service role key
      const { error: upsertError } = await supabase.from('profiles').upsert({
        user_id: user.id,
        role: 'owner',
        status: 'active',
        plan_id: 'free',
        plan_source: 'default',
      });
      profileError = upsertError;
    }
  } catch {
    const { error: fallbackError } = await supabase.from('profiles').upsert({
      user_id: user.id,
      role: 'owner',
      status: 'active',
      plan_id: 'free',
      plan_source: 'default',
    });
    profileError = fallbackError;
  }

  if (profileError) {
    console.error('❌ Failed to update owner profile:', profileError.message);
    process.exit(1);
  }

  console.log(`🎉 Success! User "${targetEmail}" (${user.id}) is now the official platform root owner.`);
}

bootstrapOwner().catch((err) => {
  console.error('❌ Bootstrap failed with exception:', err);
  process.exit(1);
});
