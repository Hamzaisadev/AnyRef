import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutofillService } from '@/services/autofillService';
import type { EntryRepo } from '@/data/entryRepo';
import type { BrandRepo } from '@/data/brandRepo';
import type { AiProvider } from '@/ai/AiProvider';

vi.mock('@/services/quotaService', () => ({
  QuotaService: {
    checkCircuitBreaker: vi.fn().mockResolvedValue(undefined),
    checkDailyQuota: vi.fn().mockResolvedValue({ allowed: true }),
    recordAiUsage: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Slice 4 Seam: AutofillService (autofillService.ts)', () => {
  let mockEntryRepo: EntryRepo;
  let mockBrandRepo: BrandRepo;
  let mockAiProvider: AiProvider;
  let service: AutofillService;

  const validBrand = {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    user_id: 'u-1',
    name: 'Rewired',
    default_values: { wordmark: 'REWIRED' },
  };

  const validEntry = {
    id: 'e2b4c5d6-7a8b-4c0d-9e1f-2a3b4c5d6e7f',
    user_id: 'u-1',
    brand_id: validBrand.id,
    intended_product_shape: 'tall',
    slots: [
      {
        key: 'headline',
        label: 'Headline',
        type: 'short_text',
        required: true,
        never_invent: false,
      },
      {
        key: 'discount_rate',
        label: 'Discount Percentage',
        type: 'short_text',
        required: false,
        never_invent: true, // HARD RULE 3
      },
    ],
  };

  beforeEach(() => {
    mockEntryRepo = {
      findById: vi.fn().mockResolvedValue(validEntry),
    } as unknown as EntryRepo;

    mockBrandRepo = {
      findById: vi.fn().mockResolvedValue(validBrand),
    } as unknown as BrandRepo;

    mockAiProvider = {
      name: 'mock',
      generateTemplate: vi.fn(),
      autofillSlots: vi.fn(),
      draftBrand: vi.fn(),
    };

    service = new AutofillService(mockEntryRepo, mockBrandRepo, () => mockAiProvider);
  });

  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
  ]);

  it('programmatically clears unauthorized AI guesses for never_invent slots', async () => {
    // Model hallucinates a discount rate despite prompt instructions
    vi.mocked(mockAiProvider.autofillSlots).mockResolvedValue({
      values: {
        headline: { value: 'AIR PRO WIRELESS', source: 'ai', confidence: 'high' },
        discount_rate: { value: '50% OFF', source: 'ai', confidence: 'medium' }, // MUST BE CLEARED
      },
      needs_you: [],
      product_shape: 'tall',
      product_guess: 'Wireless headphones',
    });

    const result = await service.autofill(
      'u-1',
      validEntry.id,
      validJpegBuffer,
      'image/jpeg'
    );

    // Headline is retained
    expect(result.values['headline']?.value).toBe('AIR PRO WIRELESS');

    // Hard Rule 3: discount_rate was cleared from values and added to needs_you
    expect(result.values['discount_rate']).toBeUndefined();
    expect(result.needs_you).toContain('discount_rate');
  });

  it('flags layout_fit_warning when product shape conflicts with reference layout', async () => {
    vi.mocked(mockAiProvider.autofillSlots).mockResolvedValue({
      values: {
        headline: { value: 'PORTABLE SPEAKER', source: 'ai', confidence: 'high' },
      },
      needs_you: ['discount_rate'],
      product_shape: 'wide', // Entry is 'tall'
      product_guess: 'Wide soundbar',
    });

    const result = await service.autofill(
      'u-1',
      validEntry.id,
      validJpegBuffer,
      'image/jpeg'
    );

    expect(result.layoutFitWarning).toBe(true);
    expect(result.productShape).toBe('wide');
    expect(result.intendedProductShape).toBe('tall');
  });
});
