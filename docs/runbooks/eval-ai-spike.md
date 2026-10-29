# Runbook: Phase 0 AI Model Spike Evaluation

This runbook defines the protocol for executing and scoring the Phase 0 AI spike (`scripts/spike-gemini.ts`) to determine whether Google Gemini 1.5 Pro matches the user's Claude baseline for reference poster decomposition.

The outcome of this evaluation gates the creation of `docs/adr/0005-ai-provider-selection.md`.

---

## 1. Test Dataset Preparation

1. Place 5 representative historical Pinterest reference poster images into `docs/spike/inputs/`:
   - `ref-1-electronics.jpg` (Single hero gadget, minimalist studio lighting)
   - `ref-2-fashion-editorial.jpg` (Full-bleed lifestyle editorial with large typographic overlay)
   - `ref-3-festive-sale.jpg` (Busy sale layout with discount badges, date banners, and price chips)
   - `ref-4-cosmetics-macro.jpg` (Extreme close-up product texture with subtle pastel lighting)
   - `ref-5-retro-typographic.jpg` (Heavy bold typography with retro risograph grain)

2. Ensure `GEMINI_API_KEY` is present in `.env.local`.

---

## 2. Running the Spike Script

Execute the automated extraction script:

```bash
pnpm tsx scripts/spike-gemini.ts
```

The script will:
- Feed each reference image + the *Rewired* brand profile to Gemini with the `GenerateOutput` Zod schema.
- Validate that the output parses cleanly into `{ prompt_template, slots, poster_type, intended_product_shape, layout_notes }`.
- Save raw JSON outputs to `docs/spike/gemini/output-*.json`.
- Render the final prompts to `docs/spike/gemini/rendered-*.txt`.

---

## 3. Standardized 3-Axis Scoring Matrix

The evaluator tests each rendered prompt in their image generator of choice (e.g., Midjourney v6.1 or Flux) and scores Gemini and Claude side-by-side on a 1–5 scale:

### Axis 1: Structural Fidelity (Weight: 35%)
- **5**: Captures exact framing, perspective, camera angle, and negative space without ever describing the product.
- **3**: Captures layout roughly, but misses lighting subtleties or includes unnecessary style adjectives.
- **1**: Hallucinates or attempts to describe the product in text; fails composition completely.

### Axis 2: Slot Granularity & Brand Mapping (Weight: 35%)
- **5**: Separates brand tokens (`wordmark`, `colors`) cleanly, wraps optional blocks in `[[?key: ...]]`, and flags price/discount/date slots `never_invent: true`.
- **3**: Slots exist, but some text that should be layout is parameterized, or brand fields aren't mapped.
- **1**: Leaks hardcoded prices/dates into layout text or produces invalid slot keys.

### Axis 3: Prompt Render Quality (Weight: 30%)
- **5**: Output image closely mirrors the layout and energy of the original Pinterest poster with brand identity intact.
- **3**: Passable poster, but composition drifts or typography hierarchy fails.
- **1**: Distorted layout, prompt ignored by generator, or severe artifacts.

---

## 4. Gating Verdict Criteria (PASS / FAIL)

Compute composite average score across all 5 reference tests:
$$\text{Score} = \frac{1}{5} \sum_{i=1}^{5} \frac{\text{Axis1}_i + \text{Axis2}_i + \text{Axis3}_i}{3}$$

- **PASS Conditions** (Both must be met):
  1. Average composite rating is **within 0.5 points** of the Claude baseline.
  2. At least **4 out of 5** raw JSON outputs validate on first attempt without schema fallback errors.

### Outcome Actions
- **If PASS**: Retain Gemini as default provider in `env.ts`. Write `docs/adr/0005-ai-provider-selection.md` recording PASS verdict and cost savings.
- **If FAIL**: Implement `claudeProvider.ts` as the default in `src/ai/` and update `env.ts`. Record FAIL verdict in `docs/adr/0005-ai-provider-selection.md`.
