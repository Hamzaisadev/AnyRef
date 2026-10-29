import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { entryService } from '@/services/entryService';
import { withErrorHandler } from '@/lib/apiHandler';
import { UuidParamSchema, UpdateEntryBodySchema } from '@/domain/apiSchemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const rawParams = await context.params;
    const { id } = UuidParamSchema.parse(rawParams);
    const entry = await entryService.getEntry(user.id, id);
    return NextResponse.json({ entry });
  }, request);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const rawParams = await context.params;
    const { id } = UuidParamSchema.parse(rawParams);
    const rawBody = await request.json();
    const validatedBody = UpdateEntryBodySchema.parse(rawBody);
    const entry = await entryService.updateEntry(user.id, id, validatedBody);
    return NextResponse.json({ entry });
  }, request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const rawParams = await context.params;
    const { id } = UuidParamSchema.parse(rawParams);
    await entryService.deleteEntry(user.id, id);
    return NextResponse.json({ success: true });
  }, request);
}
