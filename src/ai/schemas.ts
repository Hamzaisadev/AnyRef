import { z } from 'zod';
import { Slot } from '../domain/slot';

export const PosterType = z.enum(['sale', 'launch', 'festive', 'announcement', 'other']);
export type PosterType = z.infer<typeof PosterType>;

export const ProductShape = z.enum(['wide', 'tall', 'square', 'any']);
export type ProductShape = z.infer<typeof ProductShape>;

export const GenerateOutput = z.object({
  prompt_template: z.string().min(200).max(6000),
  slots: z.array(Slot).max(20),
  poster_type: PosterType,
  intended_product_shape: ProductShape,
  layout_notes: z.string().max(500),
});
export type GenerateOutput = z.infer<typeof GenerateOutput>;

export const AutofillOutput = z.object({
  values: z.record(
    z.string(),
    z.object({
      value: z.string(),
      source: z.enum(['ai', 'brand_default']),
      confidence: z.enum(['high', 'medium', 'low']),
    })
  ),
  needs_you: z.array(z.string()),
  product_shape: z.enum(['wide', 'tall', 'square', 'other']),
  product_guess: z.string().max(120),
});
export type AutofillOutput = z.infer<typeof AutofillOutput>;

export const FieldSource = z.enum(['you_said', 'inferred', 'suggested', 'empty']);
export type FieldSource = z.infer<typeof FieldSource>;

export const Field = <T extends z.ZodTypeAny>(v: T) =>
  z.object({
    value: v,
    source: FieldSource,
    note: z.string().max(120).optional(),
  });

export const BrandDraftOutput = z.object({
  name: Field(z.string().max(80)),
  what_you_sell: Field(z.string().max(600)),
  why: Field(z.string().max(600)),
  tone: Field(z.string().max(300)),
  colors: Field(z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(6)),
  wordmark: Field(z.string().max(60)),
  slogan: Field(z.string().max(120)),
  footer_text: Field(z.string().max(160)),
  never_do_rules: Field(z.string().max(600)),
  default_values: Field(z.record(z.string().max(40), z.string().max(120)).default({})),
  missing: z.array(z.string()).max(10),
});
export type BrandDraftOutput = z.infer<typeof BrandDraftOutput>;

