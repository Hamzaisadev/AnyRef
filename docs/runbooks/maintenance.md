# Runbook: Operations & Maintenance

This runbook covers operational routines for Anyref: database migrations, auditing AI expenditure, storage asset audits, and managing user access.

---

## 1. Database Migrations

Anyref uses Supabase migrations stored in `supabase/migrations/`.

### Applying Migrations Locally
```bash
# Generate a new migration after schema changes
supabase db diff -f add_new_column

# Apply all unapplied migrations
supabase migration up
```

### Applying Migrations to Staging / Production
1. Link project:
   ```bash
   supabase link --project-ref <project-id>
   ```
2. Push migrations:
   ```bash
   supabase db push
   ```
3. Verify RLS policies are enabled on all tables:
   ```sql
   select tablename, rowsecurity from pg_tables where schemaname = 'public';
   ```

---

## 2. Auditing AI Usage & Spend

To monitor token spend against daily and monthly limits:

1. Query aggregated usage directly from Supabase SQL Editor:
   ```sql
   select 
     date_trunc('day', created_at) as day,
     kind,
     count(*) as requests,
     sum(input_tokens) as total_input_tokens,
     sum(output_tokens) as total_output_tokens,
     sum(est_cost_usd) as total_cost_usd
   from ai_usage
   group by 1, 2
   order by day desc
   limit 30;
   ```
2. If unexpected cost spikes occur:
   - Check `scripts/check-spend.ts` to identify anomalous entries or retry storms.
   - Adjust `AI_DAILY_COST_CAP_USD` down in Vercel environment variables immediately to halt traffic.

---

## 3. Storage Asset Audits

Since product photos are in-memory (per [ADR 0004](file:///f:/Codding%20projects/AnyRef/docs/adr/0004-ephemeral-product-photos.md)), only `references`, `results`, and `logos` buckets retain persistent files.

### Orphaned Asset Cleanup
When entries are deleted, associated storage paths are deleted by `entryService.deleteEntry()`. To audit for orphaned files:
```bash
pnpm tsx scripts/audit-storage.ts --dry-run
```
If discrepancies exist between storage objects and database records, re-run with `--fix` to prune orphaned files.

---

## 4. Managing User Access (Invite-Only)

Public sign-up is disabled by design. To invite or create an authorized user:

1. In Supabase Dashboard: Go to **Authentication** > **Users**.
2. Click **Invite User** and enter their email address.
3. The user receives a Magic Link. Upon initial login, a trigger or the `/api/brands` setup flow ensures their initial default brand is seeded.
