import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { CreateBrandInput, UpdateBrandInput, Brand } from '../domain/brand';
import { ValidationError, NotFoundError } from '../lib/errors';

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

    return this.repo.create(userId, parseResult.data);
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

    const updated = await this.repo.update(userId, brandId, parseResult.data);
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
