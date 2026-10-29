import { z } from 'zod';

export const SlotType = z.enum([
  'short_text',
  'number',
  'date',
  'choice',
  'color',
  'attachment',
]);
export type SlotType = z.infer<typeof SlotType>;

export const Slot = z.object({
  key: z
    .string()
    .regex(/^[a-z][a-z0-9_]{1,40}$/, 'Key must be lower snake_case starting with a letter, 2-40 chars'),
  label: z.string().max(60),
  type: SlotType,
  max_length: z.number().int().positive().max(200).optional(),
  required: z.boolean(),
  hint: z.string().max(160).optional(),
  brand_field: z
    .enum(['wordmark', 'colors_primary', 'colors_secondary', 'footer_text', 'slogan', 'name'])
    .nullable(),
  default: z.string().optional(),
  options: z.array(z.string()).optional(),
  optional_block: z.boolean(),
  never_invent: z.boolean().default(false),
  attachment_order: z.number().int().positive().optional(),
});

export type Slot = z.infer<typeof Slot>;

import type { Brand } from './brand';

export function resolveBrandSlotValue(slot: Slot, brand: Brand): string | undefined {
  if (!slot.brand_field) return undefined;
  switch (slot.brand_field) {
    case 'colors_primary':
      return brand.colors?.[0];
    case 'colors_secondary':
      return brand.colors?.[1];
    case 'wordmark':
      return brand.wordmark || undefined;
    case 'name':
      return brand.name || undefined;
    case 'footer_text':
      return brand.footer_text || undefined;
    case 'slogan':
      return brand.slogan || undefined;
    default:
      return undefined;
  }
}
