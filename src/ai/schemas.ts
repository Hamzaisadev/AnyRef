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
