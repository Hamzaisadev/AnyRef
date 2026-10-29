import 'server-only';
import { z } from 'zod';

export const envSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    AI_PROVIDER: z.enum(['gemini', 'claude']).default('gemini'),
    AI_MODEL: z.string().min(1, 'AI_MODEL is required').default('gemini-flash-latest'),
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
    return {
      ...data,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      SUPABASE_SERVICE_ROLE_KEY: data.SUPABASE_SERVICE_ROLE_KEY || key,
    };
  })
  .superRefine((data, ctx) => {
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
