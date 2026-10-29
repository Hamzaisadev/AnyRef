-- ====================================================================
-- 0002_roles_plans.sql: Public Multi-Tenant Roles, Plans, and RBAC
-- ====================================================================

-- 1. Enums for Roles and Account Lifecycle
do $$ begin
  create type app_role as enum ('owner', 'admin', 'user');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type account_status as enum ('active', 'suspended', 'pending_deletion');
exception
  when duplicate_object then null;
end $$;

-- 2. Plans Table
create table if not exists plans (
  id text primary key,                        -- 'free' | 'plus'
  name text not null,
  price_usd_month numeric(8, 2) not null default 0,
  price_usd_year  numeric(8, 2) not null default 0,
  limits jsonb not null,
  show_ads boolean not null,
  is_active boolean not null default true
);

-- Seed Free and Plus plans
insert into plans (id, name, price_usd_month, price_usd_year, limits, show_ads)
values
  ('free', 'Free', 0, 0,
   '{"max_brands":2,"max_entries":50,"max_storage_mb":200,"generate_per_day":5,"autofill_per_day":5,"batch_max":1}'::jsonb, true),
  ('plus', 'Plus', 5, 48,
   '{"max_brands":10,"max_entries":2000,"max_storage_mb":5000,"generate_per_day":50,"autofill_per_day":100,"batch_max":10}'::jsonb, false)
on conflict (id) do update set
  limits = excluded.limits,
  show_ads = excluded.show_ads;

-- 3. Profiles Table
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  status account_status not null default 'active',
  plan_id text not null default 'free' references plans(id),
  plan_source text not null default 'default' check (plan_source in ('default', 'subscription', 'comp')),
  comp_until timestamptz,
  tos_version text,
  tos_accepted_at timestamptz,
  age_confirmed_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now()
);

-- Exactly one owner enforced by partial unique index
create unique index if not exists one_owner on profiles (role) where role = 'owner';

-- 4. Subscriptions & Webhook Idempotency Tables
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text not null,
  provider_subscription_id text not null unique,
  plan_id text not null references plans(id),
  status text not null,                       -- active | past_due | canceled
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_event_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists webhook_events (
  provider text not null,
  event_id text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  payload jsonb not null,
  primary key (provider, event_id)
);

-- 5. Quota Overrides Table
create table if not exists quota_overrides (
  user_id uuid primary key references auth.users(id) on delete cascade,
  limits jsonb not null,
  reason text not null,
  set_by uuid not null references auth.users(id),
  expires_at timestamptz
);

-- 6. Global App Settings Table
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- Seed initial default app settings
insert into app_settings (key, value)
values
  ('ai_kill_switch', 'false'::jsonb),
  ('signups_enabled', 'true'::jsonb),
  ('ads_enabled_global', 'true'::jsonb),
  ('global_daily_cost_cap_usd', '50.0'::jsonb),
  ('maintenance_mode', 'false'::jsonb)
on conflict (key) do nothing;

-- 7. Immutable Append-Only Audit Log
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  target_user_id uuid,
  target_type text,
  target_id text,
  before jsonb,
  after jsonb,
  reason text,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Prevent tampering with audit log: strictly revoke update and delete
revoke update, delete on audit_log from public, anon, authenticated;

-- 8. Consent Records Table
create table if not exists consent_records (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('tos', 'privacy', 'ads_personalized', 'ads_basic')),
  version text not null,
  granted boolean not null,
  created_at timestamptz not null default now()
);

-- 9. Globalize System Prompts (Drop user ownership, platform-managed)
alter table if exists system_prompts
  drop constraint if exists system_prompts_user_id_fkey,
  drop constraint if exists system_prompts_user_id_purpose_version_key;

alter table if exists system_prompts
  alter column user_id drop not null,
  add column if not exists updated_by uuid references auth.users(id);

create unique index if not exists idx_system_prompts_purpose_version
  on system_prompts (purpose, version);

-- 10. Authorization & Limit Functions (in SQL for tamper-proof enforcement)

-- Check if authenticated user has one of the specified roles
create or replace function public.has_role(variadic roles app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid()
      and status = 'active'
      and role = any(roles)
  );
$$;

