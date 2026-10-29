import { z } from 'zod';
import { Slot } from './slot';
import { EntryStatus } from './entry';
import { PosterType, ProductShape } from '../ai/schemas';

// --- Common Param Schemas ---
export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID parameter'),
});

// --- Brand Schemas ---
export const CreateBrandBodySchema = z.object({
  name: z.string().trim().min(1, 'Brand name is required').max(80, 'Brand name max 80 chars'),
  what_you_sell: z.string().trim().max(500).default(''),
  why: z.string().trim().max(500).default(''),
  tone: z.string().trim().max(200).default(''),
  colors: z
    .array(z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be valid hex color'))
    .max(10, 'Maximum 10 colors allowed')
    .default([]),
  wordmark: z.string().trim().max(100).default(''),
  logo_path: z.string().nullable().optional(),
  footer_text: z.string().trim().max(500).default(''),
  slogan: z.string().trim().max(300).default(''),
  never_do_rules: z.string().trim().max(1000).default(''),
  default_values: z.record(z.string(), z.string()).default({}),
});

export const UpdateBrandBodySchema = CreateBrandBodySchema.partial();

// --- Entry Schemas ---
export const ListEntriesQuerySchema = z.object({
  brand_id: z.string().uuid().optional(),
  status: EntryStatus.optional(),
  poster_type: PosterType.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const CreateEntryBodySchema = z.object({
  brand_id: z.string().uuid('Valid brand_id is required'),
  reference_path: z.string().nullable().optional(),
  result_path: z.string().nullable().optional(),
  prompt_template: z.string().min(1, 'Prompt template is required').max(10000, 'Prompt template max 10000 chars'),
  slots: z.array(Slot).max(50, 'Max 50 slots allowed').default([]),
  status: EntryStatus.default('draft'),
  poster_type: PosterType.nullable().optional(),
  intended_product_shape: ProductShape.nullable().optional(),
  note: z.string().max(2000).default(''),
  parent_entry_id: z.string().uuid().nullable().optional(),
  system_prompt_version: z.number().int().positive().nullable().optional(),
});

export const UpdateEntryBodySchema = CreateEntryBodySchema.partial();

// --- Generate Schemas ---
export const GenerateRequestBodySchema = z.object({
  brand_id: z.string().uuid('Valid brand_id is required'),
  reference_image_base64: z.string().min(10, 'Reference image is required').max(15_000_000, 'Image payload too large'),
  mime_type: z.enum(['image/png', 'image/jpeg', 'image/webp']).default('image/jpeg'),
});

// --- Autofill Schemas ---
export const AutofillRequestBodySchema = z.object({
  brand_id: z.string().uuid('Valid brand_id is required'),
  entry_id: z.string().uuid('Valid entry_id is required'),
  product_photo_base64: z.string().min(10, 'Product photo is required').max(15_000_000, 'Photo payload too large'),
  mime_type: z.enum(['image/png', 'image/jpeg', 'image/webp']).default('image/jpeg'),
  user_hint: z.string().max(300).optional(),
});

// --- Upload Schemas ---
export const UploadBucketSchema = z.enum(['references', 'results', 'logos']);
