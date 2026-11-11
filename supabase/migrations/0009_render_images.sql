-- 0009_render_images.sql
-- Closes the generation loop: Anyref now renders the poster in-app instead of
-- handing the user a prompt to paste into an external generator.
--
-- Design note: the "never-invent" guardrail is about FACTUAL HONESTY (no invented
-- prices, discounts, or dates), not about who presses render. Rendering is gated on
-- all never_invent slots being resolved, so the guardrail is strengthened, not dropped.

-- 1. Extend ai_usage kind check constraint to include 'render'
alter table public.ai_usage
  drop constraint if exists ai_usage_kind_check;

alter table public.ai_usage
  add constraint ai_usage_kind_check check (kind in ('generate', 'autofill', 'brand_draft', 'render'));

-- 2. Renders table: one row per in-app image render attempt
create table if not exists public.renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid references public.entries(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,

  -- The exact rendered prompt (post slot-substitution, post-sanitization)
  rendered_prompt text not null,
  aspect_ratio text not null default '1:1',

  -- Storage path of the produced image, path-prefix isolated by user id
  image_path text,
  mime_type text,
  width int,
  height int,

  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'blocked')),
  -- 'blocked' = refused before spending money (unresolved never-invent slots)
  failure_reason text,

  model text,
  est_cost_usd numeric(10, 6) not null default 0,

  -- Grading carried over from the Winner flow so renders feed the same vault
  grade text check (grade in ('winner', 'ok', 'reject')),

  created_at timestamptz not null default now()
);

create index if not exists renders_user_created_idx
  on public.renders (user_id, created_at desc);
create index if not exists renders_entry_idx
  on public.renders (entry_id);

-- 3. RLS: users see and mutate only their own renders
alter table public.renders enable row level security;

drop policy if exists "renders_select_own" on public.renders;
create policy "renders_select_own" on public.renders
  for select using (auth.uid() = user_id);

drop policy if exists "renders_insert_own" on public.renders;
create policy "renders_insert_own" on public.renders
  for insert with check (auth.uid() = user_id);

drop policy if exists "renders_update_own" on public.renders;
create policy "renders_update_own" on public.renders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "renders_delete_own" on public.renders;
create policy "renders_delete_own" on public.renders
  for delete using (auth.uid() = user_id);

-- 4. Per-plan daily render quota + render budget.
--    Seeded conservatively: rendering costs ~40x a text call, so free tier gets a
--    deliberately small taste (enough to hit the aha moment, not enough to bankrupt us).
insert into public.app_settings (key, value)
values ('render_enabled', 'true'::jsonb)
on conflict (key) do nothing;
