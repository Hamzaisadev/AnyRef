/**
 * scripts/promote-user.ts
 *
 * Promotes any user to 'owner' or 'admin', or lists all registered users.
 *
 * Usage:
 *   npx tsx scripts/promote-user.ts [email] [role: owner|admin]
 *   Example: npx tsx scripts/promote-user.ts admin@example.com owner
 *   Listing: npx tsx scripts/promote-user.ts --list
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const arg1 = process.argv[2];
  const targetRole = (process.argv[3] || 'owner').toLowerCase() as 'owner' | 'admin';

  // 1. List users if requested or if no argument
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Failed to fetch users:', listError.message);
    process.exit(1);
  }

  const users = usersData.users || [];

  if (!arg1 || arg1 === '--list') {
    console.log(`\n📋 Registered Users in Database (${users.length} total):`);
    console.log('---------------------------------------------------------');

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, role, status, plan_id');

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    for (const u of users) {
      const p = profileMap.get(u.id);
      console.log(
        `• ${u.email} | ID: ${u.id} | Role: ${p?.role || 'user'} | Status: ${
          p?.status || 'active'
        } | Plan: ${p?.plan_id || 'free'}`
      );
    }
    console.log('---------------------------------------------------------');
    console.log('To promote a user to admin or owner, run:');
    console.log('  npx tsx scripts/promote-user.ts <email> [owner|admin]\n');
    return;
  }

  const targetEmail = arg1.toLowerCase();
  console.log(`🔍 Searching for user with email: ${targetEmail}...`);

  let user = users.find((u) => u.email?.toLowerCase() === targetEmail);

  if (!user) {
    console.log(`ℹ️ User "${targetEmail}" does not exist in auth.users. Creating account...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: targetEmail,
      email_confirm: true,
      user_metadata: { role: targetRole },
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

  // If promoting to owner, there can only be one owner in the database.
  // Demote previous owner and use delete-then-insert to avoid the before-update trigger.
  if (targetRole === 'owner') {
    const { data: currentOwners } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'owner');

    for (const owner of currentOwners || []) {
      if (owner.user_id !== user.id) {
        console.log(`ℹ️ Demoting previous owner (${owner.user_id}) to admin...`);
        await supabase.from('profiles').delete().eq('user_id', owner.user_id);
        await supabase.from('profiles').insert({
          user_id: owner.user_id,
          role: 'admin',
          status: 'active',
          plan_id: 'plus',
          plan_source: 'default',
        });
      }
    }

    // Delete existing profile and insert cleanly with role 'owner'
    await supabase.from('profiles').delete().eq('user_id', user.id);
    const { error: insertError } = await supabase.from('profiles').insert({
      user_id: user.id,
      role: 'owner',
      status: 'active',
      plan_id: 'plus',
      plan_source: 'default',
    });

    if (insertError) {
      console.error('❌ Failed to set owner role:', insertError.message);
      process.exit(1);
    }
  } else {
    // Update or insert standard profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: user.id,
      role: targetRole,
      status: 'active',
      plan_id: 'free',
      plan_source: 'default',
    });

    if (profileError) {
      console.error('❌ Failed to set profile role:', profileError.message);
      process.exit(1);
    }
  }

  console.log(`\n🎉 Success! User "${targetEmail}" is now a Platform ${targetRole.toUpperCase()}!`);
  console.log(`You can now log in at http://localhost:3000/login and access:`);
  console.log(`  • Admin Overview:      http://localhost:3000/admin`);
  console.log(`  • Funnel Analytics:    http://localhost:3000/admin/analytics`);
  console.log(`  • System & LLM Traces: http://localhost:3000/admin/observability`);
  console.log(`  • Live Event Stream:   http://localhost:3000/admin/events\n`);
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
