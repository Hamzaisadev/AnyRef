import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { brandService } from '@/services/brandService';
import { withErrorHandler } from '@/lib/apiHandler';
import { CreateBrandBodySchema } from '@/domain/apiSchemas';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const brands = await brandService.listBrands(user.id);
    return NextResponse.json({ brands });
  }, request);
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const rawBody = await request.json();
    const validatedBody = CreateBrandBodySchema.parse(rawBody);
    const brand = await brandService.createBrand(user.id, validatedBody);
    return NextResponse.json({ brand }, { status: 201 });
  }, request);
}
