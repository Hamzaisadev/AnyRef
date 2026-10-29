# Anyref — API Specification & Contracts

This document specifies the internal HTTP API routes, payload validation schemas, error contracts, and quota behaviors for Anyref.

All routes are authenticated via Supabase session cookies (`sb-access-token`, `sb-refresh-token`). Unauthenticated requests receive HTTP 401.

---

## 1. Error Contract & Status Codes

All non-2xx responses return a consistent error body:

```ts
interface ErrorResponse {
  error: {
    code: string;       // e.g. "VALIDATION_ERROR", "QUOTA_EXCEEDED"
    message: string;    // Human-readable summary
    details?: unknown;  // Specific field errors or quota thresholds
  };
}
```

### Standard Status Codes
- `200 OK` / `201 Created`: Request succeeded.
- `400 Bad Request`: Invalid request structure or schema failure (`VALIDATION_ERROR`).
- `401 Unauthorized`: Missing or invalid session cookie (`UNAUTHORIZED`).
- `403 Forbidden`: Cross-tenant access attempt violating RLS (`FORBIDDEN`).
- `404 Not Found`: Entity does not exist or belongs to another user (`NOT_FOUND`).
- `422 Unprocessable Entity`: Model output failed Zod validation after retry (`AI_INVALID_OUTPUT`).
- `429 Too Many Requests`: Daily call count or daily spend quota reached (`QUOTA_EXCEEDED`).
- `502 Bad Gateway`: Upstream AI provider API error or timeout (`AI_PROVIDER_ERROR`).

---

## 2. Endpoints

### 2.1 AI Generation & Autofill

#### `POST /api/generate`
Decomposes an uploaded reference poster into a prompt template and slot definitions.

- **Request**: `multipart/form-data`
  - `reference`: Binary file (`image/jpeg`, `image/png`, `image/webp`, max 10MB)
  - `brand_id`: UUID string

- **Response `200 OK`**:
```json
{
  "prompt_template": "A minimalist studio poster with a textured concrete backdrop. In the center sits the exact product in the attached product image, reproduced faithfully and unchanged. At the top, the brand wordmark {{wordmark}} is centered in bold typography. Below the product, the headline reads \"{{headline}}\". [[?offer: Special promotion: \"{{offer}}\".]] Lighting is soft directional rim light from the upper right. Shot on 85mm lens, f/4, clean studio depth of field. No extra text, no lorem ipsum, no watermarks, no distorted letters.",
  "slots": [
    {
      "key": "wordmark",
      "label": "Brand Wordmark",
      "type": "short_text",
      "max_length": 40,
      "required": true,
      "hint": "Top centered in bold",
      "brand_field": "wordmark",
      "default": "REWIRED",
      "optional_block": false,
      "never_invent": false
    },
    {
      "key": "headline",
      "label": "Poster Headline",
      "type": "short_text",
      "max_length": 60,
      "required": true,
      "hint": "Main title under product",
      "brand_field": null,
      "default": "NEXT-GEN SOUND",
      "optional_block": false,
      "never_invent": false
    },
    {
      "key": "offer",
      "label": "Special Offer / Discount",
      "type": "short_text",
      "max_length": 30,
      "required": false,
      "hint": "Bottom promotion line",
      "brand_field": null,
      "optional_block": true,
      "never_invent": true
    }
  ],
  "poster_type": "launch",
  "intended_product_shape": "tall",
  "layout_notes": "Single hero item centered with clean upper negative space for typography."
}
```

---

#### `POST /api/autofill`
Inspects an uploaded product photo against an Entry's slots and generates contextual values.

- **Request**: `multipart/form-data`
  - `product_photo`: Binary file (processed in-memory, never persisted to storage)
  - `entry_id`: UUID string
  - `hint`: Optional string (campaign context or brief, max 200 chars)

- **Response `200 OK`**:
```json
{
  "values": {
    "headline": {
      "value": "ZERO LATENCY PRO",
      "source": "ai",
      "confidence": "high"
    },
    "wordmark": {
      "value": "REWIRED",
      "source": "brand_default",
      "confidence": "high"
    }
  },
  "needs_you": ["offer"],
  "product_shape": "tall",
  "product_guess": "Over-ear wireless audio headphones with matte black finish"
}
```

---

### 2.2 Entries Management

#### `GET /api/entries`
List saved entries for the authenticated user.
- **Query Parameters**:
  - `brand_id`: UUID (optional filter)
  - `status`: `draft` | `winner` | `needs_tweak` | `failed` (optional)
  - `poster_type`: `sale` | `launch` | `festive` | `announcement` | `other` (optional)
  - `limit`: number (default: 20)
  - `offset`: number (default: 0)

#### `POST /api/entries`
Saves an approved template from the Generate Studio into the library.
- **Request Body (`application/json`)**:
```json
{
  "brand_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "reference_path": "9b1deb4d/ref-1234.png",
  "prompt_template": "...",
  "slots": [...],
  "poster_type": "launch",
  "intended_product_shape": "tall",
  "note": "Initial generation from Pinterest audio poster"
}
```

#### `GET /api/entries/:id`
Retrieves a single entry by ID.

#### `PATCH /api/entries/:id`
Updates an entry (e.g. updating result image, status to `winner`, or notes).
- **Request Body (`application/json`)**:
```json
{
  "status": "winner",
  "result_path": "9b1deb4d/res-5678.png",
  "note": "Tested with Flux 1.1 Pro - perfect composition"
}
```

#### `DELETE /api/entries/:id`
Deletes an entry and its associated reference/result assets from Supabase Storage.

---

### 2.3 Brand Guidelines

#### `GET /api/brands`
Lists all brands for the authenticated user.

#### `POST /api/brands`
Creates a brand profile.
- **Request Body (`application/json`)**:
```json
{
  "name": "Rewired",
  "what_you_sell": "High-performance wireless audio equipment",
  "why": "Uncompromising clarity for active creators",
  "tone": "Direct, technical, energetic, modern",
  "colors": ["#0F1020", "#4B2BFF", "#FF8A3D"],
  "wordmark": "REWIRED",
  "slogan": "Engineered for pure focus",
  "footer_text": "Available worldwide. Free shipping on orders over $50.",
  "never_do_rules": "Never use vintage filters; never show messy cables; never use neon text.",
  "default_values": {
    "cta_text": "EXPLORE REWIRED"
  }
}
```

#### `PATCH /api/brands/:id`
Updates existing brand parameters.

---

### 2.4 Quota & Spending Tracking

#### `GET /api/usage`
Retrieves daily and monthly AI budget usage for the authenticated user.
- **Response `200 OK`**:
```json
{
  "today": {
    "call_count": 8,
    "call_limit": 50,
    "cost_usd": 0.32,
    "cost_cap_usd": 2.00,
    "reset_at": "2026-10-29T00:00:00.000Z"
  },
  "month_to_date": {
    "total_calls": 142,
    "total_cost_usd": 5.84
  }
}
```
