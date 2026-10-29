import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { exportUserData } from '@/services/exportService';
import { withErrorHandler } from '@/lib/apiHandler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const userAgent = request.headers.get('user-agent') || undefined;

    const data = await exportUserData(user.id, { ip, userAgent });

    const filename = `anyref-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }, request);
}
