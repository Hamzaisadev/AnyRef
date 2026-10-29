import { z } from 'zod';

export const HexColor = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color code (e.g. #0F1020)');

export const BrandSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(80, 'Name must be at most 80 characters'),
  what_you_sell: z.string().default(''),
  why: z.string().default(''),
  tone: z.string().default(''),
  colors: z.array(HexColor).default([]),
  wordmark: z.string().default(''),
  logo_path: z.string().nullable().optional(),
  footer_text: z.string().default(''),
  slogan: z.string().default(''),
  never_do_rules: z.string().default(''),
  default_values: z.record(z.string(), z.string()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Brand = z.infer<typeof BrandSchema>;

export const CreateBrandInput = BrandSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export type CreateBrandInput = z.infer<typeof CreateBrandInput>;

export const UpdateBrandInput = CreateBrandInput.partial();
export type UpdateBrandInput = z.infer<typeof UpdateBrandInput>;
