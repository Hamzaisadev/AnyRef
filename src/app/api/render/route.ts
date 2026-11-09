import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { renderService } from '@/services/renderService';
import { SupabaseEntryRepo } from '@/data/entryRepo';
import { withErrorHandler } from '@/lib/apiHandler';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const AspectRatioSchema = z.enum(['1:1', '4:5', '9:16', '16:9', '3:4']).default('1:1');

const ValuesSchema = z.record(z.string().max(500)).default({});

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser();

    const formData = await request.formData();

    const rawEntryId = formData.get('entry_id');
    const entryId = z.string().uuid('Valid entry_id UUID is required').parse(rawEntryId);

    const rawValues = formData.get('values');
    let values: Record<string, string> = {};
    if (typeof rawValues === 'string' && rawValues.trim() !== '') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawValues);
      } catch {
        throw new ValidationError('values must be a valid JSON object of slot_key -> string');
      }
      values = ValuesSchema.parse(parsed);
    }

    const aspectRatio = AspectRatioSchema.parse(formData.get('aspect_ratio') || undefined);

    // Optional product photo: processed in memory, never persisted.
    const productFile = formData.get('product_photo');
    let productBuffer: Buffer | undefined;
    let productMimeType: string | undefined;
    if (productFile && typeof productFile !== 'string') {
      productBuffer = Buffer.from(await productFile.arrayBuffer());
      productMimeType = productFile.type || 'image/jpeg';
    }

    const entryRepo = new SupabaseEntryRepo();
    const entry = await entryRepo.findById(user.id, entryId);
    if (!entry) {
      throw new NotFoundError(`Entry "${entryId}" not found or unauthorized.`);
    }

    const outcome = await renderService.render(
      user.id,
      entry.prompt_template,
      entry.slots,
      values,
      {
        entryId: entry.id,
        brandId: entry.brand_id,
        aspectRatio,
        referencePath: entry.reference_path || undefined,
        productBuffer,
        productMimeType,
      }
    );

    // A blocked render is a successful, expected outcome of the honesty guard —
    // not a server error. 200 with an explicit status keeps the client simple.
    return NextResponse.json({ render: outcome });
  });
}
