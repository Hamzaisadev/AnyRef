import 'server-only';
import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    BILLING_WEBHOOK_SECRET: z.string().optional(),
    AI_PROVIDER: z.enum(['gemini', 'claude']).default('gemini'),
    AI_MODEL: z
      .string({ required_error: 'AI_MODEL is required' })
      .trim()
      .min(1, 'AI_MODEL is required and cannot be empty')
      .refine((val) => !val.endsWith('-latest'), {
        message: 'AI_MODEL must be a pinned model identifier and cannot end with "-latest"',
      }),
    AI_INPUT_PRICE_PER_1M_USD: z.coerce.number().nonnegative().default(0.30),
    AI_OUTPUT_PRICE_PER_1M_USD: z.coerce.number().nonnegative().default(2.50),
    // Image rendering (closes the loop in-app instead of exporting to Midjourney/Flux).
    AI_IMAGE_MODEL: z
      .string()
      .trim()
      .min(1)
      .refine((val) => !val.endsWith('-latest'), {
        message: 'AI_IMAGE_MODEL must be a pinned model identifier and cannot end with "-latest"',
      })
      .default('gemini-3-pro-image'),
    // Flat cost per rendered image. Image models bill per-image, not per-token.
    AI_IMAGE_PRICE_PER_IMAGE_USD: z.coerce.number().nonnegative().default(0.134),
    ENABLE_RENDER: z.coerce.boolean().default(true),
    GEMINI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    AI_DAILY_CALL_LIMIT: z.coerce.number().int().positive().default(50),
    AI_DAILY_COST_CAP_USD: z.coerce.number().positive().default(2.0),
    MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),
    OWNER_EMAIL: z.string().email().optional(),
    ADMIN_MFA_REQUIRED: z.coerce.boolean().default(true),
    NEXT_PUBLIC_ENABLE_ADS: z.coerce.boolean().default(true),
  })
  .transform((data) => {
    const key = data.NEXT_PUBLIC_SUPABASE_ANON_KEY || data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    const isProd = (data.NODE_ENV ?? process.env.NODE_ENV) === 'production';
    return {
      ...data,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      SUPABASE_SERVICE_ROLE_KEY: data.SUPABASE_SERVICE_ROLE_KEY || (isProd ? '' : key),
      CRON_SECRET: data.CRON_SECRET || (isProd ? '' : 'test_cron_secret'),
      BILLING_WEBHOOK_SECRET: data.BILLING_WEBHOOK_SECRET || (isProd ? '' : 'test_webhook_secret'),
    };
  })
  .superRefine((data, ctx) => {
    const isProd = (data.NODE_ENV ?? process.env.NODE_ENV) === 'production';

    if (isProd) {
      if (!data.SUPABASE_SERVICE_ROLE_KEY || data.SUPABASE_SERVICE_ROLE_KEY === data.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SUPABASE_SERVICE_ROLE_KEY'],
          message: 'SUPABASE_SERVICE_ROLE_KEY must be a distinct, non-empty secret in production',
        });
      }
      if (!data.CRON_SECRET || data.CRON_SECRET === 'test_cron_secret') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CRON_SECRET'],
          message: 'CRON_SECRET is required and cannot be a test placeholder in production',
        });
      }
      if (!data.BILLING_WEBHOOK_SECRET || data.BILLING_WEBHOOK_SECRET === 'test_webhook_secret') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['BILLING_WEBHOOK_SECRET'],
          message: 'BILLING_WEBHOOK_SECRET is required and cannot be a test placeholder in production',
        });
      }
    }

    if (data.AI_PROVIDER === 'gemini' && (!data.GEMINI_API_KEY || data.GEMINI_API_KEY.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GEMINI_API_KEY'],
        message: 'GEMINI_API_KEY is required when AI_PROVIDER is "gemini"',
      });
    }
    if (data.AI_PROVIDER === 'claude' && (!data.ANTHROPIC_API_KEY || data.ANTHROPIC_API_KEY.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ANTHROPIC_API_KEY'],
        message: 'ANTHROPIC_API_KEY is required when AI_PROVIDER is "claude"',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`[Anyref Env] Environment configuration validation failed:\n${errorDetails}`);
  }
  return result.data;
}

let cachedEnv: Env | null = null;

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!cachedEnv) {
      cachedEnv = validateEnv(process.env);
    }
    return (cachedEnv as unknown as Record<string, unknown>)[prop];
  },
});
