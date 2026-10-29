import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { brandService } from '@/services/brandService';
import { withErrorHandler } from '@/lib/apiHandler';

export async function GET() {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const brands = await brandService.listBrands(user.id);
    return NextResponse.json({ brands });
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser();
    const body = await request.json();
    const brand = await brandService.createBrand(user.id, body);
    return NextResponse.json({ brand }, { status: 201 });
  });
}
