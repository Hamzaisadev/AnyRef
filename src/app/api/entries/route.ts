import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { entryService } from '@/services/entryService';
import { withErrorHandler } from '@/lib/apiHandler';
import { ListEntriesQuerySchema, CreateEntryBodySchema } from '@/domain/apiSchemas';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const queryData = {
      brand_id: searchParams.get('brand_id') || undefined,
      status: searchParams.get('status') || undefined,
      poster_type: searchParams.get('poster_type') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    };

    const validatedQuery = ListEntriesQuerySchema.parse(queryData);

    const entries = await entryService.listEntries(user.id, {
      brand_id: validatedQuery.brand_id,
      status: validatedQuery.status,
      poster_type: validatedQuery.poster_type,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
    });

    return NextResponse.json({ entries });
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const rawBody = await request.json();
    const validatedBody = CreateEntryBodySchema.parse(rawBody);
    const entry = await entryService.createEntry(user.id, validatedBody);
    return NextResponse.json({ entry }, { status: 201 });
  });
}
