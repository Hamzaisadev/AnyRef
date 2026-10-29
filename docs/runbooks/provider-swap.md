# Runbook: AI Provider Swap & Engine Versioning

This runbook describes how to swap the active LLM vision provider (e.g. from Gemini to Claude or OpenAI) and how to update and version system prompts in Anyref.

---

## 1. Changing Provider via Configuration

Anyref abstracts model providers behind `AiProvider`. To switch between supported providers:

1. Update `.env.local` (or production environment variables in Vercel):
   ```env
   AI_PROVIDER=claude        # options: 'gemini' | 'claude'
   AI_MODEL=claude-3-5-sonnet-20241022
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
2. Restart the development server or trigger a Vercel redeployment:
   ```bash
   pnpm dev
   ```
3. Test provider health:
   ```bash
   pnpm test tests/integration/aiProvider.test.ts
   ```

---

## 2. Implementing a New AI Provider

To add a new provider (e.g., `openaiProvider.ts`):

1. **Implement `AiProvider` interface** in `src/ai/openaiProvider.ts`:
   ```ts
   import { AiProvider, GenerateInput, GenerateOutput, AutofillInput, AutofillOutput } from './AiProvider';

   export class OpenAiProvider implements AiProvider {
     name = 'openai';

     async generateTemplate(input: GenerateInput): Promise<GenerateOutput> {
       // Call OpenAI API with response_format = json_schema
     }

     async autofillSlots(input: AutofillInput): Promise<AutofillOutput> {
       // Call OpenAI vision API
     }
   }
   ```
2. **Register in Factory** (`src/ai/getAiProvider.ts`):
   ```ts
   case 'openai':
     return new OpenAiProvider(env.OPENAI_API_KEY, env.AI_MODEL);
   ```
3. **Add Environment Validation** in `src/lib/env.ts` with Zod.
4. **Write unit test** verifying schema parsing and structured output validation in `tests/unit/openaiProvider.test.ts`.

---

## 3. System Prompt Versioning

Engine prompts are version-controlled in the `system_prompts` table so existing entries can always reference the exact prompt version that generated them.

1. When revising system prompt instructions:
   - Do **NOT** mutate existing rows in `system_prompts`.
   - Increment the `version` integer for the `purpose` (`generate` or `autofill`).
2. Insert the new version via migration or admin script:
   ```sql
   insert into system_prompts (user_id, version, purpose, body)
   values (
     '<user-id>',
     2,
     'generate',
     'Updated system prompt instructions...'
   );
   ```
3. Update `env.ts` or default prompt config to point new generations to version `2`.
