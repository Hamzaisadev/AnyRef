import type { Brand } from '../domain/brand';
import type { Slot } from '../domain/slot';
import type { GenerateOutput, AutofillOutput, BrandDraftOutput, StudioGenerateOutput } from './schemas';

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
}

export type GenerateResult = GenerateOutput & {
  usage?: AiUsage;
};

export type AutofillResult = AutofillOutput & {
  usage?: AiUsage;
};

export type BrandDraftResult = BrandDraftOutput & {
  usage?: AiUsage;
};

export type StudioGenerateResult = StudioGenerateOutput & {
  usage?: AiUsage;
};

export interface GenerateInput {
  imageBuffer: Buffer;
  mimeType: string;
  brand: Brand;
  systemPrompt?: string;
}

export interface AutofillInput {
  imageBuffer: Buffer;
  mimeType: string;
  brand: Brand;
  slots: Slot[];
  hint?: string;
  systemPrompt?: string;
}

export interface BrandDraftInput {
  description: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  systemPrompt?: string;
}

export interface StudioGenerateInput {
  referenceBuffer: Buffer;
  referenceMimeType: string;
  productBuffer: Buffer;
  productMimeType: string;
  brand?: Brand | null;
  aspectRatio?: string;
  targetEngine?: 'midjourney' | 'flux' | 'ideogram' | 'universal';
  hint?: string;
  systemPrompt?: string;
}

export type RenderAspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | '3:4';

export interface RenderImageInput {
  /** Final, fully substituted prompt. Must have passed evaluateRenderGuard. */
  prompt: string;
  aspectRatio: RenderAspectRatio;
  /**
   * Reference images passed to the model for layout and brand fidelity.
   * Order matters and mirrors the Attach Checklist the user used to carry
   * into Midjourney by hand — now applied automatically.
   */
  attachments?: Array<{
    buffer: Buffer;
    mimeType: string;
    /** Why this image is attached, so the model knows how to use it. */
    role: 'reference_layout' | 'product' | 'logo';
  }>;
}

export interface RenderImageResult {
  imageBuffer: Buffer;
  mimeType: string;
  model: string;
  /** Image models bill per image, not per token. */
  imageCount: number;
  usage?: AiUsage;
}

export interface AiProvider {
  name: string;
  generateTemplate(input: GenerateInput): Promise<GenerateResult>;
  autofillSlots(input: AutofillInput): Promise<AutofillResult>;
  draftBrand(input: BrandDraftInput): Promise<BrandDraftResult>;
  generateStudio?(input: StudioGenerateInput): Promise<StudioGenerateResult>;
  /**
   * Renders the poster in-app. Optional so a provider without an image model
   * (e.g. the Claude fallback) degrades to prompt-export mode rather than crashing.
   */
  renderImage?(input: RenderImageInput): Promise<RenderImageResult>;
}


