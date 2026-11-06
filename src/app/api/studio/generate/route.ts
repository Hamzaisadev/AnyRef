import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { studioService } from '@/services/studioService';
import { withErrorHandler } from '@/lib/apiHandler';
import { ValidationError } from '@/lib/errors';
import { z } from 'zod';

const StudioFormSchema = z.object({
  brand_id: z.string().uuid().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  aspect_ratio: z.enum(['9:16', '1:1', '16:9', '4:5', '3:4']).optional(),
  target_engine: z.enum(['midjourney', 'flux', 'ideogram', 'universal']).optional(),
  hint: z.string().max(500).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
});

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);

    const formData = await request.formData();
    const referenceFile = formData.get('reference');
    const productFile = formData.get('product');

    if (!referenceFile || !(referenceFile instanceof Blob)) {
      throw new ValidationError('Missing required file: reference poster image (field "reference")');
    }

    if (!productFile || !(productFile instanceof Blob)) {
      throw new ValidationError('Missing required file: product image (field "product")');
    }

    // Pre-check file size limits before loading full array buffers into RAM
    const maxUploadMb = Number(process.env.MAX_UPLOAD_MB) || 10;
    const maxUploadBytes = maxUploadMb * 1024 * 1024;
    if (referenceFile.size > maxUploadBytes) {
      throw new ValidationError(`Reference image exceeds maximum allowed size of ${maxUploadMb}MB`);
    }
    if (productFile.size > maxUploadBytes) {
      throw new ValidationError(`Product image exceeds maximum allowed size of ${maxUploadMb}MB`);
    }

    const parsedOptions = StudioFormSchema.parse({
      brand_id: formData.get('brand_id') || undefined,
      aspect_ratio: formData.get('aspect_ratio') || undefined,
      target_engine: formData.get('target_engine') || undefined,
      hint: formData.get('hint') || undefined,
    });

    const [refArrayBuffer, prodArrayBuffer] = await Promise.all([
      referenceFile.arrayBuffer(),
      productFile.arrayBuffer(),
    ]);

    const referenceBuffer = Buffer.from(refArrayBuffer);
    const productBuffer = Buffer.from(prodArrayBuffer);

    const referenceMimeType = referenceFile.type || 'image/jpeg';
    const productMimeType = productFile.type || 'image/png';

    const proposal = await studioService.generate(
      user.id,
      referenceBuffer,
      referenceMimeType,
      productBuffer,
      productMimeType,
      {
        brandId: parsedOptions.brand_id,
        aspectRatio: parsedOptions.aspect_ratio,
        targetEngine: parsedOptions.target_engine,
        hint: parsedOptions.hint,
      }
    );

    return NextResponse.json({ proposal });
  }, request);
}
