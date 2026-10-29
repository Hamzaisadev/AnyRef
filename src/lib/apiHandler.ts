import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { requestContextStorage } from './supabaseServer';

export function withErrorHandler(
  handler: () => Promise<NextResponse>,
  request?: Request
): Promise<NextResponse> {
  const authHeader = request?.headers.get('authorization');
  const run = () =>
    handler().catch((err: unknown) => {
      if (err instanceof AppError) {
        return NextResponse.json(
          {
            error: {
              code: err.code,
              message: err.message,
              details: err.details,
            },
          },
          { status: err.statusCode }
        );
      }

      console.error('[Unhandled API Error]:', err);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: err instanceof Error ? err.message : 'An unexpected server error occurred',
          },
        },
        { status: 500 }
      );
    });

  if (authHeader) {
    return requestContextStorage.run({ authHeader }, run);
  }
  return run();
}
