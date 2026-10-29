-- ====================================================================
-- 0003_enforce_entry_limit.sql: Enforce max_entries limit trigger
-- ====================================================================

create or replace function public.enforce_entry_limit() returns trigger
language plpgsql as $$
declare
  lim numeric;
begin
  lim := public.effective_limit(new.user_id, 'max_entries');
  if lim is not null and (select count(*) from public.entries where user_id = new.user_id) >= lim then
    raise exception 'LIMIT_MAX_ENTRIES' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists entries_limit on public.entries;
create trigger entries_limit
before insert on public.entries
for each row execute function public.enforce_entry_limit();
