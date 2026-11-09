# In-App Poster Rendering

**Status:** Accepted (2026-11-07). Supersedes [ADR 0001](./0001-no-image-generation.md).

## Context

Anyref's workflow ended at a prompt. To get a poster, a user had to subscribe to a
separate generator (Midjourney ~$30/mo, Flux, Ideogram), learn its interface, manually
attach assets in the order given by the Attach Checklist, then return to Anyref to paste
the result back in for grading.

Three things invalidated ADR 0001:

1. **The GPU dependency it guarded against no longer exists.** Image generation is now a
   hosted per-image API call ($0.134/image at 1K/2K), not infrastructure we operate.
2. **The target buyer does not own a generator.** The stated buyer is a small business
   that cannot afford to hire a designer. That person does not run a Midjourney
   subscription, so "users already control these tools" was false for them.
3. **The aha moment lived in someone else's product.** The moment a user sees their
   on-brand poster — the thing that makes them want to pay — happened in Midjourney.
   Anyref was positioned as a step in the middle of another product's workflow, which is
   also precisely what makes a product absorbable as a competitor's feature.

The competitive picture reinforced this: Canva Pro (~$15/mo) applies Brand Kit to AI
output and produces the finished artwork. Asking $19 for prompt text that the user then
takes elsewhere was not defensible against that.

## Decision

Anyref renders the finished poster in-app via `POST /api/render`, using a pinned image
model (`gemini-3-pro-image`). Reference layout, product cutout, and brand logo are
attached automatically with explicit roles, replacing the manual Attach Checklist step.

**The never-invent guarantee is kept and strengthened, not dropped.** The original
guardrail conflated two separate things: *factual honesty* (never invent a price, a
discount, or a date) and *who presses render*. Only the first is a product promise. A
rendered poster is a publishable artifact, so a hallucinated "30% OFF" baked into a JPEG
is a worse hazard than one sitting in prompt text — the honesty rule matters more here.

Enforcement, in `src/domain/renderGuard.ts`:

- A render is **blocked before any paid API call** when a required never-invent slot is
  empty or holds a placeholder (`TBD`, `N/A`, `$XX`, `<price>`, `[price]`, `0`). A
  blocked render costs **$0** and does not consume the user's monthly allowance.
- Any `{{token}}` surviving substitution blocks the render, so placeholders are never
  drawn onto the image.
- Every render carries `RENDER_HONESTY_DIRECTIVE`, forbidding invented prices, dates,
  discount badges, fine print, URLs, QR codes, and watermarks.

Prompt export to Midjourney, Flux, and Ideogram remains available. `ENABLE_RENDER=false`
degrades cleanly to the previous prompt-only behaviour.

## Consequences

**Cost.** A render costs ~40x a text call ($0.134 vs ~$0.003), making rendering the
dominant cost driver. This forced explicit changes:

- Renders are quota'd separately (`render_per_day`, `render_per_month`) and tracked in a
  `renders` table, because the monthly cap — not the text quotas — now determines margin.
- `minPlanMargin` was relaxed 0.55 → 0.50. At a 55% *worst-case* floor, Pro at $15 would
  have supported only 9 renders/month, which is not a sellable product. Accepted: 50.5%
  worst case, 79.3% typical.
- `maxFreeBudgetUsd` was raised $0.50 → $0.60 to fit 3 free renders, with free text
  quotas trimmed 5/5 → 3/3 per day to compensate. Free exposure: $0.58/user/month.
- Pro repriced $19 → $15 for parity with Canva Pro, since Anyref has no brand equity to
  charge a premium on.

**Risk.** Per-image pricing is now a direct input to gross margin, so a Google price
change hits economics immediately. Mitigations: the monthly dollar budget acts as a
backstop independent of the render count; `IMAGE_MODEL_PRICING_CATALOG` carries cheaper
fallbacks (`nano-banana-2` at $0.067, `gemini-2.5-flash-image` at $0.039); and the
monthly-budget estimator floors render cost at the known per-image benchmark so a low
observed average can never wave through a call we cannot cover.

**Open question.** Whether in-app rendering actually changes user behaviour is unproven —
it is a bet, not a validated result. The metric that settles it is the share of signups
who reach a graded render. If users still prefer exporting to Midjourney, that is a
strong signal and the export path stays.
