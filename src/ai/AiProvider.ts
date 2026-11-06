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

export interface AiProvider {
  name: string;
  generateTemplate(input: GenerateInput): Promise<GenerateResult>;
  autofillSlots(input: AutofillInput): Promise<AutofillResult>;
  draftBrand(input: BrandDraftInput): Promise<BrandDraftResult>;
  generateStudio?(input: StudioGenerateInput): Promise<StudioGenerateResult>;
}


