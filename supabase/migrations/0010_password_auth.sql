-- 0010_password_auth.sql
-- Password sign-up and sign-in.
--
-- Hashing itself lives in Supabase Auth (bcrypt + per-user salt in auth.users), so no
-- plaintext password and no hash is stored in any table below. What we add here is the
-- surrounding safety: attempt throttling and an audit trail.

-- 1. Auth attempt log, used for rate limiting and for spotting credential stuffing.
create table if not exists public.auth_attempts (
  id bigserial primary key,
  -- Lowercased email. Not a FK: failed attempts often name accounts that do not exist,
  -- and we must be able to throttle those too.
  email text not null,
  -- Hashed, never raw: an IP is personal data and this table is long-lived.
  ip_hash text,
  kind text not null check (kind in ('signin', 'signup', 'reset')),
  outcome text not null check (outcome in ('ok', 'bad_credentials', 'blocked', 'error')),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists auth_attempts_email_time_idx
  on public.auth_attempts (email, created_at desc);
create index if not exists auth_attempts_ip_time_idx
  on public.auth_attempts (ip_hash, created_at desc);

-- RLS on, with no policies: only the service role may read or write this table.
-- Nothing in the browser should ever see another person's attempt history.
alter table public.auth_attempts enable row level security;

-- 2. Retention. Attempt rows older than 30 days have no operational value and are a
--    liability, so the existing cleanup cron removes them.
create or replace function public.prune_auth_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.auth_attempts where created_at < now() - interval '30 days';
$$;

comment on function public.prune_auth_attempts is
  'Deletes auth attempt rows older than 30 days. Called by the cleanup cron.';

-- 3. Record how an account was created, so support can tell a password user from a
--    magic-link user without guessing.
alter table public.profiles
  add column if not exists auth_method text
    check (auth_method in ('password', 'magiclink', 'oauth'));

comment on column public.profiles.auth_method is
  'How this account first signed up. Informational only; never used for authorisation.';
