-- ====================================================================
-- 0001_init.sql: Core schema, RLS policies, and Storage buckets
-- ====================================================================

create extension if not exists pgcrypto;

-- 1. Helper function for updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Brands Table
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  what_you_sell text not null default '',
  why text not null default '',
  tone text not null default '',
  colors text[] not null default '{}',
  wordmark text not null default '',
  logo_path text,
  footer_text text not null default '',
  slogan text not null default '',
  never_do_rules text not null default '',
  default_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_brands_updated_at
before update on brands
for each row execute function update_updated_at_column();

-- 3. Entry Status Enum & Entries Table
do $$ begin
  create type entry_status as enum ('draft', 'winner', 'needs_tweak', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  reference_path text,
  result_path text,
  prompt_template text not null,
  slots jsonb not null default '[]'::jsonb,
  status entry_status not null default 'draft',
  poster_type text,
  intended_product_shape text,
  note text not null default '',
  parent_entry_id uuid references entries(id) on delete set null,
  system_prompt_version int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entries_user_brand_status on entries (user_id, brand_id, status);

create trigger update_entries_updated_at
before update on entries
for each row execute function update_updated_at_column();

-- 4. Versioned Engine System Prompts
create table if not exists system_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version int not null,
  purpose text not null check (purpose in ('generate', 'autofill')),
  body text not null,
  created_at timestamptz not null default now(),
  unique (user_id, purpose, version)
);

-- 5. AI Usage Tracking (Quotas and Cost Controls)
create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('generate', 'autofill')),
  input_tokens int,
  output_tokens int,
  est_cost_usd numeric(10, 5),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_user_created on ai_usage (user_id, created_at);

-- ====================================================================
-- Row Level Security (RLS) - ADR 0002 Enforcement
-- ====================================================================

-- Enable RLS on all tables
alter table brands enable row level security;
alter table entries enable row level security;
alter table system_prompts enable row level security;
alter table ai_usage enable row level security;

-- Brands Policies
create policy "brands_select_own" on brands for select using (user_id = auth.uid());
create policy "brands_insert_own" on brands for insert with check (user_id = auth.uid());
create policy "brands_update_own" on brands for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "brands_delete_own" on brands for delete using (user_id = auth.uid());

-- Entries Policies (with cross-entity brand ownership verification)
create policy "entries_select_own" on entries for select using (user_id = auth.uid());
create policy "entries_insert_own" on entries for insert with check (
  user_id = auth.uid()
  and exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid())
);
create policy "entries_update_own" on entries for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "entries_delete_own" on entries for delete using (user_id = auth.uid());

-- System Prompts Policies
create policy "system_prompts_select_own" on system_prompts for select using (user_id = auth.uid());
create policy "system_prompts_insert_own" on system_prompts for insert with check (user_id = auth.uid());
create policy "system_prompts_update_own" on system_prompts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "system_prompts_delete_own" on system_prompts for delete using (user_id = auth.uid());

-- AI Usage Policies
create policy "ai_usage_select_own" on ai_usage for select using (user_id = auth.uid());
create policy "ai_usage_insert_own" on ai_usage for insert with check (user_id = auth.uid());

-- ====================================================================
-- Storage Buckets & Policies
-- ====================================================================

insert into storage.buckets (id, name, public)
values 
  ('references', 'references', false),
  ('results', 'results', false),
  ('logos', 'logos', false)
on conflict (id) do nothing;

-- Path-prefix security: users can only access files under {bucket}/{auth.uid()}/*
create policy "references_own_prefix" on storage.objects for all
  using (bucket_id = 'references' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'references' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "results_own_prefix" on storage.objects for all
  using (bucket_id = 'results' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'results' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos_own_prefix" on storage.objects for all
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
