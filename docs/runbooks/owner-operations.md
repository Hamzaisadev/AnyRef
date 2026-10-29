# Owner Operations Runbook

**Version**: 1.0.0  
**Audience**: Anyref Primary Platform Owner  
**Security Level**: Confidential  

This runbook documents operational procedures for managing Anyref in production.

---

## 1. Emergency Circuit Breakers

### Trip the AI Kill Switch
When an unexpected AI model error loop, provider cost anomaly, or security incident occurs:
1. Navigate to `/admin`.
2. Locate the **Global Emergency & Operational Flags** card.
3. Click **Trip Switch** next to **AI Kill Switch**.
4. *Effect*: All non-owner prompt generation and autofill requests are immediately halted with a 403 status. Owner test runs remain functional to diagnose the issue.

### Pause Public Signups
To halt new account creation (e.g. during a bot attack):
1. Navigate to `/admin`.
2. Click **Open** next to **Open Sign-ups** to toggle it to **Paused**.
3. *Effect*: New user registrations are blocked immediately.

---

## 2. User & Abuse Operations

### Suspend an Abusive Account
1. Open `/admin/users`.
2. Locate the target user by User ID or email.
3. Click **Suspend**. Provide an audit-logged justification (e.g. "Reported for generating abusive spam").
4. *Effect*: The user's account status transitions to `suspended`. Any active sessions are denied on the next API call.

### Process a DMCA Takedown Notice
1. Receive notice at `legal@anyref.app`.
2. Open `/admin/abuse`.
3. Enter the reported User UUID and the official ticket reason (minimum 5 characters, e.g. "DMCA Notice #412: Infringing reference poster").
4. Click **Audit & Review User Content**.
5. *Effect*: The review is permanently written to the immutable `audit_log`. The user's brands and entries are revealed for takedown verification. If infringing, delete or suspend.

---

## 3. Subscription & Quota Operations

### Grant a Complimentary Plus Plan
1. Open `/admin/users`.
2. Locate the user and click **Comp Plus**.
3. Select the optional expiration date or leave empty for indefinite comp access.
4. *Effect*: Sets `profiles.plan_id = 'plus'` and `plan_source = 'comp'`. When expired, the automated cron gracefully reverts them to `free`.

### Set a Temporary Quota Override
1. In `/admin/users`, open the quota editor for the target user.
2. Specify custom overrides (e.g. `generate_per_day: 100`).
3. Set an expiration date and mandatory justification.

---

## 4. Prompt Engine Deployment (Rule 6)

1. Open `/admin/engine` (accessible only by the Platform Owner).
2. Edit instructions for `deconstruct` or `autofill`.
3. Click **Deploy New Version**.
4. *Effect*: Automatically increments the version number, writes the new prompt to `system_prompts`, and creates an immutable audit record. The system prompt is never exposed to clients or third-party loggers.

---

## 5. Automated Maintenance Cron

- Scheduled endpoint: `/api/cron/cleanup`
- Invocation Header: `Authorization: Bearer ${CRON_SECRET}`
- Scheduled frequency: Daily at 02:00 UTC.
- Operations performed:
  - Purges `pending_deletion` accounts after 14 days.
  - Reverts expired `comp` plans to `free`.
  - Clears expired `quota_overrides`.
