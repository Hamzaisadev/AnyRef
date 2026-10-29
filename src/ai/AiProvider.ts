import type { Brand } from '../domain/brand';
import type { Slot } from '../domain/slot';
import type { GenerateOutput, AutofillOutput } from './schemas';

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

export type GenerateResult = GenerateOutput & {
  usage?: AiUsage;
};

export type AutofillResult = AutofillOutput & {
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

export interface AiProvider {
  name: string;
  generateTemplate(input: GenerateInput): Promise<GenerateResult>;
  autofillSlots(input: AutofillInput): Promise<AutofillResult>;
}
