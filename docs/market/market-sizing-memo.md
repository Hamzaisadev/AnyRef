# Market Sizing & Unit Economics Memo — Anyref

> **Internal hypothesis. Inputs are unverified assumptions, not measured data.**

**Author:** Market Review Working Group | **Date:** 2026-10-30 | **Status:** Internal Working Hypothesis Only

---

## 1. Input Verification & Source Audit

Every numerical input from the preliminary market and unit economics review is cataloged below with its verification status:

| Parameter / Claim | Value | Verification Status | Source / Evidence Basis |
| :--- | :---: | :---: | :--- |
| **Top-Down TAM Anchor** | \$1.42B | **UNVERIFIED** | Attributed to *Precedence Research (Generative AI in Design)*. Public disclosures report \$993.9M baseline scaling towards \$1.33B–\$1.42B across varying scopes. The exact \$1.42B anchor for "Creative & Graphic Design Software" is not verified from open primary sources. |
| **Global Countable Entities** | 1,500,000 | **ASSUMPTION [A]** | Synthesized estimate: 950k Shopify stores, 220k marketing agencies, 330k freelance designers. Unvalidated secondary aggregation. |
| **Qualified Unit Ratio ($q$)** | 24.0% | **ASSUMPTION [A]** | Theoretical percentage of commercial entities adopting external text-to-image workflows. Unverified assumption. |
| **Reachable Channel Ratio ($r$)** | 20.0% | **ASSUMPTION [A]** | Estimated 36-month channel reachability across PLG and community channels. Unverified assumption. |
| **Expected Win Rate ($w$)** | 16.0% | **ASSUMPTION [A]** | Theoretical conversion rate against manual prompting. Unverified assumption. |
| **Target SOM (Year 3 ARR)** | \$3.1M – \$3.2M | **ASSUMPTION [A]** | Derived purely from multiplying unverified assumptions ($N \times q \times r \times w \times ACV$). No real customer demand or waitlist data. |
| **Monthly Churn Rate** | 5.0% | **ASSUMPTION [A]** | Prosumer SaaS industry heuristic benchmark. Unmeasured for Anyref. |
| **Customer Acquisition Cost (CAC)** | \$150.75 | **ASSUMPTION [A]** | Blended assumption (65% organic PLG at \$30, 35% paid ads at \$375). Zero paid ad spend has been tested. |
| **LTV : CAC Multiple** | 3.01x | **ASSUMPTION [A]** | Theoretical mathematical ratio derived from unvalidated churn, ARPU, and CAC assumptions. |
| **Payment Processing Fee** | 5% + \$0.50 | **ASSUMPTION [A]** | Standard Merchant-of-Record (MoR) schedule (Lemon Squeezy / Paddle). |
| **AI Inference Cost: Deconstruction (`generate`)** | \$0.003493 / call | **SOURCED & VERIFIED** | Empirical benchmark of 25 live calls on configured model `gemini-2.5-flash` (`docs/spike/cost_benchmark_25_runs.json`, 2026-10-30). |
| **AI Inference Cost: Autofill (`autofill`)** | \$0.001675 / call | **SOURCED & VERIFIED** | Empirical benchmark of 25 live calls on configured model `gemini-2.5-flash` (`docs/spike/cost_benchmark_25_runs.json`, 2026-10-30). |
| **AI Inference Cost: Brand Draft (`brand_draft`)** | \$0.001125 / call | **SOURCED & VERIFIED** | Empirical benchmark of 25 live calls on configured model `gemini-2.5-flash` (`docs/spike/cost_benchmark_25_runs.json`, 2026-10-30). |
| **Prompt Workbench & Winner Reuse Cost** | \$0.000000 / call | **SOURCED & VERIFIED** | In-browser string interpolation / client-side rendering with zero external API calls. |

---

## 2. Market Definition (Hypothesis)

**Market Definition Sentence:**  
> Brand-conditioned prompt engineering and visual creative templating SaaS sold to direct-to-consumer (DTC) e-commerce brands, performance marketing agencies, and commercial digital designers.

### Scope Boundaries:
- **In Scope:** Poster layout deconstruction into typed slots, persistent brand guideline injection, guardrails for non-hallucinable commercial data (prices, dates), in-memory product photo autofill, zero-cost prompt template reuse.
- **Out of Scope:** Operating image generation GPUs (handled by external tools like Midjourney, Flux, Ideogram; see [ADR 0001](../adr/0001-no-image-generation.md)), consumer photo filters, unstructured prompt text repositories.

---

## 3. Top-Down Build (Unverified Hypothesis)

- **Anchor Source:** Global Generative AI in Creative & Graphic Design Software Market (Precedence Research, unverified citation).
- **Valuation:** \$1,420,000,000 (\$1.42B) [UNVERIFIED].

