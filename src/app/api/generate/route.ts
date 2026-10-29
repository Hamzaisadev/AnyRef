import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { generateService } from '@/services/generateService';
import { withErrorHandler } from '@/lib/apiHandler';
import { ValidationError } from '@/lib/errors';
import { z } from 'zod';

const BrandIdSchema = z.string().uuid('Valid brand_id UUID is required');

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser();

    const formData = await request.formData();
    const rawBrandId = formData.get('brand_id');
    const referenceFile = formData.get('reference');

    const brandId = BrandIdSchema.parse(rawBrandId);

    if (!referenceFile || !(referenceFile instanceof Blob)) {
      throw new ValidationError('Missing required file: reference poster image');
    }

    const arrayBuffer = await referenceFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = referenceFile.type || 'image/jpeg';

    const proposal = await generateService.generate(user.id, brandId, buffer, mimeType);

    return NextResponse.json({ proposal });
  });
}
