import { EntryRepo, SupabaseEntryRepo } from '../data/entryRepo';
import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { CreateEntryInput, UpdateEntryInput, Entry, EntryFilters, EntryStatus } from '../domain/entry';
import { ValidationError, NotFoundError, ForbiddenError } from '../lib/errors';

export class EntryService {
  constructor(
    private entryRepo: EntryRepo = new SupabaseEntryRepo(),
    private brandRepo: BrandRepo = new SupabaseBrandRepo()
  ) {}

  async createEntry(userId: string, input: unknown): Promise<Entry> {
    const parseResult = CreateEntryInput.safeParse(input);
    if (!parseResult.success) {
      const details = parseResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new ValidationError(`Invalid entry payload: ${details}`, parseResult.error.format());
    }

    const { brand_id } = parseResult.data;
    const brand = await this.brandRepo.findById(userId, brand_id);
    if (!brand) {
      throw new ForbiddenError(`Cannot create entry: Brand "${brand_id}" does not belong to you.`);
    }

    return this.entryRepo.create(userId, parseResult.data);
  }

  async getEntry(userId: string, entryId: string): Promise<Entry> {
    const entry = await this.entryRepo.findById(userId, entryId);
    if (!entry) {
      throw new NotFoundError(`Entry with ID "${entryId}" not found.`);
    }
    return entry;
  }

  async listEntries(userId: string, filters?: EntryFilters): Promise<Entry[]> {
    return this.entryRepo.findAll(userId, filters);
  }

  async updateEntry(userId: string, entryId: string, input: unknown): Promise<Entry> {
    const parseResult = UpdateEntryInput.safeParse(input);
    if (!parseResult.success) {
      const details = parseResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new ValidationError(`Invalid entry update payload: ${details}`, parseResult.error.format());
    }

    // Verify existence
    await this.getEntry(userId, entryId);

    const updated = await this.entryRepo.update(userId, entryId, parseResult.data);
    if (!updated) {
      throw new NotFoundError(`Entry with ID "${entryId}" not found.`);
    }
    return updated;
  }

  async updateStatus(userId: string, entryId: string, status: EntryStatus): Promise<Entry> {
    return this.updateEntry(userId, entryId, { status });
  }

  async remixEntry(userId: string, entryId: string): Promise<Entry> {
    const original = await this.getEntry(userId, entryId);

    const remixInput: CreateEntryInput = {
      brand_id: original.brand_id,
      prompt_template: original.prompt_template,
      slots: original.slots,
      reference_path: original.reference_path,
      poster_type: original.poster_type,
      intended_product_shape: original.intended_product_shape,
      parent_entry_id: original.id,
      status: 'draft',
      note: `Remixed from entry ${original.id}`,
    };

    return this.createEntry(userId, remixInput);
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    await this.getEntry(userId, entryId);
    const success = await this.entryRepo.delete(userId, entryId);
    if (!success) {
      throw new NotFoundError(`Entry with ID "${entryId}" not found.`);
    }
  }
}

export const entryService = new EntryService();
