import { describe, it, expect } from 'vitest';
import { stripJpegExif, parseImageDimensions, AssetService } from '@/services/assetService';
import { ValidationError } from '@/lib/errors';

describe('Break the prior attempt: Edge Cases & Vulnerability Tests', () => {
  const service = new AssetService(2);

  it('BREAK-1: stripJpegExif fails to strip EXIF when preceded by 0xFF fill byte', () => {
    // SOI (FF D8) + fill byte (FF FF E1) + Exif payload + SOF0 + EOI
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
    // Must NOT contain APP1 marker 0xff 0xe1
    expect(stripped.includes(Buffer.from([0xff, 0xe1]))).toBe(false);
  });

  it('BREAK-2: parseImageDimensions fails when fill byte precedes SOF marker', () => {
    const jpegWithFillSof = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x00, 0x64, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]), // 100x200
      Buffer.from([0xff, 0xd9]),
    ]);

    const dimensions = parseImageDimensions(jpegWithFillSof, 'image/jpeg');
    expect(dimensions).not.toBeNull();
    expect(dimensions?.width).toBe(100);
    expect(dimensions?.height).toBe(200);
  });

  it('BREAK-3: JPEG with multiple APP1 segments (EXIF + XMP) strips all APP1 segments', () => {
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

  it('BREAK-4: Rejects JPEG with dimensions exceeding MAX_IMAGE_DIMENSION_PX', () => {
    // 10,000 width x 200 height JPEG SOF0
    const giantJpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x27, 0x10, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]),
      Buffer.from([0xff, 0xd9]),
    ]);

    expect(() => service.validateUpload(giantJpeg, 'image/jpeg')).toThrow(ValidationError);
    expect(() => service.validateUpload(giantJpeg, 'image/jpeg')).toThrow(/exceeds the maximum allowed limit/);
  });

  it('BREAK-5: Parses WebP VP8 (lossy) dimensions and enforces limit', () => {
    // WebP VP8 header:
    // RIFF (4) + Size (4) + WEBP (4) + VP8 (4) + ChunkSize (4) + FrameTag (3) + SyncCode (3) + Width (2) + Height (2)
    const vp8Header = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]), // RIFF....WEBP
      Buffer.from([0x56, 0x50, 0x38, 0x20, 0x10, 0x00, 0x00, 0x00]), // 'VP8 ', size 16
      Buffer.from([0x00, 0x00, 0x00]), // frame tag (keyframe)
      Buffer.from([0x9d, 0x01, 0x2a]), // sync code
      Buffer.from([0x64, 0x00]), // width = 100
      Buffer.from([0xc8, 0x00]), // height = 200
    ]);

    const dimensions = parseImageDimensions(vp8Header, 'image/webp');
    expect(dimensions).not.toBeNull();
    expect(dimensions?.width).toBe(100);
    expect(dimensions?.height).toBe(200);

    const giantVp8 = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x20, 0x10, 0x00, 0x00, 0x00]),
      Buffer.from([0x00, 0x00, 0x00]), // frame tag
      Buffer.from([0x9d, 0x01, 0x2a]), // sync code
      Buffer.from([0x00, 0x25]), // width = 0x2500 = 9472 (> 8192)
      Buffer.from([0xc8, 0x00]),
    ]);

    expect(() => service.validateUpload(giantVp8, 'image/webp')).toThrow(ValidationError);
  });

  it('BREAK-6: parseImageDimensions correctly handles standalone RST markers before SOF', () => {
    const jpegWithRst = Buffer.concat([
      Buffer.from([0xff, 0xd8]), // SOI
      Buffer.from([0xff, 0xd0]), // RST0 (standalone, no length field)
      Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x00, 0x64, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]), // 100x200
      Buffer.from([0xff, 0xd9]),
    ]);

    const dimensions = parseImageDimensions(jpegWithRst, 'image/jpeg');
    expect(dimensions).not.toBeNull();
    expect(dimensions?.width).toBe(100);
    expect(dimensions?.height).toBe(200);
  });

  it('BREAK-7: Parses WebP VP8L (lossless) dimensions and enforces limit', () => {
    // WebP VP8L: RIFF (12) + VP8L (8) + 0x2F (1) + 4 bytes bitstream header
    // Header bits: 14 bits width, 14 bits height
    // For 100 width: 100 - 1 = 99 = 0x0063.
    // b1 = 0x63, b2 = 0x00
    // For 200 height: 200 - 1 = 199 = 0x00c7 = 0000 0000 1100 0111
    // b2 bits 6-7 = bits 0-1 of 199 = 3 (0b11) -> b2 = (3 << 6) | 0x00 = 0xc0
    // b3 = bits 2-9 of 199 = 199 >> 2 = 49 = 0x31
    // b4 = bits 10-13 of 199 = 0
    const vp8lValid = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x4c, 0x10, 0x00, 0x00, 0x00]),
      Buffer.from([0x2f]), // Signature 0x2F
      Buffer.from([0x63, 0xc0, 0x31, 0x00]),
    ]);

    const dimensions = parseImageDimensions(vp8lValid, 'image/webp');
    expect(dimensions).not.toBeNull();
    expect(dimensions?.width).toBe(100);
    expect(dimensions?.height).toBe(200);

    // Oversize VP8L (> 8192px): width 16384 (16383 = 0x3FFF)
    const giantVp8l = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x4c, 0x10, 0x00, 0x00, 0x00]),
      Buffer.from([0x2f]),
      Buffer.from([0xff, 0x3f, 0x00, 0x00]), // 16384x1 px
    ]);

    expect(() => service.validateUpload(giantVp8l, 'image/webp')).toThrow(ValidationError);
    expect(() => service.validateUpload(giantVp8l, 'image/webp')).toThrow(/exceeds the maximum allowed limit/);

    // Corrupt signature (0x00 instead of 0x2F) returns null
    const corruptVp8l = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x4c, 0x10, 0x00, 0x00, 0x00]),
      Buffer.from([0x00]), // Invalid signature
      Buffer.from([0x63, 0xc0, 0x31, 0x00]),
    ]);
    expect(parseImageDimensions(corruptVp8l, 'image/webp')).toBeNull();
  });

  it('BREAK-8: Parses WebP VP8X (extended) dimensions and enforces limit', () => {
    // VP8X: RIFF (12) + VP8X (8) + Flags (4) + Canvas Width - 1 (3) + Canvas Height - 1 (3)
    // Width: 100 -> 99 = 0x000063
    // Height: 200 -> 199 = 0x0000C7
    const vp8xValid = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x58, 0x0a, 0x00, 0x00, 0x00]),
      Buffer.from([0x00, 0x00, 0x00, 0x00]), // Flags
      Buffer.from([0x63, 0x00, 0x00]), // Canvas width - 1 (little-endian 24-bit)
      Buffer.from([0xc7, 0x00, 0x00]), // Canvas height - 1 (little-endian 24-bit)
    ]);

    const dimensions = parseImageDimensions(vp8xValid, 'image/webp');
    expect(dimensions).not.toBeNull();
    expect(dimensions?.width).toBe(100);
    expect(dimensions?.height).toBe(200);

    // Giant VP8X (> 8192px): 10,000 width (9999 = 0x00270F)
    const giantVp8x = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
      Buffer.from([0x56, 0x50, 0x38, 0x58, 0x0a, 0x00, 0x00, 0x00]),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from([0x0f, 0x27, 0x00]),
      Buffer.from([0xc7, 0x00, 0x00]),
    ]);

    expect(() => service.validateUpload(giantVp8x, 'image/webp')).toThrow(ValidationError);
    expect(() => service.validateUpload(giantVp8x, 'image/webp')).toThrow(/exceeds the maximum allowed limit/);
  });

  it('BREAK-9: Handles corrupt JPEG streams with invalid marker length fields (< 2)', () => {
    // SOI + APP0 with length field of 0 (invalid: minimum is 2) + SOF0 + EOI
    const corruptJpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xe0, 0x00, 0x00]), // length = 0
      Buffer.from([0xff, 0xd9]),
    ]);

    // Must not crash or infinite loop
    const stripped = stripJpegExif(corruptJpeg);
    expect(stripped).toBeDefined();
    expect(stripped.length).toBeGreaterThanOrEqual(2);
  });

  it('BREAK-10: Preserves byte-stuffing 0xFF 0x00 in JPEG streams', () => {
    // JPEG containing literal 0xFF encoded as 0xFF 0x00
    const jpegWithByteStuffing = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0x00]), // byte-stuffed 0xFF
      Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x00, 0x64, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]),
      Buffer.from([0xff, 0xd9]),
    ]);

    const stripped = stripJpegExif(jpegWithByteStuffing);
    expect(stripped.includes(Buffer.from([0xff, 0x00]))).toBe(true);

    const dims = parseImageDimensions(jpegWithByteStuffing, 'image/jpeg');
    expect(dims).toEqual({ width: 100, height: 200 });
  });
});
