import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { brandDraftService } from '@/services/brandDraftService';
import { withErrorHandler } from '@/lib/apiHandler';
import { ValidationError, TooManyRequestsError } from '@/lib/errors';
import { z } from 'zod';

const DraftRequestBodySchema = z.object({
  description: z.string({ required_error: 'Description is required' }),
  logo_path: z.string().nullable().optional(),
});

// In-memory sliding window rate limiter: 10 calls per minute per user/IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(key: string): void {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    throw new TooManyRequestsError(
      'Rate limit exceeded. Please wait a minute before requesting another brand draft.'
    );
  }

  record.count++;
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. Auth required, verifies email and account status
    const user = await requireUser(request);

    // 2. Rate-limit by user and IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';

    checkRateLimit(`ip:${ip}`);
    checkRateLimit(`user:${user.id}`);

    // 3. Parse and validate body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new ValidationError('Invalid JSON request body.');
    }

    const parseResult = DraftRequestBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      const details = parseResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new ValidationError(`Validation failed: ${details}`);
    }

    // 4. Call BrandDraftService
    const result = await brandDraftService.draftBrand(user, {
      description: parseResult.data.description,
      logo_path: parseResult.data.logo_path,
    });

    return NextResponse.json(result);
  }, request);
}
