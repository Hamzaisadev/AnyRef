import { EntryRepo, SupabaseEntryRepo } from '../data/entryRepo';
import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { CreateEntryInput, UpdateEntryInput, Entry, EntryFilters, EntryStatus } from '../domain/entry';
import { ValidationError, NotFoundError, ForbiddenError } from '../lib/errors';
import { validatePromptTemplate } from '../domain/validateTemplate';
import { validateInjectionAndBrandRules } from '../domain/validateInjection';
import { sanitizeText } from '../lib/sanitize';

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

    const { brand_id, prompt_template, slots } = parseResult.data;
    const brand = await this.brandRepo.findById(userId, brand_id);
    if (!brand) {
      throw new ForbiddenError(`Cannot create entry: Brand "${brand_id}" does not belong to you.`);
    }

    // 1. Template & Slot Consistency Validation
    const templateValidation = validatePromptTemplate(prompt_template, slots || []);
    if (!templateValidation.valid) {
      throw new ValidationError(
        `Template validation failed:\n${templateValidation.errors.join('\n')}`,
        templateValidation.errors
      );
    }

    // 2. Injection & Brand Negative Rule Validation
    const injectionValidation = validateInjectionAndBrandRules(prompt_template, brand);
    if (!injectionValidation.valid) {
      throw new ValidationError(
        `Prompt security validation failed:\n${injectionValidation.errors.join('\n')}`,
        injectionValidation.errors
      );
    }

    // 3. Note Sanitization
    const sanitizedData: CreateEntryInput = {
      ...parseResult.data,
      note: parseResult.data.note ? sanitizeText(parseResult.data.note, 2000) : '',
    };

    return this.entryRepo.create(userId, sanitizedData);
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
    const existing = await this.getEntry(userId, entryId);
    const updatedTemplate = parseResult.data.prompt_template ?? existing.prompt_template;
    const updatedSlots = parseResult.data.slots ?? existing.slots;

    if (parseResult.data.prompt_template !== undefined || parseResult.data.slots !== undefined) {
      const templateValidation = validatePromptTemplate(updatedTemplate, updatedSlots);
      if (!templateValidation.valid) {
        throw new ValidationError(
          `Template validation failed:\n${templateValidation.errors.join('\n')}`,
          templateValidation.errors
        );
      }

      const brand = await this.brandRepo.findById(userId, existing.brand_id);
      const injectionValidation = validateInjectionAndBrandRules(updatedTemplate, brand);
      if (!injectionValidation.valid) {
        throw new ValidationError(
          `Prompt security validation failed:\n${injectionValidation.errors.join('\n')}`,
          injectionValidation.errors
        );
      }
    }

    const sanitizedData: UpdateEntryInput = {
      ...parseResult.data,
      note: parseResult.data.note !== undefined ? sanitizeText(parseResult.data.note, 2000) : undefined,
    };

    const updated = await this.entryRepo.update(userId, entryId, sanitizedData);
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
