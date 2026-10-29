import { config } from 'dotenv';
import { resolve } from 'path';
import { validateEnv } from '../src/lib/env';

// Load .env.local if present, else default .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

console.log('🔍 Checking Anyref environment configuration...\n');

try {
  const parsedEnv = validateEnv(process.env);
  console.log('✅ Environment configuration is valid!');
  console.log(`   - AI Provider: ${parsedEnv.AI_PROVIDER}`);
  console.log(`   - AI Model: ${parsedEnv.AI_MODEL}`);
  console.log(`   - Daily Call Limit: ${parsedEnv.AI_DAILY_CALL_LIMIT}`);
  console.log(`   - Daily Budget Cap: $${parsedEnv.AI_DAILY_COST_CAP_USD}`);
  console.log(`   - Supabase URL: ${parsedEnv.NEXT_PUBLIC_SUPABASE_URL}`);
  process.exit(0);
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error('Unknown environment validation error:', err);
  }
  process.exit(1);
}
