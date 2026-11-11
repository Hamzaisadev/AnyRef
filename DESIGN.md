# Anyref landing — design record

## Brief (Phase 0)

- **Subject:** Anyref. Renders on-brand marketing posters from a reference image. Prices,
  discounts and dates always come from a person, never from the model.
- **Audience:** freelance social-media designers and 1–3 person studios running several client
  brands. Secondary: small business owners doing their own posts.
- **Job:** get the visitor to render one poster (free, 3/month, no card).
- **Stage:** zero users, pre-revenue, solo founder on savings. Pro is live at $15/mo.
- **Direction chosen by the owner:** bold, colourful, playful. Big type leads; posters support.
- **Stack:** the existing Next.js 15 App Router + Tailwind app, per the skill's rule to use the
  project's framework. The landing shares auth routes, `PLANS_CONFIG` and telemetry with the
  app, so prices on the page can never drift from the prices in the database.

### Assumptions (no invented credentials)

- No customer logos, testimonials, award badges or usage metrics. The product has no users.
- Example brands (Verda, Pell & Co, Nomad Coffee) are **clearly fictional**, marked
  `placeholder: true` in `src/data/landing.ts` and labelled in the UI.
- The only real numbers on the page are the plan prices, read from `PLANS_CONFIG`.

## Concept card (Phase 1)

```
Idea:        One brand colour floods the whole page, and every poster on it is the same
             layout wearing a different brand. The page demonstrates the product by
             being the product.
Metaphor:    A paint chip rack, or a risograph print run: one plate, many inks.
Signature:   A colour rail the visitor drags/clicks. The page's field colour, the hero
             type and all three posters re-skin together in one motion, because they are
             driven by one variable. "Your brand" stops being a claim and becomes a demo.
Emotion:     Playful, confident, slightly loud. "Oh — that's mine now."
Motion verb: Flood. Colour arrives like ink spreading across a sheet, fast then settling.
             Nothing fades; things flood and lock.
Screenshot:  The full-bleed colour field with YOUR BRAND. EVERY POST. at 11vw and three
             posters in the same ink.
```

Why this over the runners-up (rejected: a contact-sheet scrub; a typed-slot grid): those two
could be moved to any AI image tool. This one depends on Anyref's actual job — carrying one
brand identity across many posters — and it proves the claim instead of asserting it.

Stolen for a detail: the 404 is the colour rail with nothing selected, on bare paper.

## Art direction (Phase 2)

**Palette.** A committed field colour, not a dark theme. The field is one of five brand inks
the visitor can switch between; everything else is paper and ink.

| Role | Hex | Use |
|---|---|---|
| `paper` | `#FBF7F0` | warm off-white. Page ground outside the field |
| `ink` | `#15130F` | warm near-black. All body text on paper |
| `muted` | `#6A655C` | meta and captions. 6.3:1 on paper |
| `line` | `rgb(21 19 15 / 0.16)` | hairlines |
| `field` | runtime | the flooded brand colour (default `#FF4D2E`) |
| `field-ink` | runtime | text on the field, paper or ink depending on luminance |

The five inks: `#FF4D2E` ember, `#1B4DFF` cobalt, `#0E8F5E` fern, `#7B2FF2` violet,
`#F2B705` amber. Each ships with a precomputed on-colour that passes AA. Not the app's
`#4B2BFF`/`#FF8A3D` pair: that blue/orange combination is the SaaS default this redesign is
getting away from.

**Type.**
- Display: **Archivo** (Google, variable `wdth` 62–125 + weight). The width axis is the
  playful register: headlines sit wide and heavy, and the rail nudges the axis as colour
  changes. One family, two personalities.
- Text/UI: **Switzer** (Fontshare). Neutral Swiss, keeps the loud display from becoming noise.
- Mono: existing JetBrains Mono, only for plan limits and the rail's labels.
- Replaces Inter / Inter Tight, which art-direction.md names as an AI tell.

