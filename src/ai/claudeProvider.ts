import {
  AiProvider,
  GenerateInput,
  AutofillInput,
  BrandDraftInput,
  StudioGenerateInput,
  GenerateResult,
  AutofillResult,
  BrandDraftResult,
  StudioGenerateResult,
  AiUsage,
} from './AiProvider';
import { GenerateOutput, AutofillOutput, BrandDraftOutput, StudioGenerateOutput } from './schemas';
import { AiInvalidOutputError, AiProviderError } from '../lib/errors';
import {
  parseJsonFromLlm,
  normalizeGenerateOutput,
  normalizeAutofillOutput,
  normalizeBrandDraftOutput,
  normalizeStudioOutput,
  GENERATE_OUTPUT_SCHEMA_INSTRUCTION,
  AUTOFILL_OUTPUT_SCHEMA_INSTRUCTION,
  STUDIO_OUTPUT_SCHEMA_INSTRUCTION,
  DEFAULT_GENERATE_SYSTEM_PROMPT,
  DEFAULT_AUTOFILL_SYSTEM_PROMPT,
  DEFAULT_BRAND_DRAFT_SYSTEM_PROMPT,
  DEFAULT_STUDIO_SYSTEM_PROMPT,
} from './geminiProvider';

interface AnthropicContentBlockText {
  type: 'text';
  text: string;
}

