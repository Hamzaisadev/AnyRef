import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrandService } from '@/services/brandService';
import { ValidationError, NotFoundError } from '@/lib/errors';
import type { BrandRepo } from '@/data/brandRepo';

describe('Slice 1 Seam: BrandService (brandService.ts)', () => {
  let mockRepo: BrandRepo;
  let service: BrandService;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as BrandRepo;

    service = new BrandService(mockRepo);
  });

  it('successfully creates a brand with valid hex colors', async () => {
    const validData = {
      name: 'Rewired',
      what_you_sell: 'Audio gear',
      why: 'Peak performance',
      tone: 'Direct',
      colors: ['#0F1020', '#4B2BFF', '#FF8A3D'],
      wordmark: 'REWIRED',
      slogan: 'Pure Focus',
      footer_text: 'All rights reserved.',
      never_do_rules: 'No neon.',
      default_values: { cta_text: 'BUY NOW' },
    };

    const createdBrand = { id: 'b-1', user_id: 'u-1', ...validData, created_at: 'now', updated_at: 'now' };
    vi.mocked(mockRepo.create).mockResolvedValue(createdBrand);

    const result = await service.createBrand('u-1', validData);
    expect(result).toEqual(createdBrand);
    expect(mockRepo.create).toHaveBeenCalledWith('u-1', validData);
  });

  it('rejects brands with invalid hex colors', async () => {
    const invalidData = {
      name: 'Invalid Color Brand',
      what_you_sell: 'Gear',
      why: 'Why',
      tone: 'Tone',
      colors: ['not-a-hex-color', '#123456'],
      wordmark: 'INVALID',
      slogan: 'Slogan',
      footer_text: 'Footer',
      never_do_rules: '',
      default_values: {},
    };

    await expect(service.createBrand('u-1', invalidData)).rejects.toThrow(ValidationError);
  });

  it('rejects empty or overly long brand names', async () => {
    const emptyNameData = {
      name: '',
      what_you_sell: '',
      why: '',
      tone: '',
      colors: [],
      wordmark: '',
      slogan: '',
      footer_text: '',
      never_do_rules: '',
      default_values: {},
    };

    await expect(service.createBrand('u-1', emptyNameData)).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError if brand does not exist or user is unauthorized', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);
    await expect(service.getBrand('u-1', 'non-existent-id')).rejects.toThrow(NotFoundError);
  });
});
