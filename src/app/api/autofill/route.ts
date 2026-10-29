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
    const photoEntries = formData.getAll('product_photo');
    const hint = formData.get('hint');

    const entryId = EntryIdSchema.parse(rawEntryId);
    const photoFiles = photoEntries.filter((f): f is Blob => f instanceof Blob);

    if (photoFiles.length === 0) {
      throw new ValidationError('Missing required file: product_photo image');
    }

    const optionalHint = typeof hint === 'string' ? hint : undefined;

    if (photoFiles.length === 1) {
      const photoFile = photoFiles[0]!;
      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = photoFile.type || 'image/jpeg';

      const result = await autofillService.autofill(user.id, entryId, buffer, mimeType, optionalHint);
      return NextResponse.json({ result, results: [result] });
    }

    const batchItems = await Promise.all(
      photoFiles.map(async (photoFile) => {
        const arrayBuffer = await photoFile.arrayBuffer();
        return {
          entryId,
          imageBuffer: Buffer.from(arrayBuffer),
          mimeType: photoFile.type || 'image/jpeg',
          hint: optionalHint,
        };
      })
    );

    const results = await autofillService.autofillBatch(user.id, batchItems);
    return NextResponse.json({ result: results[0] ?? null, results });
  });
}
