-- Migration 0005: Disable Ads Across All Plans (S4-3)
-- In accordance with honest monetization guidelines, disable ads across all plans.
update public.plans
set show_ads = false;

-- Disable global ads setting in app_settings if configured
insert into public.app_settings (key, value)
values ('ads_enabled_global', false)
on conflict (key) do update set value = false, updated_at = now();
