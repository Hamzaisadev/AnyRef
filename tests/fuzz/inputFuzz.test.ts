import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeSlotValues } from '@/lib/sanitize';
import { validatePromptTemplate } from '@/domain/validateTemplate';
import { validateInjectionAndBrandRules } from '@/domain/validateInjection';
import { verifyImageMagicBytes, AssetService } from '@/services/assetService';
import { ValidationError } from '@/lib/errors';
import {
  CreateBrandBodySchema,
  CreateEntryBodySchema,
  UuidParamSchema,
  ListEntriesQuerySchema,
} from '@/domain/apiSchemas';
import type { Slot } from '@/domain/slot';

describe('Input Fuzzing & Garbage Ingestion Suite (Phase 3)', () => {
  const assetService = new AssetService(8);

  const testSlots: Slot[] = [
    {
      key: 'title',
      label: 'Title',
      type: 'short_text',
      required: true,
      max_length: 50,
      brand_field: null,
      optional_block: false,
      never_invent: false,
    },
    {
      key: 'price',
      label: 'Price',
      type: 'short_text',
      required: false,
      max_length: 20,
      brand_field: null,
      optional_block: true,
      never_invent: true,
    },
  ];

  describe('1. Giant Text (1 MB Payload Fuzzing)', () => {
    const oneMegabyteString = 'A'.repeat(1024 * 1024);

    it('safely handles 1 MB string in sanitizeText without crashing or stack overflow', () => {
      const sanitized = sanitizeText(oneMegabyteString, 100);
      expect(sanitized.length).toBe(100);
      expect(sanitized).toBe('A'.repeat(100));
    });

    it('rejects 1 MB string in API Zod schemas with validation errors rather than 500', () => {
      const brandPayload = {
        name: oneMegabyteString,
      };

      const result = CreateBrandBodySchema.safeParse(brandPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('max'))).toBe(true);
      }
    });

    it('rejects 1 MB prompt template in CreateEntryBodySchema', () => {
      const entryPayload = {
        brand_id: '123e4567-e89b-12d3-a456-426614174000',
        prompt_template: oneMegabyteString,
        slots: testSlots,
      };

      const result = CreateEntryBodySchema.safeParse(entryPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('2. SQL, Script & HTML Injection Payloads', () => {
    const attackPayloads = [
      "'; DROP TABLE entries; --",
      "' OR 1=1 --",
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:void(0)',
      '<iframe src="https://attacker.com"></iframe>',
      '"><script src=//evil.com></script>',
    ];

    it('neutralizes attack payloads during prompt security validation', () => {
      for (const payload of attackPayloads) {
        const check = validateInjectionAndBrandRules(payload);
        if (/<script|javascript:|<iframe|onerror=/i.test(payload)) {
          expect(check.valid, `Payload "${payload}" should have been rejected`).toBe(false);
        }
      }
    });

    it('treats SQL payloads as inert text in sanitizer', () => {
      const sql = "'; DROP TABLE entries; --";
      const cleaned = sanitizeText(sql);
      expect(cleaned).toBe(sql); // String is preserved as literal text without execution
    });

    it('caps injection strings to slot max_length in sanitizeSlotValues', () => {
      const dirtyValues = {
        title: '<script>'.repeat(20),
      };
      const sanitized = sanitizeSlotValues(dirtyValues, testSlots);
      expect(sanitized.title).toBeDefined();
      expect(sanitized.title?.length).toBeLessThanOrEqual(50);
    });
  });

  describe('3. Unicode RTL, Zero-Width & Invisible Characters Fuzzing', () => {
    it('strips dense cluster of zero-width and bidirectional override marks', () => {
      const fuzzInput =
        'Headline\u200B\u200C\u200D\uFEFF\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2060Test';
      const clean = sanitizeText(fuzzInput);
      expect(clean).toBe('HeadlineTest');
    });

    it('normalizes Arabic / Hebrew RTL text without crashing', () => {
      const rtl = 'مرحبا بالعالم - عطور شرقية فاخرة';
      const clean = sanitizeText(rtl);
      expect(clean).toBe(rtl);
    });

    it('handles mixed emoji and modifier sequences safely', () => {
      const emojiString = '🚀⚡🎨👩🏽‍💻';
      const clean = sanitizeText(emojiString);
      expect(clean).toBeDefined();
    });
  });

  describe('4. Corrupted Images, Polyglots & Spoofed MIME', () => {
    it('rejects polyglot GIF/HTML payload masquerading as PNG', () => {
      const polyglot = Buffer.from('GIF89a/*<script>alert(1)</script>*/=1;');
      const check = verifyImageMagicBytes(polyglot);
      expect(check.isValid).toBe(false);
    });

    it('rejects SVG file containing script tag', () => {
      const svgWithScript = Buffer.from(
        '<svg><script>window.location="http://evil.com"</script></svg>'
      );
      const check = verifyImageMagicBytes(svgWithScript);
      expect(check.isValid).toBe(false);
    });

    it('rejects random binary noise / garbage bytes', () => {
      const garbage = Buffer.from([0x00, 0xff, 0xaa, 0x55, 0x12, 0x34, 0x56, 0x78, 0x99, 0xaa, 0xbb, 0xcc]);
      const check = verifyImageMagicBytes(garbage);
      expect(check.isValid).toBe(false);
      expect(check.error).toContain('Invalid file format');
    });

    it('rejects zero-byte empty file upload', () => {
      expect(() => assetService.validateUpload(Buffer.alloc(0), 'image/png')).toThrow(ValidationError);
    });
  });

  describe('5. Malformed API Query & Param Schemas', () => {
    it('rejects non-UUID strings for UuidParamSchema with 400 validation error', () => {
      const invalidIds = [
        'not-a-uuid',
        '123',
        '../../../etc/passwd',
        "123' OR 1=1",
        '<script>',
      ];

      for (const id of invalidIds) {
        const result = UuidParamSchema.safeParse({ id });
        expect(result.success).toBe(false);
      }
    });

    it('sanitizes limit and offset parameters in ListEntriesQuerySchema', () => {
      const query = {
        limit: '25',
        offset: '50',
      };
      const result = ListEntriesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.offset).toBe(50);
      }
    });

    it('clamps or rejects negative limits and huge offsets in ListEntriesQuerySchema', () => {
      expect(ListEntriesQuerySchema.safeParse({ limit: '-5' }).success).toBe(false);
      expect(ListEntriesQuerySchema.safeParse({ limit: '5000' }).success).toBe(false);
    });
  });

  describe('6. Template Syntactic Fuzzing', () => {
    it('rejects broken unbalanced placeholder delimiters', () => {
      const brokenTemplates = [
        'Poster with {{unclosed placeholder',
        'Poster with {{}} empty placeholder',
        'Poster with [[?key: unclosed block',
        'Poster with [[?]]: missing colon',
        'Poster with duplicate [[?price: a ]] [[?price: b ]]',
      ];

      for (const template of brokenTemplates) {
        const result = validatePromptTemplate(template, testSlots);
        expect(result.valid).toBe(false);
      }
    });
  });
});