Display: `line-height: 0.82`, `letter-spacing: -0.045em` at mega, optical `margin-left:
-0.06em`, uppercase for the hero only (Archivo's caps are built for it). Body 17px / 1.55.

**Grid.** 12 columns, fluid gutter. Alignment rule: the field sections bleed edge to edge;
paper sections hang from column 2. Section rhythm alternates field/paper so colour marks the
structure rather than decorating it.

**Shape.** One radius rule: `--radius: 14px`, inherited from the app's existing `--radius-card`
so the landing and the product feel related. Posters use the same radius.

**Motion language.** One easing family (`ease.out` = expo.out; `ease.inOut` for the curtain).
Flood: colour transitions run on a CSS custom property over 0.5s, fast in and settling.
- Primary targets (CTA, poster links): fill floods from the pointer's side.
- Nav: letter roll. Utility links: colour only.
- Idle: the hero's width axis breathes ±1.5 and the active chip pulses faintly. Small, on the
  concept, paused off screen, zero under reduced motion.

**Composition plan** (a different layout family per section):

```
HERO — full-bleed colour field, type left, poster stack right
┌──────────────────────────────────────────┐
│ anyref                 work pricing menu │
│██████████████████████████████████████████│
│██ YOUR BRAND.                  ╭──────╮ ██│
│██ EVERY POST.                  │poster│ ██│
│██                       ╭──────┤      │ ██│
│██ [Start free] [See it] │poster│      │ ██│
│██ ● ● ● ● ●  ← colour rail      ╰──────╯ ██│
└──────────────────────────────────────────┘

PROOF — paper, three posters in a row, same layout different brands
STEPS — field colour again, 3 numbered steps (a real sequence, so numbers earn it)
HONESTY — paper, two columns: what it fills vs what it asks you for
PRICING — paper, unequal: Pro wide, others rails
FOOTER — field colour, wordmark at display size
```

**Genericness test.** A generic model would ship: centred hero, purple-blue gradient, three
equal feature cards, Inter, glassmorphism. None of those are here. The remaining risk is
"bold colour field + big grotesk" being a known archetype (art-direction.md "Field color").
It earns its place because the colour is *interactive and meaningful*: it is the brand being
swapped, which is the product's entire job. A static brand colour would fail this test.

## Decisions log

- **Loader: yes, ~2.7s.** The counter starts from an inline script placed immediately after
  the loader markup, about a second before React finishes hydrating; the engine then adopts
  that running value and clock rather than restarting at zero. Without this the loader could
  not begin until hydration finished, which pushed the total past 3.8s. Its words are the
  hero's words at the same size and position, so the handoff reads as one gesture.
  `MIN`/`MAX` in `src/engine/loader.ts` bound the whole visible sequence, not just the part
  after boot.
- **No WebGL.** The concept is colour and type. GL would be decoration here, and the budget is
  better spent holding 60fps on a mid-range phone.
- **Posters are real photography**, free-license from Unsplash, credited in the footer
  colophon and listed in `public/landing/credits.json`. Brand type is set over the image
  behind a scrim. Never fake app screenshots built from divs.
- **Poster text is always white** regardless of the brand's own ground colour, because it sits
  on a photograph. The brand shows through the accent-coloured price pill and the tint.
- **Idle motion: on**, limited to the hero width axis and the active colour chip.
- **Prices read from `PLANS_CONFIG`** so the page cannot contradict the database.
- **Dropped from the previous attempt:** the near-black ground, the red "hold" stamp, the
  struck-out field, and the FTC penalty section. The honesty guarantee stays as a calm,
  positive section ("what it asks you for") rather than a legal threat.

## QA record

Two full passes, each scored by a fresh critic that saw only screenshots and reports (no
code, no concept card, no earlier score).

| Pass | Weighted | Notes |
|---|---|---|
| 1 | 7.1 | Above Honorable Mention, below the SOTD band |
| 2 | **7.4** | Inside the 7.2–7.6 Site of the Day band |

Fixed between passes, all from critic findings:
- The fixed header overprinted section headings and poster art. It now takes a solid band
  (paper or field, whichever sits under it) with a hairline rule past the hero.
- The ghost button's fill flooded to the colour behind it, so the control vanished under
  the pointer. It now fills with ink on paper and with the field ink on colour.
- Two primary nav targets had sub-pixel hover feedback. They now use the display face and
  the same width-axis gesture as the wordmark and the hero.
- The phone nav deleted the section links instead of adapting them. Added a full-screen
  menu (focus trap, Escape to close, scroll lock) set in the display face on the field.
- The colour rail only re-skinned the hero. One proof poster now follows it too, labelled
  "Your brand", so the concept demonstrates itself further down the page.
- Two section headings left half a row empty. Both now carry a supporting column.

### Pass 3 (owner feedback: "add a loader, real posters, more content")

- **Loader added**, ~2.7s measured from navigation to the sheet lifting, on both desktop and
  a 4x-throttled phone. Note: the shoot report's `loaderMs` reads ~3.4s because it counts
  from before `page.goto`, adds a fixed 400ms wait and blocks on network idle for all five
  photographs. The visitor-facing number is the 2.7s above.
- **Real photography replaced the CSS shapes.** Five Unsplash photographs, one coherent eye,
  credited in the footer and marked for replacement.
- **Two sections added**: who it is for (three honest situations, no invented personas) and
  what it is not (three things the product deliberately does not do).

Pass 3 scored **7.9** by a fresh critic, above the Site of the Day average. Its fix list was
then applied:

- Hero posters lifted so the pair sits optically centred against the h1; the empty band of
  field between the nav and the cards is gone.
- `--muted` darkened #6a655c → #514d46 (6.3:1 → 8.6:1 on paper), halving axe's
  contrast-needs-review count from 47 to 25.
- Images cut from 634 KB to **91 KB**. Three changes: installed `sharp` (without it Next
  silently passes images through unoptimised), enabled AVIF/WebP in `next.config.mjs`, and
  downscaled the sources to 1200px at q72. `sizes` was also corrected — cards render ~280px
  on desktop but were requesting 24vw of a 1440px viewport.
  Note: `audit.txt` still reports 634 KB because it fetches the raw files rather than going
  through `/_next/image`. Browsers receive 91 KB of AVIF, verified by response headers.

Final measurements (throttled mobile unless noted): LCP 1040 ms, CLS 0.004, 60 fps desktop /
50 fps mobile, 0 serious axe violations, 0 console errors, no horizontal overflow, no tap
target under 24 px, skip link first, every focus stop visible, nothing moving under reduced
motion, 0 audit FAILs and 0 WARNs on `/`. All 377 unit tests pass.

### Still open

- `/login` is still the old dark-navy app design, so the page transition resolves into a
  different-looking product. The critic ranked this its top fix twice. It is an auth-route
  restyle rather than landing work, so it is left for a decision.
- The colour rail drives the hero pair and one proof poster. Wiring it to the remaining
  example cards and the Pro plan card would take Creativity from 7 to 8.

Known and out of scope: 13 audit FAILs on pre-existing app routes (`/login`, `/library`,
`/workspace/*`, `/guides/*` missing `<h1>`/`<main>`, over-long titles, em-dash copy tells).
None are on `/` or the 404. `/billing` throws UNAUTHORIZED rather than redirecting for
signed-out visitors, so the Pro CTA routes through `/login?next=/billing`.
