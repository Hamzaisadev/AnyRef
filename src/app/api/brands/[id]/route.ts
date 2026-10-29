import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { brandService } from '@/services/brandService';
import { withErrorHandler } from '@/lib/apiHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const brand = await brandService.getBrand(user.id, id);
    return NextResponse.json({ brand });
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    const brand = await brandService.updateBrand(user.id, id, body);
    return NextResponse.json({ brand });
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    await brandService.deleteBrand(user.id, id);
    return NextResponse.json({ success: true });
  });
}
