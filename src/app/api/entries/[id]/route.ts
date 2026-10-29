import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { entryService } from '@/services/entryService';
import { withErrorHandler } from '@/lib/apiHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const entry = await entryService.getEntry(user.id, id);
    return NextResponse.json({ entry });
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    const entry = await entryService.updateEntry(user.id, id, body);
    return NextResponse.json({ entry });
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    await entryService.deleteEntry(user.id, id);
    return NextResponse.json({ success: true });
  });
}
