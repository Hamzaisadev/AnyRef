import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntryService } from '@/services/entryService';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors';
import type { EntryRepo } from '@/data/entryRepo';
import type { BrandRepo } from '@/data/brandRepo';

describe('Slice 2 Seam: EntryService (entryService.ts)', () => {
  let mockEntryRepo: EntryRepo;
  let mockBrandRepo: BrandRepo;
  let service: EntryService;

  beforeEach(() => {
    mockEntryRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as EntryRepo;

    mockBrandRepo = {
      findById: vi.fn(),
    } as unknown as BrandRepo;

    service = new EntryService(mockEntryRepo, mockBrandRepo);
  });

  const validBrandId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
  const validEntryId = 'e2b4c5d6-7a8b-4c0d-9e1f-2a3b4c5d6e7f';
  const otherBrandId = '11111111-2222-3333-4444-555555555555';

  it('creates an entry when the user owns the specified brand', async () => {
    const validBrand = { id: validBrandId, user_id: 'u-1', name: 'Rewired' };
    vi.mocked(mockBrandRepo.findById).mockResolvedValue(validBrand as never);

    const input = {
      brand_id: validBrandId,
      prompt_template: 'A stylish poster for {{headline}} with {{wordmark}}.',
      slots: [
        {
          key: 'headline',
          label: 'Headline',
          type: 'short_text',
          required: true,
          brand_field: null,
          optional_block: false,
          never_invent: false,
        },
      ],
      poster_type: 'launch',
      intended_product_shape: 'tall',
      note: 'Initial draft',
    };

    const savedEntry = { id: validEntryId, user_id: 'u-1', ...input, status: 'draft' };
    vi.mocked(mockEntryRepo.create).mockResolvedValue(savedEntry as never);

    const result = await service.createEntry('u-1', input);
    expect(result.status).toBe('draft');
    expect(mockEntryRepo.create).toHaveBeenCalledWith('u-1', input);
  });

  it('rejects entry creation if the user does not own the brand', async () => {
    vi.mocked(mockBrandRepo.findById).mockResolvedValue(null);

    const input = {
      brand_id: otherBrandId,
      prompt_template: 'Valid prompt template.',
      slots: [],
    };

    await expect(service.createEntry('u-1', input)).rejects.toThrow(ForbiddenError);
  });

  it('allows marking an entry as winner', async () => {
    const existing = { id: validEntryId, user_id: 'u-1', status: 'draft' };
    vi.mocked(mockEntryRepo.findById).mockResolvedValue(existing as never);
    vi.mocked(mockEntryRepo.update).mockResolvedValue({ ...existing, status: 'winner' } as never);

    const updated = await service.updateStatus('u-1', validEntryId, 'winner');
    expect(updated.status).toBe('winner');
  });

  it('remixes an entry by setting parent_entry_id', async () => {
    const original = {
      id: validEntryId,
      user_id: 'u-1',
      brand_id: validBrandId,
      prompt_template: 'Original template',
      slots: [],
      poster_type: 'launch',
      intended_product_shape: 'tall',
    };
    vi.mocked(mockEntryRepo.findById).mockResolvedValue(original as never);
    vi.mocked(mockBrandRepo.findById).mockResolvedValue({ id: validBrandId, user_id: 'u-1' } as never);
    vi.mocked(mockEntryRepo.create).mockResolvedValue({
      ...original,
      id: '33333333-4444-5555-6666-777777777777',
      parent_entry_id: validEntryId,
      status: 'draft',
    } as never);

    const remix = await service.remixEntry('u-1', validEntryId);
    expect(remix.parent_entry_id).toBe(validEntryId);
    expect(mockEntryRepo.create).toHaveBeenCalledWith(
      'u-1',
      expect.objectContaining({ parent_entry_id: validEntryId })
    );
  });
});
