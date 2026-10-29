import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { autofillService } from '@/services/autofillService';
import { withErrorHandler } from '@/lib/apiHandler';
import { ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser();

    const formData = await request.formData();
    const entryId = formData.get('entry_id');
    const photoFile = formData.get('product_photo');
    const hint = formData.get('hint');

    if (!entryId || typeof entryId !== 'string') {
      throw new ValidationError('Missing required field: entry_id');
    }

    if (!photoFile || !(photoFile instanceof Blob)) {
      throw new ValidationError('Missing required file: product_photo image');
    }

    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = photoFile.type || 'image/jpeg';
    const optionalHint = typeof hint === 'string' ? hint : undefined;

    const result = await autofillService.autofill(user.id, entryId, buffer, mimeType, optionalHint);

    return NextResponse.json({ result });
  });
}
