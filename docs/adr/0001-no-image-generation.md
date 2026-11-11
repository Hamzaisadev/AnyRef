# No App-Side Image Generation or Editing

> **Status: SUPERSEDED (2026-11-07) by [ADR 0005: In-App Rendering](./0005-in-app-rendering.md).**
>
> The cost and complexity reasoning below was defensible in October 2026 but no longer
> holds: hosted per-image APIs removed the GPU dependency this ADR guarded against, and
> the "tools users already control" assumption proved false for the target buyer.
> Retained unedited for decision history.

Anyref strictly limits AI interactions to reading images (analyzing references and product photos) and producing structured text prompts; it never generates, edits, or hosts image rendering models directly. Generating posters inside the app would explode infrastructure costs, add complex GPU dependencies, and duplicate specialized third-party tools (Midjourney, Flux, Ideogram) that users already control. Keeping image generation external preserves Anyref as a fast, low-overhead prompt laboratory.
