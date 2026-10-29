# Anyref — Product & UX Specification

Anyref is a private prompt-engineering workspace and library that deconstructs visual reference posters (from Pinterest, Behance, or campaigns) into reusable, structured, fill-in-the-blank image generation prompts tailored to specific brands.

---

## 1. Core Mental Model & Value Proposition

### The Problem
Marketers, brand designers, and solopreneurs collect high-performing poster references but struggle to translate that layout, typography hierarchy, lighting, and art direction into AI generation prompts (Midjourney, Flux, Ideogram). Common pitfalls include:
- Generating accidental brand-drift or inconsistent visual styles.
- Hallucinated dates, coupon codes, and pricing from AI.
- Re-prompting from scratch every time a new product is launched.
- Incompatible compositions (e.g., forcing a tall beverage can into a landscape grid).

### The Anyref Solution
1. **Analyze Reference**: AI inspects only the *layout*, *lighting*, *composition*, and *hierarchy* of an inspiration image.
2. **Extract Slots**: The poster copy is parameterized into typed, validated variables (**Slots**).
3. **Inject Brand DNA**: Brand-specific colors, wordmarks, slogans, and footer rules automatically populate into **Brand Slots**.
4. **Guard Sensitive Content**: Prices, discounts, and dates are marked **Never-Invent**; the system leaves them blank and flags them **Needs You** until typed by a human.
5. **Attach in Flow**: Provides an ordered checklist of external image uploads (Product cutout, Logo mark) so multi-image conditioning in tools like Midjourney or Flux is seamless.
6. **Curate Winners**: Test the prompt externally, paste the result back into Anyref, grade it side-by-side, and mark it a **Winner**. Once marked Winner, the prompt can be reused infinitely for new products with **zero AI API cost**.

---

## 2. Brand Identity & Design System

### 2.1 Color Tokens

| Token | Hex | Role | Contrast Ratio |
|---|---|---|---|
| `--ink` | `#0F1020` | Headings, primary text, dark cards | > 15:1 against paper |
| `--paper` | `#F7F6F2` | Page background, light surfaces | Background |
| `--primary` | `#4B2BFF` | Interactive buttons, active focus rings, brand badges | 4.8:1 against white |
| `--accent` | `#FF8A3D` | Campaign slots, warning badges, highlights | High visibility |
| `--brand-layer` | `#2B7BFF` | Brand-mapped slots in preview and form | Distinctive blue |
| `--layout-layer`| `#9AA0AE` | Fixed layout and negative prompt text | Neutral structure |
| `--success` | `#1E9E6A` | "Winner" status, verified badges | 4.5:1 accessible green |
| `--danger` | `#D64545` | "Failed" status, destructive actions, errors | Accessible alert red |

### 2.2 Typography
- **Headings & Brand Titles**: Inter Tight (600 Semi-Bold / 700 Bold) — high impact, condensed modern editorial tone.
- **Body & UI Controls**: Inter (400 Regular / 500 Medium) — maximum legibility at small sizes.
- **Prompts & Placeholders**: JetBrains Mono (400 Regular / 600 Bold) — monospace clarity for slot boundaries `{{key}}` and conditional blocks `[[?key: ...]]`.

### 2.3 Visual Token Highlighting
In both the Prompt Preview and the Editing Canvas, prompt text is visually parsed into a three-layer color-coded syntax:
- 🟦 **Blue Token (`--brand-layer`)**: Brand Slots automatically pulled from active brand config (e.g. `{{wordmark}}`, `{{colors_primary}}`).
- 🟧 **Orange Token (`--accent`)**: Campaign Slots requiring per-poster customization (e.g. `{{headline}}`, `{{offer_details}}`).
- ⬜ **Gray Text (`--layout-layer`)**: Fixed layout descriptions, camera lens parameters, lighting conditions, and negative constraints.

---

## 3. Screen-by-Screen UX Walkthrough

### 3.1 Brand Manager (`/brands`)
- **Purpose**: Manage visual guidelines for unlimited brands (e.g., *Rewired* for tech/activewear, *Riwayat* for ethnic luxury).
- **Key UX Elements**:
  - **Brand Switcher**: Global navigation dropdown always showing the active brand.
  - **Identity Fields**: Name, "What you sell", Brand Story/Why, Tone of voice.
  - **Palette Manager**: Visual hex swatches with add/remove controls.
  - **Asset Uploader**: SVG/PNG Wordmark and Logo upload with instant thumbnail preview.
  - **Slogans & Footers**: Canonical footer legal text and tagline.
  - **"Never Do" Rules**: Freeform guidelines passed directly to AI prompt generation (e.g., "Never use neon gradients; never show cartoon hands").
  - **Default Slot Values**: Key-value JSON/form editor for preset CTAs (e.g., `cta_text: "SHOP NOW"`).

