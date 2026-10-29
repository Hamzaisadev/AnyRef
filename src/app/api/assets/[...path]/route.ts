import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { createAdminClient } from '@/lib/supabaseServer';
import { withErrorHandler } from '@/lib/apiHandler';
import { ValidationError, ForbiddenError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const ALLOWED_BUCKETS = new Set(['references', 'results', 'logos']);

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const { path } = await context.params;

    if (!path || path.length < 2) {
      throw new ValidationError('Invalid asset path format. Expected /api/assets/[bucket]/[userId]/[filename]');
    }

    const bucket = path[0] || '';
    if (!ALLOWED_BUCKETS.has(bucket)) {
      throw new ValidationError(`Invalid bucket "${bucket}". Allowed buckets: references, results, logos.`);
    }

    let ownerId = user.id;
    let filename = '';

    if (path.length >= 3) {
      ownerId = path[1] || '';
      filename = path.slice(2).join('/');
    } else {
      // 2 elements: [bucket, filename]
      filename = path[1] || '';
    }

    if (!ownerId || !filename) {
      throw new ValidationError('Invalid asset path: missing owner or filename.');
    }

    // Ownership verification: user can access their own assets, staff (owner/admin) can access any
    if (ownerId !== user.id && user.role !== 'owner' && user.role !== 'admin') {
      throw new ForbiddenError('Access denied: You do not have permission to view this asset.');
    }

    const storagePath = `${ownerId}/${filename}`;
    const admin = createAdminClient();

    // Check file existence and generate fresh signed URL (valid for 5 minutes)
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(storagePath, 300);

    if (error || !data?.signedUrl) {
      throw new NotFoundError(`Asset "${filename}" in bucket "${bucket}" not found.`);
    }

    const url = new URL(request.url);
    const wantsJson = url.searchParams.get('json') === 'true' ||
      request.headers.get('accept')?.includes('application/json');

    if (wantsJson) {
      return NextResponse.json({
        bucket,
        path: storagePath,
        signed_url: data.signedUrl,
      });
    }

    return NextResponse.redirect(data.signedUrl, 307);
  });
}
