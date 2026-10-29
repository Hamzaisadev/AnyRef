# Anyref

A private prompt-library web application that turns Pinterest reference posters into reusable, structured image-generation prompts tailored to specific brands.

## Language

**Brand**:
A distinct business identity with defined visual and verbal guidelines (name, colors, wordmark, logo, slogan, and rules).
_Avoid_: Account, client, tenant, profile

**Entry**:
A saved prompt record within a Brand, linking a reference poster to an AI-derived prompt template, configurable slots, and optional result posters.
_Avoid_: Prompt, template, card, post, item

**Reference Poster**:
An uploaded image of a marketing poster used as a visual guide for layout, composition, lighting, and hierarchy.
_Avoid_: Inspiration, sample, source image, input poster

**Result Poster**:
An image generated externally by the user (e.g., via Midjourney, Flux, or Ideogram) and pasted back into an Entry for visual comparison and grading.
_Avoid_: Output, generated image, render, poster result

**Prompt Template**:
A structured text string containing placeholder tokens (`{{key}}`) and conditional blocks (`[[?key: ...]]`) that produces a generation prompt when rendered.
_Avoid_: Formula, recipe, boilerplate, base prompt

**Slot**:
A typed placeholder variable within a Prompt Template that accepts user input, brand defaults, or AI autofill values.
_Avoid_: Parameter, argument, variable, field

**Brand Slot**:
A Slot whose value is automatically derived from a Brand's stored properties (such as wordmark, primary color, or slogan).
_Avoid_: Static slot, default field

**Campaign Slot**:
A Slot whose value is specific to a marketing campaign or single poster iteration (such as discount percentage or product headline).
_Avoid_: Custom slot, user slot, transient field

**Layout Text**:
Fixed, non-substitutable descriptive text within a Prompt Template specifying framing, camera angle, lighting, and negative prompts.
_Avoid_: Static text, boiler text, system instructions

**Needs You**:
A state applied to required or sensitive Slots (such as prices, dates, or discounts) that AI is strictly prohibited from inventing and that require human input.
_Avoid_: Missing, incomplete, pending, unvalidated

**Never-Invent Slot**:
A Slot classified as sensitive (e.g. monetary prices, percentage discounts, or calendar dates) where automatic AI values are forbidden by policy and must be supplied explicitly by the user or pre-configured brand defaults.
_Avoid_: Protected slot, restricted slot, sensitive slot

**Attach Checklist**:
An ordered guide rendered with the final prompt specifying which visual assets to upload to the external generator in exact sequence (e.g. Asset 1: Product cutout, Asset 2: Brand wordmark).
_Avoid_: Upload list, media instructions, asset queue

**Layout-Fit Warning**:
A real-time visual alert triggered when the physical aspect ratio of an uploaded product photo conflicts with the intended composition shape of the reference poster (e.g. uploading a tall beverage can into a wide banner layout).
_Avoid_: Dimension mismatch, sizing error, aspect alert

**Slot Highlighting**:
The tri-color visual encoding used across the interface to classify prompt tokens: blue for Brand Slots, orange for Campaign Slots, and gray for fixed Layout Text.
_Avoid_: Syntax coloring, token badges, markup tags

**Winner**:
An Entry status indicating that the prompt template has been tested, approved, and proven to produce production-grade poster outputs ready for reuse.
_Avoid_: Favorite, starred, approved, verified
