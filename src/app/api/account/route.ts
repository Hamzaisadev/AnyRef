import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import {
  getAccountDeletionStatus,
  requestAccountDeletion,
  cancelAccountDeletion,
} from '@/services/accountService';
import { withErrorHandler } from '@/lib/apiHandler';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser(request, { allowPendingDeletion: true });
    const deletionStatus = await getAccountDeletionStatus(user.id);

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        plan_id: user.plan_id,
        tos_version: user.tos_version,
        tos_accepted_at: user.tos_accepted_at,
        age_confirmed_at: user.age_confirmed_at,
      },
      deletionStatus,
    });
  }, request);
}

export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const userAgent = request.headers.get('user-agent') || undefined;

    const deletionStatus = await requestAccountDeletion(user.id, { ip, userAgent });

    return NextResponse.json({
      success: true,
      deletionStatus,
    });
  }, request);
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser(request, { allowPendingDeletion: true });
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action !== 'cancel' && action !== 'cancel_deletion') {
      throw new BadRequestError('Invalid action. Supported actions: "cancel".');
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const userAgent = request.headers.get('user-agent') || undefined;

    const deletionStatus = await cancelAccountDeletion(user.id, { ip, userAgent });

    return NextResponse.json({
      success: true,
      deletionStatus,
    });
  }, request);
}