-- Resolve effective numeric limit: null = unlimited (owner/admin), else override > plan
create or replace function public.effective_limit(uid uuid, key text) returns numeric
language plpgsql stable security definer set search_path = public as $$
declare
  r app_role;
  v numeric;
begin
  select role into r from profiles where user_id = uid;
  if r in ('owner', 'admin') then
    return null; -- Unlimited for staff
  end if;

  -- Check unexpired override
  select (o.limits ->> key)::numeric into v from quota_overrides o
  where o.user_id = uid and (o.expires_at is null or o.expires_at > now());
  if v is not null then
    return v;
  end if;

  -- Fall back to active plan limit
  select (pl.limits ->> key)::numeric into v
  from profiles p
  join plans pl on pl.id = p.plan_id
  where p.user_id = uid;

  return v;
end;
$$;

-- Brand creation limit trigger
create or replace function enforce_brand_limit() returns trigger
language plpgsql as $$
declare
  lim numeric;
begin
  lim := effective_limit(new.user_id, 'max_brands');
  if lim is not null and (select count(*) from brands where user_id = new.user_id) >= lim then
    raise exception 'LIMIT_MAX_BRANDS' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists brands_limit on brands;
create trigger brands_limit
before insert on brands
for each row execute function enforce_brand_limit();

-- 11. Automatic Profile Creation on User Sign-Up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, role, status, plan_id, plan_source)
  values (new.id, 'user', 'active', 'free', 'default')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 12. Prevent Owner Role Tampering in Profiles
create or replace function protect_owner_role() returns trigger
language plpgsql as $$
begin
  -- Only allowed if current session setting 'app.allow_owner_change' is explicitly 'on'
  if (old.role = 'owner' or new.role = 'owner') and current_setting('app.allow_owner_change', true) is distinct from 'on' then
    raise exception 'OWNER_ROLE_LOCKED: Owner role modification is restricted to bootstrap script' using errcode = 'P0002';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_owner on profiles;
create trigger trg_protect_owner
before update on profiles
for each row execute function protect_owner_role();

-- ====================================================================
-- Row Level Security (RLS) Updates for Multi-Tenant & Admin Roles
-- ====================================================================

alter table profiles enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table webhook_events enable row level security;
alter table quota_overrides enable row level security;
alter table app_settings enable row level security;
alter table audit_log enable row level security;
alter table consent_records enable row level security;

-- Plans are public read-only
create policy "plans_select_all" on plans for select using (true);

-- Profiles Policies
create policy "profiles_select_own" on profiles for select
  using (user_id = auth.uid() or has_role('owner', 'admin'));

-- Notice: Standard users get NO update policy on profiles.
-- Role, plan, and status can only be modified through service-role server client.

-- Audit Log Policies: Staff read-only; mutations denied
create policy "audit_log_select_staff" on audit_log for select
  using (has_role('owner', 'admin'));

-- Quota Overrides Policies
create policy "quota_overrides_select_staff" on quota_overrides for select
  using (user_id = auth.uid() or has_role('owner', 'admin'));

-- App Settings Policies
create policy "app_settings_select_all" on app_settings for select using (true);
create policy "app_settings_update_staff" on app_settings for update
  using (has_role('owner', 'admin'))
  with check (has_role('owner', 'admin'));

-- Subscriptions Policies
create policy "subscriptions_select_own" on subscriptions for select
  using (user_id = auth.uid() or has_role('owner', 'admin'));

-- Consent Records Policies
create policy "consent_records_select_own" on consent_records for select
  using (user_id = auth.uid() or has_role('owner', 'admin'));
create policy "consent_records_insert_own" on consent_records for insert
  with check (user_id = auth.uid());

-- System Prompts: Staff read/write
drop policy if exists "system_prompts_select_own" on system_prompts;
drop policy if exists "system_prompts_insert_own" on system_prompts;
drop policy if exists "system_prompts_update_own" on system_prompts;
drop policy if exists "system_prompts_delete_own" on system_prompts;

create policy "system_prompts_select_staff" on system_prompts for select
  using (has_role('owner', 'admin'));
create policy "system_prompts_modify_owner" on system_prompts for all
  using (has_role('owner'))
  with check (has_role('owner'));

-- Privacy Boundary: Ensure admins CANNOT read user brands, entries, or storage images
-- Existing policies on brands, entries, storage objects remain strictly locked to (user_id = auth.uid()).
