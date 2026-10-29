import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { brandService } from '@/services/brandService';
import { withErrorHandler } from '@/lib/apiHandler';
import { UuidParamSchema, UpdateBrandBodySchema } from '@/domain/apiSchemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const rawParams = await context.params;
    const { id } = UuidParamSchema.parse(rawParams);
    const brand = await brandService.getBrand(user.id, id);
    return NextResponse.json({ brand });
  }, request);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const rawParams = await context.params;
    const { id } = UuidParamSchema.parse(rawParams);
    const rawBody = await request.json();
    const validatedBody = UpdateBrandBodySchema.parse(rawBody);
    const brand = await brandService.updateBrand(user.id, id, validatedBody);
    return NextResponse.json({ brand });
  }, request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const rawParams = await context.params;
    const { id } = UuidParamSchema.parse(rawParams);
    await brandService.deleteBrand(user.id, id);
    return NextResponse.json({ success: true });
  }, request);
}
