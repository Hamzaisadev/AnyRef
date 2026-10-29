# Privacy Policy (Template — Review by legal counsel prior to public launch)
**Version**: 1.0.0  
**Effective Date**: October 29, 2026

## 1. Information We Collect
- **Account Identification**: Email address, account role, authentication provider credentials (Google OAuth or Magic Link tokens). We do not store passwords.
- **Studio Content**: Brand guidelines, color hex codes, prompt templates, slot parameters, and reference images uploaded during studio sessions.
- **Usage & Telemetry**: AI generation timestamps, token counts, and error rates to monitor platform performance and prevent abuse.
- **Audit Logs**: Administrative actions, account status updates, and authenticated sessions are recorded in an append-only audit trail.

## 2. Third-Party Sub-Processors
To deliver our prompt engineering studio services, we engage the following vetted sub-processors:
| Sub-Processor | Purpose | Location |
|---|---|---|
| Supabase | PostgreSQL Database, User Auth, Encrypted Object Storage | USA / EU |
| Google Cloud / Gemini AI | Vision Deconstruction & Slot Inference | USA / Global |
| Merchant of Record | Global Payments, Sales Tax, Billing Portal | Global |
| Display Ad Network | Non-intrusive ad placement on Free Tier | Global |

## 3. Reference Image Processing & AI Isolation
- Uploaded reference imagery is transmitted directly over TLS to Google Gemini vision endpoints for the sole purpose of extracting prompt structure and visual slot properties.
- Reference images are not stored or indexed by foundation model providers for model training.
- Platform administrators have zero direct browse access to your private images or prompt templates through Row Level Security, except when an authorized abuse investigation is explicitly audit-logged.

## 4. Your Rights (GDPR / CCPA)
- **Data Export**: You can request an automated GDPR-compliant JSON bundle containing all your brands, templates, and entries.
- **Right to Erasure**: You can request self-serve account deletion in Settings. Data is quarantined for 14 days and permanently hard-deleted thereafter.
- **Contact**: Reach our data protection officer at `privacy@anyref.app`.