interface AnthropicContentBlockImage {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

type AnthropicContentBlock = AnthropicContentBlockText | AnthropicContentBlockImage;

function sanitizeMediaType(mimeType: string): string {
  const lower = (mimeType || '').toLowerCase().trim();
  if (lower === 'image/jpg' || lower === 'jpg') return 'image/jpeg';
  if (lower === 'png') return 'image/png';
  if (lower === 'webp') return 'image/webp';
  return lower || 'image/jpeg';
}

export class ClaudeProvider implements AiProvider {
  name = 'claude';
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = process.env.AI_MODEL || 'claude-3-7-sonnet-20250219') {
    const trimmedModel = modelName.trim();
    if (!trimmedModel || trimmedModel.endsWith('-latest')) {
      throw new Error(
        `Invalid AI_MODEL "${modelName}": AI_MODEL is required and must not end in "-latest".`
      );
    }
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('ANTHROPIC_API_KEY is required to initialize ClaudeProvider');
    }
    this.apiKey = apiKey.trim();
    this.modelName = trimmedModel;
  }

  private async callAnthropic(params: {
    system?: string;
    content: AnthropicContentBlock[];
    maxTokens?: number;
  }): Promise<{ text: string; usage: AiUsage }> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelName,
        max_tokens: params.maxTokens || 4096,
        system: params.system,
        messages: [
          {
            role: 'user',
            content: params.content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new AiProviderError(`Anthropic API request failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find((c: any) => c.type === 'text');
    const text = textBlock ? textBlock.text : '';
    const usage: AiUsage = {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    };

    return { text, usage };
  }

  async generateTemplate(input: GenerateInput): Promise<GenerateResult> {
    const systemPrompt = input.systemPrompt || DEFAULT_GENERATE_SYSTEM_PROMPT;
    const brandPayload = `BRAND PROFILE:\n${JSON.stringify(input.brand, null, 2)}`;

    const content: AnthropicContentBlock[] = [
      {
        type: 'text',
        text: `${brandPayload}\n\nPlease generate the poster prompt template. Ensure you return ONLY valid JSON matching the schema instruction.`,
      },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: sanitizeMediaType(input.mimeType),
          data: input.imageBuffer.toString('base64'),
        },
      },
    ];

    let attempts = 0;
    let lastValidationError: unknown = null;

    while (attempts < 2) {
      attempts++;
      try {
        const contentToSend = [...content];
        if (attempts > 1 && lastValidationError) {
          contentToSend.push({
            type: 'text',
            text: `PREVIOUS OUTPUT WAS INVALID SCHEMA. Please fix the following errors:\n${JSON.stringify(
              lastValidationError
            )}\nEnsure output strictly conforms to schema:\n${GENERATE_OUTPUT_SCHEMA_INSTRUCTION}`,
          });
        }

        const { text, usage } = await this.callAnthropic({
          system: systemPrompt,
          content: contentToSend,
        });

        const parsedJson = parseJsonFromLlm(text);
        const normalized = normalizeGenerateOutput(parsedJson);
        const validation = GenerateOutput.safeParse(normalized);

        if (validation.success) {
          return {
            ...validation.data,
            usage,
          };
        }

        lastValidationError = validation.error.format();
      } catch (err: unknown) {
        if (attempts >= 2) {
          throw new AiProviderError(
            `Claude API generation failed: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }

    throw new AiInvalidOutputError(
      'AI model produced output that does not conform to GenerateOutput schema after retry.',
      lastValidationError
    );
  }

  async autofillSlots(input: AutofillInput): Promise<AutofillResult> {
    const systemPrompt = input.systemPrompt || DEFAULT_AUTOFILL_SYSTEM_PROMPT;
    const textPrompt = `BRAND PROFILE:\n${JSON.stringify(input.brand, null, 2)}\n\nSLOT SCHEMA:\n${JSON.stringify(
      input.slots,
      null,
      2
    )}${input.hint ? `\nHINT: ${input.hint}` : ''}`;

    const content: AnthropicContentBlock[] = [
      {
        type: 'text',
        text: textPrompt,
      },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: sanitizeMediaType(input.mimeType),
          data: input.imageBuffer.toString('base64'),
        },
      },
    ];

    let attempts = 0;
    let lastValidationError: unknown = null;

    while (attempts < 2) {
      attempts++;
      try {
        const contentToSend = [...content];
        if (attempts > 1 && lastValidationError) {
          contentToSend.push({
            type: 'text',
            text: `PREVIOUS OUTPUT WAS INVALID SCHEMA. Please fix the following errors:\n${JSON.stringify(
              lastValidationError
            )}\nEnsure output strictly conforms to schema:\n${AUTOFILL_OUTPUT_SCHEMA_INSTRUCTION}`,
          });
        }

        const { text, usage } = await this.callAnthropic({
          system: systemPrompt,
          content: contentToSend,
        });

        const parsedJson = parseJsonFromLlm(text);
        const normalized = normalizeAutofillOutput(parsedJson);
        const validation = AutofillOutput.safeParse(normalized);

        if (validation.success) {
          return {
            ...validation.data,
            usage,
          };
        }

        lastValidationError = validation.error.format();
      } catch (err: unknown) {
        if (attempts >= 2) {
          throw new AiProviderError(
            `Claude API autofill failed: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }

    throw new AiInvalidOutputError(
      'AI model produced output that does not conform to AutofillOutput schema after retry.',
      lastValidationError
    );
  }

  async draftBrand(input: BrandDraftInput): Promise<BrandDraftResult> {
    const systemPrompt = input.systemPrompt || DEFAULT_BRAND_DRAFT_SYSTEM_PROMPT;
    const content: AnthropicContentBlock[] = [
      {
        type: 'text',
        text: `USER BUSINESS DESCRIPTION:\n${input.description}`,
      },
    ];

    if (input.imageBuffer && input.mimeType) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: sanitizeMediaType(input.mimeType),
          data: input.imageBuffer.toString('base64'),
        },
      });
    }

    let attempts = 0;
    let lastValidationError: unknown = null;

    while (attempts < 2) {
      attempts++;
      try {
        const contentToSend = [...content];
        if (attempts > 1 && lastValidationError) {
          contentToSend.push({
            type: 'text',
            text: `PREVIOUS OUTPUT WAS INVALID SCHEMA. Please fix the following errors:\n${JSON.stringify(
              lastValidationError
            )}`,
          });
        }

        const { text, usage } = await this.callAnthropic({
          system: systemPrompt,
          content: contentToSend,
        });

        const parsedJson = parseJsonFromLlm(text);
        const normalized = normalizeBrandDraftOutput(parsedJson);
        const validation = BrandDraftOutput.safeParse(normalized);

        if (validation.success) {
          return {
            ...validation.data,
            usage,
          };
        }

        lastValidationError = validation.error.format();
      } catch (err: unknown) {
        if (attempts >= 2) {
          throw new AiProviderError(
            `Claude API brand drafting failed: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }

    throw new AiInvalidOutputError(
      'AI model produced output that does not conform to BrandDraftOutput schema after retry.',
      lastValidationError
    );
  }

  async generateStudio(input: StudioGenerateInput): Promise<StudioGenerateResult> {
    const systemPrompt = input.systemPrompt || DEFAULT_STUDIO_SYSTEM_PROMPT;
    const textNotes: string[] = [];
    if (input.brand) {
      textNotes.push(`BRAND PROFILE:\n${JSON.stringify(input.brand, null, 2)}`);
    }
    if (input.aspectRatio) {
      textNotes.push(`TARGET ASPECT RATIO: ${input.aspectRatio}`);
    }
    if (input.targetEngine) {
      textNotes.push(`PRIMARY TARGET ENGINE: ${input.targetEngine}`);
    }
    if (input.hint) {
      textNotes.push(`USER CREATIVE HINT / COPY PREFERENCES:\n${input.hint}`);
    }

    const content: AnthropicContentBlock[] = [
      {
        type: 'text',
        text: `Analyze both images below and create high-converting marketing copy and prompt instructions.\n${textNotes.join(
          '\n\n'
        )}`,
      },
      {
        type: 'text',
        text: 'IMAGE 1: REFERENCE POSTER (analyze composition, lighting, spatial depth):',
      },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: sanitizeMediaType(input.referenceMimeType),
          data: input.referenceBuffer.toString('base64'),
        },
      },
      {
        type: 'text',
        text: 'IMAGE 2: USER HERO PRODUCT (feature this exact product):',
      },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: sanitizeMediaType(input.productMimeType),
          data: input.productBuffer.toString('base64'),
        },
      },
    ];

    let attempts = 0;
    let lastValidationError: unknown = null;

    while (attempts < 2) {
      attempts++;
      try {
        const contentToSend = [...content];
        if (attempts > 1 && lastValidationError) {
          contentToSend.push({
            type: 'text',
            text: `PREVIOUS OUTPUT WAS INVALID SCHEMA. Please fix the following errors:\n${JSON.stringify(
              lastValidationError
            )}\nEnsure output strictly conforms to schema:\n${STUDIO_OUTPUT_SCHEMA_INSTRUCTION}`,
          });
        }

        const { text, usage } = await this.callAnthropic({
          system: systemPrompt,
          content: contentToSend,
        });

        const parsedJson = parseJsonFromLlm(text);
        const normalized = normalizeStudioOutput(parsedJson);
        const validation = StudioGenerateOutput.safeParse(normalized);

        if (validation.success) {
          return {
            ...validation.data,
            usage,
          };
        }

        lastValidationError = validation.error.format();
      } catch (err: unknown) {
        if (attempts >= 2) {
          throw new AiProviderError(
            `Claude API studio generation failed: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }

    throw new AiInvalidOutputError(
      'AI model produced output that does not conform to StudioGenerateOutput schema after retry.',
      lastValidationError
    );
  }
}
