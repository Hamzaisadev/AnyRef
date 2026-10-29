import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { entryService } from '@/services/entryService';
import { withErrorHandler } from '@/lib/apiHandler';
import { UuidParamSchema } from '@/domain/apiSchemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const rawParams = await context.params;
    const { id } = UuidParamSchema.parse(rawParams);
    const remixed = await entryService.remixEntry(user.id, id);
    return NextResponse.json({ entry: remixed }, { status: 201 });
  });
}
