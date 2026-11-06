import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudioService } from '@/services/studioService';
import { ValidationError } from '@/lib/errors';
import type { AiProvider, StudioGenerateResult } from '@/ai/AiProvider';
import type { BrandRepo } from '@/data/brandRepo';
import { QuotaService } from '@/services/quotaService';

describe('StudioService', () => {
  // Authentic 16-byte PNG magic header: 89 50 4E 47 0D 0A 1A 0A ...
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  ]);

  // Authentic 16-byte JPEG magic header: FF D8 FF E0 ...
  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
  ]);

  const invalidBuffer = Buffer.from('this is not an image');

  const mockStudioResult: StudioGenerateResult = {
    marketingCopy: {
      headline: 'TEST HEADLINE',
      offer: 'TEST OFFER',
      cta: 'TEST CTA',
      accentColor: '#4B2BFF',
      brandName: 'TEST BRAND',
      productDescription: 'test product description',
    },
    readyPrompt: 'Test ready prompt for generation with commercial lighting.',
    enginePrompts: {
      midjourney: 'Test midjourney prompt --ar 9:16 --v 6.1 --style raw',
      flux: 'Test flux prompt',
      ideogram: 'Test ideogram prompt',
    },
    visualAnalysis: {
      referenceStyle: 'Clean studio background',
      productIdentified: 'Wireless earbuds',
      suggestedAspectRatio: '9:16',
      palette: ['#0F1020', '#4B2BFF'],
    },
    promptTemplate: 'Template with {{headline}} and {{offer}}.',
    usage: {
      inputTokens: 1200,
      outputTokens: 600,
    },
  };

  const mockProvider: AiProvider = {
    name: 'mock-gemini',
    generateTemplate: vi.fn(),
    autofillSlots: vi.fn(),
    draftBrand: vi.fn(),
    generateStudio: vi.fn().mockResolvedValue(mockStudioResult),
  };

  const mockBrandRepo: BrandRepo = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(null),
    findAllByUserId: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockProvider.generateStudio = vi.fn().mockResolvedValue(mockStudioResult);
    vi.spyOn(QuotaService, 'checkCircuitBreaker').mockResolvedValue(undefined as any);
    vi.spyOn(QuotaService, 'checkDailyQuota').mockResolvedValue(undefined as any);
    vi.spyOn(QuotaService, 'checkMonthlyBudget').mockResolvedValue(undefined as any);
    vi.spyOn(QuotaService, 'recordAiUsage').mockResolvedValue(undefined as any);
  });

  it('rejects execution when reference image fails magic byte check', async () => {
    const service = new StudioService(mockBrandRepo, () => mockProvider);

    await expect(
      service.generate(
        'user-1',
        invalidBuffer,
        'image/png',
        validPngBuffer,
        'image/png'
      )
    ).rejects.toThrow(ValidationError);
  });

  it('rejects execution when product image fails magic byte check', async () => {
    const service = new StudioService(mockBrandRepo, () => mockProvider);

    await expect(
      service.generate(
        'user-1',
        validJpegBuffer,
        'image/jpeg',
        invalidBuffer,
        'image/png'
      )
    ).rejects.toThrow(ValidationError);
  });

  it('successfully generates studio proposal and records AI usage telemetry', async () => {
    const service = new StudioService(mockBrandRepo, () => mockProvider);

    const result = await service.generate(
      'user-123',
      validJpegBuffer,
      'image/jpeg',
      validPngBuffer,
      'image/png',
      {
        aspectRatio: '9:16',
        targetEngine: 'midjourney',
        hint: 'High contrast studio lighting',
      }
    );

    expect(result.marketingCopy.headline).toBe('TEST HEADLINE');
    expect(result.marketingCopy.cta).toBe('TEST CTA');
    expect(result.cost_usd).toBeGreaterThan(0);
    expect(QuotaService.recordAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        kind: 'generate',
      })
    );
  });

  it('rejects execution when reference image exceeds MAX_UPLOAD_MB', async () => {
    const service = new StudioService(mockBrandRepo, () => mockProvider);
    // Allocate buffer larger than default 10MB (e.g. 11MB) with valid PNG magic bytes
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024);
    validPngBuffer.copy(oversizedBuffer, 0, 0, validPngBuffer.length);

    await expect(
      service.generate(
        'user-1',
        oversizedBuffer,
        'image/png',
        validJpegBuffer,
        'image/jpeg'
      )
    ).rejects.toThrow(ValidationError);
  });

  it('rejects execution when product image exceeds MAX_UPLOAD_MB', async () => {
    const service = new StudioService(mockBrandRepo, () => mockProvider);
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024);
    validJpegBuffer.copy(oversizedBuffer, 0, 0, validJpegBuffer.length);

    await expect(
      service.generate(
        'user-1',
        validPngBuffer,
        'image/png',
        oversizedBuffer,
        'image/jpeg'
      )
    ).rejects.toThrow(ValidationError);
  });
});