| Filter Sequence | Retention | Surviving Value | Unit Equivalent | Basis |
| :--- | :---: | :---: | :---: | :--- |
| **Published Anchor** | — | **\$1,420,000,000** | ~5.25M seats | Precedence Research citation [UNVERIFIED] |
| **1. Geography Filter** | 0.580 | **\$823,600,000** | ~3.05M seats | NA (39%) + Western Europe (19%) share assumption |
| **2. Use-Case Segment Filter** | 0.350 | **\$288,260,000** | ~1.07M seats | Commercial performance ad creative focus [A] |
| **3. Workflow Architecture Filter** | 0.280 | **\$80,712,800** | ~298k seats | External prompt-conditioned workflows [A] |
| **= SAM (Top-Down)** | | **\$80,712,800** | **~298,900 seats** | Filtered market capacity [A] |
| **4. Reachable Channel Filter** | 0.220 | **\$17,756,816** | ~65,700 seats | 36-month channel reach [A] |
| **5. Expected Win Rate** | 0.180 | **\$3,196,227** | ~11,830 seats | Hypothetical conversion against manual workflows [A] |
| **= SOM (Top-Down)** | | **\$3,196,227** | **~11,830 seats** | ~3.2M ARR run-rate [A] |

---

## 4. Bottom-Up Build (Unverified Hypothesis)

Countable unit base synthesized from Store Leads, BuiltWith, and agency directories:
- Active DTC Storefronts (10+ products, active ad spend): 950,000 [A]
- Digital Creative Agencies: 220,000 [A]
- Freelance Commercial Ad Designers: 330,000 [A]
- **Total Countable Units ($N$):** 1,500,000 entities [A]

Parameter calculations:
- $\text{Bottom-Up TAM} = 1,500,000 \times \$270 = \mathbf{\$405,000,000}$ [A]
- $\text{Bottom-Up SAM} = 1,500,000 \times 0.24 \times \$270 = \mathbf{\$97,200,000}$ [A]
- $\text{Bottom-Up SOM} = 1,500,000 \times 0.24 \times 0.20 \times 0.16 \times \$270 = \mathbf{\$3,110,400}$ [A]

---

## 5. Solid Empirical Finding: Plan Limits & AI Unit Economics

Unlike the market sizing figures above, the empirical inference benchmarks measured in `docs/spike/cost_benchmark_25_runs.json` are **solid measured data**:

### 5.1 Per-Call Ground Truth Costs
- `generate`: \$0.003493 / call (avg 2,715.4 input tokens, 1,071.3 output tokens)
- `autofill`: \$0.001675 / call (avg 2,422.5 input tokens, 379.4 output tokens)
- `brand_draft`: \$0.001125 / call (avg 818.8 input tokens, 351.6 output tokens)
- Template reuse / Workbench: \$0.000000

### 5.2 Legacy Plus Plan Flaw
At quotas of 50 generate, 100 autofill, 20 brand_draft per day (over a 30-day month):
- Worst-case monthly AI cost = \$10.94 / user / month.
- Price = \$5.00 / month. Net revenue after 5% + \$0.50 fee = \$4.25 / month.
- Worst-case net loss = -\$6.69 / user / month (-133.8% gross margin).
- Losses occur whenever utilization exceeds 38.8% of daily quotas.

### 5.3 Implemented Solution: Monthly AI Budget & Sustainable Tiers
To guarantee positive unit economics regardless of daily quota multiplication:
1. Enforced a **per-user monthly AI budget in dollars** (`monthly_ai_budget_usd`) checked prior to all AI calls.
2. Migrated to **Pro** (\$19/mo, \$4.00 budget ceiling) and **Studio** (\$49/mo, \$12.00 budget ceiling).
3. Free tier capped at \$0.40/month budget ceiling.
4. Unit economics under the budget-capped architecture:
   - Pro: Net rev \$17.55 $\rightarrow$ worst-case margin 71.3% (at \$4.00 budget cap); typical margin 85.6% (at 30% utilization, \$1.28 AI cost).
   - Studio: Net rev \$46.05 $\rightarrow$ worst-case margin 69.5% (at \$12.00 budget cap); typical margin 86.0% (at 30% utilization, \$3.90 AI cost).

---

## 6. Policy & Fencing Guardrails

1. **Product UI Separation:** Under no circumstances shall TAM, SAM, SOM, CAC, LTV, churn, or revenue projections be displayed in the product UI, landing page, README, or user documentation.
2. **Pricing Visibility:** Prices remain hidden behind `show_prices = false` in `app_settings` until the product owner explicitly enables billing rollout.
3. **Automated Enforcement:** A CI grep test (`tests/unit/claimsGuard.test.ts`) guards against the leakage of unverified market figures into `src/` and `README.md`.
