import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { entryService } from '@/services/entryService';
import { withErrorHandler } from '@/lib/apiHandler';
import { EntryStatus } from '@/domain/entry';
import { PosterType } from '@/ai/schemas';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const brand_id = searchParams.get('brand_id') || undefined;
    const rawStatus = searchParams.get('status');
    const rawType = searchParams.get('poster_type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const status = rawStatus ? EntryStatus.parse(rawStatus) : undefined;
    const poster_type = rawType ? PosterType.parse(rawType) : undefined;

    const entries = await entryService.listEntries(user.id, {
      brand_id,
      status,
      poster_type,
      limit,
      offset,
    });

    return NextResponse.json({ entries });
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const body = await request.json();
    const entry = await entryService.createEntry(user.id, body);
    return NextResponse.json({ entry }, { status: 201 });
  });
}
