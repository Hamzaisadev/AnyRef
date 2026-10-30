import { describe, it, expect } from 'vitest';
import {
  verifyImageMagicBytes,
  stripJpegExif,
  parseImageDimensions,
  AssetService,
} from '@/services/assetService';
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

  it('correctly strips EXIF APP1 metadata segment from JPEG images', () => {
    // SOI (FF D8) + APP1 (FF E1, length 8, 'Exif\0\0') + DQT (FF DB, length 4, 00 00) + SOF0 (FF C0, length 11, 8bit, 100x200, 3 components) + EOI (FF D9)
    const exifData = Buffer.from('Exif\0\0');
    const app1Length = 2 + exifData.length;
    const app1Header = Buffer.from([0xff, 0xe1, (app1Length >> 8) & 0xff, app1Length & 0xff]);

    const jpegWithExif = Buffer.concat([
      Buffer.from([0xff, 0xd8]), // SOI
      app1Header,
      exifData,
      Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x00, 0x64, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]), // 100x200
      Buffer.from([0xff, 0xd9]), // EOI
    ]);

    const validated = service.validateUpload(jpegWithExif, 'image/jpeg');
    // Buffer should no longer contain APP1 marker
    expect(validated.buffer.includes(Buffer.from([0xff, 0xe1]))).toBe(false);
    expect(validated.width).toBe(100);
    expect(validated.height).toBe(200);
  });

  it('rejects images with pixel dimensions exceeding MAX_IMAGE_DIMENSION_PX (8192x8192)', () => {
    // PNG header with 10,000 x 500 dimensions (bytes 16-19: 0x00 0x00 0x27 0x10, bytes 20-23: 0x00 0x00 0x01 0xf4)
    const giantPng = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]),
      Buffer.from([0x00, 0x00, 0x27, 0x10, 0x00, 0x00, 0x01, 0xf4, 0x08, 0x06, 0x00, 0x00, 0x00]),
    ]);

    expect(() => service.validateUpload(giantPng, 'image/png')).toThrow(ValidationError);
    expect(() => service.validateUpload(giantPng, 'image/png')).toThrow(/exceeds the maximum allowed limit/);
  });

  it('correctly strips EXIF when preceded by 0xFF fill/padding bytes', () => {
    const exifData = Buffer.from('Exif\0\0');
    const app1Length = 2 + exifData.length;
    const jpegWithFillExif = Buffer.concat([
      Buffer.from([0xff, 0xd8]), // SOI
      Buffer.from([0xff, 0xff, 0xe1, (app1Length >> 8) & 0xff, app1Length & 0xff]), // Fill byte + APP1
      exifData,
      Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x00, 0x64, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]),
      Buffer.from([0xff, 0xd9]),
    ]);

    const stripped = stripJpegExif(jpegWithFillExif);
    expect(stripped.includes(Buffer.from([0xff, 0xe1]))).toBe(false);

    const dims = parseImageDimensions(stripped, 'image/jpeg');
    expect(dims).toEqual({ width: 100, height: 200 });
  });

  it('strips multiple consecutive and non-consecutive APP1 segments (EXIF + XMP)', () => {
    const exifData = Buffer.from('Exif\0\0');
    const app1ExifLen = 2 + exifData.length;
    const xmpData = Buffer.from('http://ns.adobe.com/xap/1.0/\0');
    const app1XmpLen = 2 + xmpData.length;

    const jpegWithMultiApp1 = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xe1, (app1ExifLen >> 8) & 0xff, app1ExifLen & 0xff]),
      exifData,
      Buffer.from([0xff, 0xdb, 0x00, 0x04, 0x00, 0x00]), // DQT
      Buffer.from([0xff, 0xe1, (app1XmpLen >> 8) & 0xff, app1XmpLen & 0xff]),
      xmpData,
      Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x00, 0x64, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]),
      Buffer.from([0xff, 0xd9]),
    ]);

    const stripped = stripJpegExif(jpegWithMultiApp1);
    expect(stripped.includes(Buffer.from([0xff, 0xe1]))).toBe(false);
  });

  it('rejects oversized JPEG images (>8192px)', () => {
    const giantJpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x27, 0x10, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]), // 10000x200
      Buffer.from([0xff, 0xd9]),
    ]);

    expect(() => service.validateUpload(giantJpeg, 'image/jpeg')).toThrow(ValidationError);
    expect(() => service.validateUpload(giantJpeg, 'image/jpeg')).toThrow(/exceeds the maximum allowed limit/);
  });

  it('parses dimensions and enforces 8192px limit across VP8, VP8L, and VP8X WebP formats', () => {
    // 1. Lossy VP8
    const vp8Header = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x20, 0x10, 0x00, 0x00, 0x00]),
      Buffer.from([0x00, 0x00, 0x00]),
      Buffer.from([0x9d, 0x01, 0x2a]),
      Buffer.from([0x64, 0x00]), // width = 100
      Buffer.from([0xc8, 0x00]), // height = 200
    ]);
    expect(parseImageDimensions(vp8Header, 'image/webp')).toEqual({ width: 100, height: 200 });

    const giantVp8 = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x20, 0x10, 0x00, 0x00, 0x00]),
      Buffer.from([0x00, 0x00, 0x00, 0x9d, 0x01, 0x2a]),
      Buffer.from([0x00, 0x25]), // width = 9472 (> 8192)
      Buffer.from([0xc8, 0x00]),
    ]);
    expect(() => service.validateUpload(giantVp8, 'image/webp')).toThrow(ValidationError);

    // 2. Lossless VP8L
    const vp8lHeader = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x4c, 0x10, 0x00, 0x00, 0x00]),
      Buffer.from([0x2f]), // 0x2F signature
      Buffer.from([0x63, 0xc0, 0x31, 0x00]), // 100x200
    ]);
    expect(parseImageDimensions(vp8lHeader, 'image/webp')).toEqual({ width: 100, height: 200 });

    const giantVp8l = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x4c, 0x10, 0x00, 0x00, 0x00]),
      Buffer.from([0x2f]),
      Buffer.from([0xff, 0x3f, 0x00, 0x00]), // 16384x1
    ]);
    expect(() => service.validateUpload(giantVp8l, 'image/webp')).toThrow(ValidationError);

    // 3. Extended VP8X
    const vp8xHeader = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x58, 0x0a, 0x00, 0x00, 0x00]),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from([0x63, 0x00, 0x00]), // 100
      Buffer.from([0xc7, 0x00, 0x00]), // 200
    ]);
    expect(parseImageDimensions(vp8xHeader, 'image/webp')).toEqual({ width: 100, height: 200 });

    const giantVp8x = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x58, 0x0a, 0x00, 0x00, 0x00]),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from([0x0f, 0x27, 0x00]), // 10000 width
      Buffer.from([0xc7, 0x00, 0x00]),
    ]);
    expect(() => service.validateUpload(giantVp8x, 'image/webp')).toThrow(ValidationError);
  });

  it('gracefully handles corrupt or truncated marker segments without crashing', () => {
    // 1. Corrupt length field < 2
    const corruptJpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xe0, 0x00, 0x00]),
      Buffer.from([0xff, 0xd9]),
    ]);
    const stripped = stripJpegExif(corruptJpeg);
    expect(stripped.length).toBeGreaterThanOrEqual(2);

    // 2. Standalone RST markers before SOF
    const jpegWithRst = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xd0]), // RST0
      Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x00, 0x64, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]),
      Buffer.from([0xff, 0xd9]),
    ]);
    expect(parseImageDimensions(jpegWithRst, 'image/jpeg')).toEqual({ width: 100, height: 200 });

    // 3. Corrupt WebP VP8L signature returns null
    const corruptVp8l = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x4c, 0x10, 0x00, 0x00, 0x00]),
      Buffer.from([0x00]), // bad signature
      Buffer.from([0x63, 0xc0, 0x31, 0x00]),
    ]);
    expect(parseImageDimensions(corruptVp8l, 'image/webp')).toBeNull();
  });
});

