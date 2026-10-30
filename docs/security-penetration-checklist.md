# Anyref Security Penetration Checklist & OWASP Baseline Scan

**Version**: 1.0.0  
**Scope**: Public Multi-Tenant SaaS, Admin Controls, Image Uploads, AI Engine  
**Standards**: OWASP Top 10 (2021/2026), OWASP API Security Top 10, ASVS Level 2  

---

## 1. Penetration Testing Checklist

| Category | Test Case | Target Endpoint / File | Expected Behavior | Verification Status |
|---|---|---|---|---|
| **Auth & Session** | Role escalation via client token tampering | `POST /api/brands`, `/api/entries` | RLS enforces `auth.uid() = user_id`; role updates blocked by triggers | ✅ Verified (`tests/unit/rbacSql.test.ts`) |
| **Auth & Session** | Admin route bypass without AAL2 MFA | `/admin/*` | Rejects non-staff with 403; enforces AAL2 when `ADMIN_MFA_REQUIRED=true` | ✅ Verified (`tests/unit/authz.test.ts`) |
| **Auth & Session** | Disposable email bot accounts | `POST /api/auth/*`, `/login` | High-risk disposable email domains rejected immediately | ✅ Verified (`src/lib/disposableEmail.ts`) |
| **Auth & Session** | Suspended account access | All authenticated routes | Suspended status immediately returns 403 Forbidden | ✅ Verified (`tests/unit/accountService.test.ts`) |
| **Authorization** | Cross-tenant data inspection (IDOR) | `GET /api/entries/[id]`, `/api/brands/[id]` | Postgres RLS returns 404 or empty dataset for unauthorized tenant | ✅ Verified (`supabase/migrations/0001_init.sql`) |
| **Authorization** | Admin RLS content eavesdropping | `/admin/abuse` | Direct RLS access blocked; abuse audit logged with mandatory justification | ✅ Verified (`tests/integration/stage1/s1_6_abuseReview.test.ts`) |
| **Authorization** | Owner role promotion / demotion | `/admin/staff` | Single owner invariant enforced by SQL unique index and trigger | ✅ Verified (`tests/unit/adminService.test.ts`) |
| **Input Validation** | Malicious SVG script execution (Stored XSS) | `POST /api/upload` | SVG magic bytes and XML payloads rejected with 400 | ✅ Verified (`src/services/assetService.ts`) |
| **Input Validation** | MIME spoofing (EXE renamed as JPG) | `POST /api/upload` | Header magic byte check (`FF D8 FF`) detects and rejects spoofed files | ✅ Verified (`tests/unit/assetService.test.ts`) |
| **Input Validation** | EXIF metadata location leakage | `POST /api/upload` | JPEG APP1 EXIF segment stripped before storage | ✅ Verified (`tests/unit/assetService.test.ts`) |
| **Input Validation** | Decompression bomb (huge dimensions) | `POST /api/upload` | Dimensions exceeding 8192x8192px rejected | ✅ Verified (`tests/unit/assetService.test.ts`) |
| **Prompt Security** | Prompt extraction attack (Hard Rule 6) | `/api/generate`, `/api/autofill` | System prompts are platform-owned engine secrets; never sent to clients | ✅ Verified (`tests/unit/promptExtractionLeakage.test.ts`) |
| **SSRF** | Outbound URL invocation | Server actions / API | Zero user-supplied URLs are fetched by the backend | ✅ Verified (`tests/unit/securitySsrf.test.ts`) |
| **Rate Limiting** | Automated endpoint flooding / brute-force | `/api/*`, `/login` | In-memory token bucket + IP rate limits respond with 429 Too Many Requests | ✅ Verified (`src/middleware.ts`) |
| **Denial of Wallet** | AI cost exhaustion | `/api/generate`, `/api/autofill` | Global daily cost cap circuit breaker trips kill switch automatically | ✅ Verified (`src/services/quotaService.ts`) |

---

## 2. OWASP ZAP Baseline Scan Protocol

To run an automated baseline vulnerability scan against Anyref staging or local preview:

### Prerequisites
- Docker installed and running
- Anyref running locally on port 3000 (`pnpm start` or staging URL)

### Execution Command
```bash
docker run --rm -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -g gen.conf \
  -r zap-report.html \
  -I
```

### Baseline Rules & Exclusions
- **Pass Criteria**: Zero High or Medium severity alerts.
- **Informational**: Missing anti-clickjacking on intentionally public embed endpoints (if any).
- **Security Headers Verified**:
  - `Content-Security-Policy`: Modern script and frame directives.
  - `X-Frame-Options`: `DENY` on all authenticated and administrative routes.
  - `X-Content-Type-Options`: `nosniff`.
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`.
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`.
