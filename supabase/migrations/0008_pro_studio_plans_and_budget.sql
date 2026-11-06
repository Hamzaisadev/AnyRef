-- ====================================================================
-- 0008_pro_studio_plans_and_budget.sql: Cost-Safe Plans & Monthly AI Budget
-- ====================================================================

-- 1. Insert or update Pro and Studio tiers
insert into public.plans (id, name, price_usd_month, price_usd_year, limits, show_ads, is_active)
values
  ('pro', 'Pro', 19.00, 190.00,
   '{"max_brands":5,"max_entries":1000,"max_storage_mb":2000,"generate_per_day":20,"autofill_per_day":40,"brand_draft_per_day":5,"batch_max":5,"monthly_ai_budget_usd":4.00}'::jsonb,
   false, true),
  ('studio', 'Studio', 49.00, 490.00,
   '{"max_brands":25,"max_entries":5000,"max_storage_mb":10000,"generate_per_day":60,"autofill_per_day":120,"brand_draft_per_day":20,"batch_max":10,"monthly_ai_budget_usd":12.00}'::jsonb,
   false, true)
on conflict (id) do update set
  name = excluded.name,
  price_usd_month = excluded.price_usd_month,
  price_usd_year = excluded.price_usd_year,
  limits = excluded.limits,
  show_ads = excluded.show_ads,
  is_active = excluded.is_active;

-- 2. Update Free plan with monthly_ai_budget_usd
update public.plans set
  price_usd_month = 0.00,
  price_usd_year = 0.00,
  limits = '{"max_brands":2,"max_entries":50,"max_storage_mb":200,"generate_per_day":5,"autofill_per_day":5,"brand_draft_per_day":2,"batch_max":1,"monthly_ai_budget_usd":0.40}'::jsonb,
  show_ads = false,
  is_active = true
where id = 'free';

-- 3. Deactivate legacy Plus plan (maintain foreign key integrity, never delete)
update public.plans set
  is_active = false
where id = 'plus';

-- 4. Move any existing profile or subscription on Plus to Pro
update public.profiles set
  plan_id = 'pro'
where plan_id = 'plus';

update public.subscriptions set
  plan_id = 'pro'
where plan_id = 'plus';

-- 5. Add show_prices setting to app_settings (default: false, no prices in public UI)
insert into public.app_settings (key, value)
values ('show_prices', 'false'::jsonb)
on conflict (key) do nothing;
