import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { assetService } from '@/services/assetService';
import { withErrorHandler } from '@/lib/apiHandler';
import { ValidationError } from '@/lib/errors';
import { UploadBucketSchema } from '@/domain/apiSchemas';

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const formData = await request.formData();

    const file = formData.get('file');
    const bucketRaw = formData.get('bucket');

    if (!file || !(file instanceof File)) {
      throw new ValidationError('A valid file must be provided in the form field "file".');
    }

    const bucketParse = UploadBucketSchema.safeParse(bucketRaw || 'references');
    if (!bucketParse.success) {
      throw new ValidationError('Invalid bucket. Permitted: references, results, logos.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await assetService.uploadImage(
      user.id,
      bucketParse.data,
      buffer,
      file.type
    );

    return NextResponse.json(
      {
        path: uploadResult.path,
        signed_url: uploadResult.signedUrl,
        mime_type: uploadResult.mimeType,
      },
      { status: 201 }
    );
  });
}
