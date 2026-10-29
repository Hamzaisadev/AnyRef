# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

---

## Reporting a Vulnerability

If you discover a potential security vulnerability within Anyref, please do not disclose it publicly or open a public GitHub issue.

Instead, please report security concerns directly via GitHub Security Advisories or by emailing:
`security@anyref.app`

### Vulnerability Disclosure Timeline
- We will acknowledge receipt of your vulnerability report within 48 hours.
- We will provide a status update and remediation target within 7 business days.
- A standard 90-day responsible disclosure window applies before any coordinated public release.

### Critical Policies
- Never commit secrets, API keys, or service role credentials to git history.
- All database queries and storage access must respect Row Level Security (`user_id = auth.uid()`).
