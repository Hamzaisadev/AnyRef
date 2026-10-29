-- ====================================================================
-- Migration 0004: Seed user defaults on registration (Sample brand & entries)
-- Updates handle_new_user() trigger function to provision an initial
-- sample brand and two starter entries upon signup.
-- ====================================================================

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_brand_id uuid;
begin
  -- 1. Insert Profile
  insert into public.profiles (user_id, role, status, plan_id, plan_source)
  values (new.id, 'user', 'active', 'free', 'default')
  on conflict (user_id) do nothing;

  -- 2. Seed Default Sample Brand
  insert into public.brands (
    user_id,
    name,
    what_you_sell,
    why,
    tone,
    colors,
    wordmark,
    slogan,
    footer_text,
    never_do_rules,
    default_values
  ) values (
    new.id,
    'Acme Sample Brand',
    'Premium handcrafted insulated drinkware and outdoor lifestyle gear',
    'Keep your drinks at peak temperature while reducing single-use plastic waste',
    'Modern, adventurous, reliable, minimalist',
    array['#1E293B', '#0EA5E9', '#F8FAFC'],
    'ACME',
    'Built for Every Journey',
    'Designed in California. Lifetime warranty.',
    'Never show damaged or rusted tumblers; never use low-resolution clipart.',
    '{"cta_text": "SHOP NOW", "urgency": "NEW ARRIVAL"}'::jsonb
  )
  returning id into v_brand_id;

  -- 3. Seed 2 Sample Entries for that brand
  if v_brand_id is not null then
    -- Sample Entry 1: Launch Poster
    insert into public.entries (
      user_id,
      brand_id,
      prompt_template,
      slots,
      status,
      poster_type,
      intended_product_shape,
      note
    ) values (
      new.id,
      v_brand_id,
      'A sleek product launch poster for {{brand_name}}. In the center sits the exact product in the attached product image, reproduced faithfully and unchanged against a dramatic dusk mountain backdrop. The top bold header reads "{{headline}}". Below the product, an accent pill says "{{subhead}}". Bottom footer contains wordmark "{{wordmark}}" with tag "{{slogan}}". Minimalist, studio lighting with natural rim light.',
      jsonb_build_array(
        jsonb_build_object(
          'key', 'brand_name',
          'label', 'Brand Name',
          'type', 'short_text',
          'required', true,
          'brand_field', 'wordmark',
          'optional_block', false,
          'never_invent', false
        ),
        jsonb_build_object(
          'key', 'headline',
          'label', 'Main Headline',
          'type', 'short_text',
          'required', true,
          'brand_field', null,
          'optional_block', false,
          'never_invent', false
        ),
        jsonb_build_object(
          'key', 'subhead',
          'label', 'Subheading',
          'type', 'short_text',
          'required', false,
          'brand_field', null,
          'optional_block', true,
          'never_invent', false
        ),
        jsonb_build_object(
          'key', 'wordmark',
          'label', 'Wordmark',
          'type', 'short_text',
          'required', true,
          'brand_field', 'wordmark',
          'optional_block', false,
          'never_invent', false
        ),
        jsonb_build_object(
          'key', 'slogan',
          'label', 'Slogan',
          'type', 'short_text',
          'required', true,
          'brand_field', 'slogan',
          'optional_block', false,
          'never_invent', false
        )
      ),
      'draft',
      'launch',
      'tall',
      'Sample Launch Poster'
    );

    -- Sample Entry 2: Festive / Promo Poster
    insert into public.entries (
      user_id,
      brand_id,
      prompt_template,
      slots,
      status,
      poster_type,
      intended_product_shape,
      note
    ) values (
      new.id,
      v_brand_id,
      'A festive promotional poster for {{brand_name}}. In the center sits the exact product in the attached product image, reproduced faithfully and unchanged, surrounded by subtle golden bokeh lights and warm festive ribbons. Top banner reads "{{headline}}". Bottom includes "{{footer_text}}" with brand mark "{{wordmark}}". Warm, celebratory, premium lighting.',
      jsonb_build_array(
        jsonb_build_object(
          'key', 'brand_name',
          'label', 'Brand Name',
          'type', 'short_text',
          'required', true,
          'brand_field', 'wordmark',
          'optional_block', false,
          'never_invent', false
        ),
        jsonb_build_object(
          'key', 'headline',
          'label', 'Festive Headline',
          'type', 'short_text',
          'required', true,
          'brand_field', null,
          'optional_block', false,
          'never_invent', false
        ),
        jsonb_build_object(
          'key', 'wordmark',
          'label', 'Wordmark',
          'type', 'short_text',
          'required', true,
          'brand_field', 'wordmark',
          'optional_block', false,
          'never_invent', false
        ),
        jsonb_build_object(
          'key', 'footer_text',
          'label', 'Footer Text',
          'type', 'short_text',
          'required', true,
          'brand_field', 'footer_text',
          'optional_block', false,
          'never_invent', false
        )
      ),
      'draft',
      'festive',
      'square',
      'Sample Festive Poster'
    );
  end if;

  return new;
end;
$$;
