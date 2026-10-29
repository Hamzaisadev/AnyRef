# Multi-Tenancy via Supabase Row Level Security (RLS)

Every database table and storage bucket enforces `user_id = auth.uid()` Row Level Security from day one, even though initial sign-ups are invite-only and personal. Enforcing tenant isolation at the database engine prevents cross-tenant data leaks by construction and avoids a painful architectural rewrite when multi-user signups are enabled later. Application queries never rely solely on application-layer filtering for access control.