### 3.2 Generate Studio (`/workspace/generate`)
- **Purpose**: Transform a raw Pinterest/Instagram poster reference into a reusable prompt template.
- **Workflow**:
  1. **Upload Dropzone**: Drag and drop reference image (`.jpg`, `.png`, `.webp`, max 10MB).
  2. **AI Analysis State**: Displays animated scanning skeleton while server extracts layout, composition, and copy.
  3. **Decomposition View**:
     - Left pane: Original Reference image with zoom overlay.
     - Right pane: Generated Prompt Template with syntax highlighting.
  4. **Interactive Slot Editor**:
     - *Promote text*: Highlight any piece of layout text and click **"Make Slot"** to parameterize it.
     - *Collapse slot*: Click any slot chip and select **"Collapse to Text"** to lock it as static layout text.
  5. **Action**: Click **"Save as Entry"** (creates record in `draft` state).

### 3.3 Fill & Prompt Workbench (`/entries/[id]`)
- **Purpose**: Produce a ready-to-run prompt for an upcoming marketing campaign.
- **Workflow**:
  1. **Dynamic Form**: Auto-renders input fields according to the Entry's `slots[]` schema:
     - Short text inputs with character limit progress bars.
     - Dropdown selectors for choice slots.
     - Color pickers for campaign accents.
  2. **Brand Auto-Fill**: All Brand Slots (`brand_field != null`) are pre-populated from the active brand profile with a "Reset to Brand Default" action.
  3. **"Needs You" Alerts**: Any `never_invent` slot (price, discount, launch date) displays a subtle amber badge requiring manual entry before copying.
  4. **Live Final Prompt Preview**: Real-time rendering as the user types; optional blocks `[[?key: ...]]` cleanly vanish if the corresponding slot is blank.
  5. **"Attach in Flow" Checklist**: Ordered visual checklist displayed next to the copy button:
     - `1. [Product Photo]` — High-resolution product cutout.
     - `2. [Brand Logo]` — Transparent brand wordmark.
  6. **One-Tap Copy**: Copies the completed prompt with formatted quotation marks around user copy, showing an immediate feedback toast.

### 3.4 Visual Compare & Winner Vault (`/entries/[id]/compare`)
- **Purpose**: Validate external generation results against the reference and curate the brand library.
- **Workflow**:
  1. **Dual-Panel Inspector**:
     - Left: Original Reference Poster.
     - Right: Result Poster dropzone. Paste image directly from clipboard (`Ctrl+V`) or drag file.
  2. **Status Switcher**:
     - 🏆 **Winner**: Poster nailed the reference layout and brand feel. Unlocks one-click Zero-AI reuse.
     - ⚠️ **Needs Tweak**: Good composition, but needs prompt adjustment or slot rewording.
     - ❌ **Failed**: Reference did not translate well or generator corrupted the composition.
     - 📝 **Draft**: Untested.
  3. **Engineering Notes**: Freeform field to save generator model (e.g., "Flux Schnell step 4", "Midjourney v6.1 --s 250"), seed, or workflow notes.

### 3.5 The Library (`/library`)
- **Purpose**: Centralized asset grid for rapid content production.
- **Workflow**:
  1. Filter by Brand, Status (`Winner`, `Needs Tweak`, `Failed`, `Draft`), and Poster Type (`Sale`, `Launch`, `Festive`, `Announcement`).
  2. Hovering an Entry shows quick metrics (date added, slot count, winner status).
  3. **Instant "Reuse" Button**: Clicking "Reuse" on any Winner immediately opens the Fill Workbench with cleared campaign slots. **Requires zero AI calls and costs \$0.00**.

### 3.6 Autofill Studio (`/workspace/autofill`)
- **Purpose**: Rapid automated prompt population using product photos.
- **Workflow**:
  1. Drop a raw product photo (+ optional campaign brief / note).
  2. AI analyzes product shape, features, and color palette.
  3. **Layout-Fit Detection**:
     - If the reference was tagged `intended_product_shape: 'tall'` and the uploaded product photo is `wide`, the UI raises a prominent **Layout-Fit Warning** with recommendations to avoid awkward crop distortions.
  4. **Review Grid**: Displays proposed slot values tagged with their provenance (`Brand Default`, `AI Guess`, or `Needs You`).
  5. User confirms or overrides values, then copies the rendered prompt.

---

## 4. Accessibility & Interaction Polish (WCAG 2.1 AA)

- **Keyboard Navigation**: All interactive slot chips, dropzones, and copy buttons are fully keyboard operable (`Tab`, `Enter`, `Space`).
- **Focus Rings**: High-contrast 2px solid `--primary` focus rings with 2px offset.
- **Reduced Motion**: All animations (skeleton loading, slot expand/collapse) respect `@media (prefers-reduced-motion: reduce)`.
- **Screen Reader Announcements**: Form validation errors, copy-to-clipboard events, and status changes trigger ARIA live regions (`aria-live="polite"`).
- **Color Independence**: Status badges never rely on color alone; each includes a dedicated icon and descriptive label (`[Winner]`, `[Needs You]`).
