import { z } from 'zod';
import { Slot } from './slot';
import { PosterType, ProductShape } from '../ai/schemas';

export const EntryStatus = z.enum(['draft', 'winner', 'needs_tweak', 'failed']);
export type EntryStatus = z.infer<typeof EntryStatus>;

export const EntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  brand_id: z.string().uuid(),
  reference_path: z.string().nullable().optional(),
  result_path: z.string().nullable().optional(),
  prompt_template: z.string().min(1, 'Prompt template is required'),
  slots: z.array(Slot).default([]),
  status: EntryStatus.default('draft'),
  poster_type: PosterType.nullable().optional(),
  intended_product_shape: ProductShape.nullable().optional(),
  note: z.string().default(''),
  parent_entry_id: z.string().uuid().nullable().optional(),
  system_prompt_version: z.number().int().positive().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Entry = z.infer<typeof EntrySchema>;

export const CreateEntryInput = EntrySchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
}).partial({
  status: true,
  note: true,
  slots: true,
});

export type CreateEntryInput = z.infer<typeof CreateEntryInput>;

export const UpdateEntryInput = CreateEntryInput.partial();
export type UpdateEntryInput = z.infer<typeof UpdateEntryInput>;

export interface EntryFilters {
  brand_id?: string;
  status?: EntryStatus;
  poster_type?: PosterType;
  limit?: number;
  offset?: number;
}
