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

/**
 * Pre-seeds slot values from:
 * 1. Brand-mapped fields (`resolveBrandSlotValue`)
 * 2. Brand `default_values`
 * 3. Slot `default`
 * before overlaying AI autofill values and initializing `needs_you` slots.
 */
export function buildInitialAutofillValues(
  slots: Slot[],
  brand: Brand | null | undefined,
  result: {
    values?: Record<string, { value: string; source?: string; confidence?: string }>;
    needs_you?: string[];
  }
): Record<string, string> {
  const initial: Record<string, string> = {};

  // 1. Pre-seed from brand-mapped fields, brand default_values, and slot defaults
  for (const slot of slots) {
    const brandFieldVal = brand ? resolveBrandSlotValue(slot, brand) : undefined;
    const brandDefaultVal = brand?.default_values?.[slot.key];
    const slotDefaultVal = slot.default;

    if (brandFieldVal) {
      initial[slot.key] = brandFieldVal;
    } else if (brandDefaultVal) {
      initial[slot.key] = brandDefaultVal;
    } else if (slotDefaultVal) {
      initial[slot.key] = slotDefaultVal;
    }
  }

  // 2. Overlay AI extracted values
  if (result.values) {
    for (const [k, v] of Object.entries(result.values)) {
      if (v && typeof v.value === 'string') {
        initial[k] = v.value;
      }
    }
  }

  // 3. Ensure needs_you keys exist in initial (keeping brand default if one was explicitly configured, else empty)
  if (result.needs_you) {
    for (const k of result.needs_you) {
      if (initial[k] === undefined) {
        initial[k] = '';
      }
    }
  }

  return initial;
}

