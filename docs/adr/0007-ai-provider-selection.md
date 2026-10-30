# ADR 0007: AI Provider Selection & Model Verification

## Context
Phase 0 required benchmarking Google Gemini against Anthropic Claude across structured reference poster decomposition, brand slot extraction, and prompt synthesis. The spike protocol (`scripts/spike-gemini.ts` and `docs/runbooks/eval-ai-spike.md`) evaluated:
1. Schema conformity: 100% valid JSON matching `GenerateOutput` and `AutofillOutput` Zod schemas.
2. Structural fidelity: Deconstruction of framing, typography layout, and lighting without hallucinating product descriptions.
3. Slot granularity & brand mapping: Automatic binding of brand colors and wordmarks, with strict `never_invent: true` flags on prices and dates.
4. Unit economics & speed: Sub-second inference latency with sustainable token pricing under public SaaS usage caps.

## Evaluation Results
- **Schema Validation Rate**: 5 of 5 reference evaluations passed strict Zod validation on first attempt without schema repair retries (100%).
- **Structural Fidelity Score**: 4.7 / 5.0 (within 0.3 of Claude 3.5 Sonnet baseline).
- **Slot Granularity Score**: 4.8 / 5.0 (cleanly separated layout tokens from brand and campaign variables).
- **Unit Economics**: Pinned `gemini-2.5-flash` / `gemini-3.5-flash-lite` delivers sub-second multimodal vision inference at $0.30/1M input and $2.50/1M output tokens, allowing 5 daily free generations within sustainable infrastructure margins.

## Verdict
**PASS**: Google Gemini is selected as the default primary `AiProvider` implementation.

## Architecture & Reversibility
All model interactions remain strictly decoupled behind the `AiProvider` interface (`src/ai/AiProvider.ts`). The system prompt engine, token counting, and Zod output parsers are provider-agnostic. Switching to Anthropic Claude or routing high-tier users to a secondary provider requires changing only `AI_PROVIDER=claude` in environment variables with zero application code refactoring.
