import { describe, it, expect } from 'vitest';
import { verifyImageMagicBytes, AssetService } from '@/services/assetService';
import { ValidationError } from '@/lib/errors';

describe('verifyImageMagicBytes', () => {
  it('correctly identifies PNG images by 89 50 4E 47 0D 0A 1A 0A header', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const result = verifyImageMagicBytes(pngHeader);
    expect(result.isValid).toBe(true);
    expect(result.mimeType).toBe('image/png');
    expect(result.extension).toBe('png');
  });

  it('correctly identifies JPEG images by FF D8 FF header', () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const result = verifyImageMagicBytes(jpegHeader);
    expect(result.isValid).toBe(true);
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.extension).toBe('jpg');
  });

  it('correctly identifies WebP images by RIFF....WEBP header', () => {
    const webpHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // 'RIFF'
      0x24, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // 'WEBP'
      0x56, 0x50, 0x38, 0x20, // 'VP8 '
    ]);
    const result = verifyImageMagicBytes(webpHeader);
    expect(result.isValid).toBe(true);
    expect(result.mimeType).toBe('image/webp');
    expect(result.extension).toBe('webp');
  });

  it('explicitly rejects SVG image files', () => {
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
    const result = verifyImageMagicBytes(svgBuffer);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('SVG and script-based image formats are prohibited');
  });

  it('explicitly rejects HTML and polyglot script payloads masquerading as images', () => {
    const htmlPayload = Buffer.from('<!DOCTYPE html><html><script>alert(1)</script></html>');
    const result = verifyImageMagicBytes(htmlPayload);
    expect(result.isValid).toBe(false);
  });

  it('rejects truncated or empty buffers (< 12 bytes)', () => {
    const tiny = Buffer.from([0x89, 0x50, 0x4e]);
    const result = verifyImageMagicBytes(tiny);
    expect(result.isValid).toBe(false);
  });
});

describe('AssetService', () => {
  const service = new AssetService(2); // 2 MB limit for test

  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
  ]);

  it('validates authentic PNG file within size limit', () => {
    const validated = service.validateUpload(validPngBuffer, 'image/png');
    expect(validated.mimeType).toBe('image/png');
    expect(validated.extension).toBe('png');
  });

  it('throws ValidationError when file exceeds MAX_UPLOAD_MB limit', () => {
    const oversizeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3 MB (limit is 2 MB)
    // Pretend it has a valid PNG header
    validPngBuffer.copy(oversizeBuffer, 0, 0, 16);

    expect(() => service.validateUpload(oversizeBuffer, 'image/png')).toThrow(ValidationError);
    expect(() => service.validateUpload(oversizeBuffer, 'image/png')).toThrow(/exceeds maximum upload limit/);
  });

  it('throws ValidationError on MIME spoofing (claimed JPEG, but bytes are PNG)', () => {
    expect(() => service.validateUpload(validPngBuffer, 'image/jpeg')).toThrow(ValidationError);
    expect(() => service.validateUpload(validPngBuffer, 'image/jpeg')).toThrow(/MIME mismatch/);
  });

  it('uploads image and produces user-scoped random storage path and signed URL', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const result = await service.uploadImage(userId, 'references', validPngBuffer, 'image/png');

    expect(result.path.startsWith(`${userId}/`)).toBe(true);
    expect(result.path.endsWith('.png')).toBe(true);
    expect(result.mimeType).toBe('image/png');
    expect(result.signedUrl).toBeDefined();
  });
});
