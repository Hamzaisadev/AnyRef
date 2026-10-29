import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { autofillService } from '@/services/autofillService';
import { withErrorHandler } from '@/lib/apiHandler';
import { ValidationError } from '@/lib/errors';
import { z } from 'zod';

const EntryIdSchema = z.string().uuid('Valid entry_id UUID is required');

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser();

    const formData = await request.formData();
    const rawEntryId = formData.get('entry_id');
    const photoFile = formData.get('product_photo');
    const hint = formData.get('hint');

    const entryId = EntryIdSchema.parse(rawEntryId);

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
