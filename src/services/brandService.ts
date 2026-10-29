import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { CreateBrandInput, UpdateBrandInput, Brand } from '../domain/brand';
import { ValidationError, NotFoundError } from '../lib/errors';
import { sanitizeText } from '../lib/sanitize';

export class BrandService {
  constructor(private repo: BrandRepo = new SupabaseBrandRepo()) {}

  async createBrand(userId: string, input: unknown): Promise<Brand> {
    const parseResult = CreateBrandInput.safeParse(input);
    if (!parseResult.success) {
      const details = parseResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new ValidationError(`Invalid brand payload: ${details}`, parseResult.error.format());
    }

    const data = parseResult.data;
    const sanitizedData: CreateBrandInput = {
      ...data,
      name: sanitizeText(data.name, 80),
      what_you_sell: sanitizeText(data.what_you_sell, 500),
      why: sanitizeText(data.why, 500),
      tone: sanitizeText(data.tone, 200),
      wordmark: sanitizeText(data.wordmark, 100),
      footer_text: sanitizeText(data.footer_text, 500),
      slogan: sanitizeText(data.slogan, 300),
      never_do_rules: sanitizeText(data.never_do_rules, 1000),
    };

    return this.repo.create(userId, sanitizedData);
  }

  async getBrand(userId: string, brandId: string): Promise<Brand> {
    const brand = await this.repo.findById(userId, brandId);
    if (!brand) {
      throw new NotFoundError(`Brand with ID "${brandId}" not found.`);
    }
    return brand;
  }

  async listBrands(userId: string): Promise<Brand[]> {
    return this.repo.findAllByUserId(userId);
  }

  async updateBrand(userId: string, brandId: string, input: unknown): Promise<Brand> {
    const parseResult = UpdateBrandInput.safeParse(input);
    if (!parseResult.success) {
      const details = parseResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new ValidationError(`Invalid brand update payload: ${details}`, parseResult.error.format());
    }

    const data = parseResult.data;
    const sanitizedData: UpdateBrandInput = {
      ...data,
      name: data.name !== undefined ? sanitizeText(data.name, 80) : undefined,
      what_you_sell: data.what_you_sell !== undefined ? sanitizeText(data.what_you_sell, 500) : undefined,
      why: data.why !== undefined ? sanitizeText(data.why, 500) : undefined,
      tone: data.tone !== undefined ? sanitizeText(data.tone, 200) : undefined,
      wordmark: data.wordmark !== undefined ? sanitizeText(data.wordmark, 100) : undefined,
      footer_text: data.footer_text !== undefined ? sanitizeText(data.footer_text, 500) : undefined,
      slogan: data.slogan !== undefined ? sanitizeText(data.slogan, 300) : undefined,
      never_do_rules: data.never_do_rules !== undefined ? sanitizeText(data.never_do_rules, 1000) : undefined,
    };

    const updated = await this.repo.update(userId, brandId, sanitizedData);
    if (!updated) {
      throw new NotFoundError(`Brand with ID "${brandId}" not found.`);
    }
    return updated;
  }

  async deleteBrand(userId: string, brandId: string): Promise<void> {
    const success = await this.repo.delete(userId, brandId);
    if (!success) {
      throw new NotFoundError(`Brand with ID "${brandId}" not found.`);
    }
  }
}

export const brandService = new BrandService();
