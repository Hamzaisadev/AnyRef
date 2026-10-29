import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { AiProvider } from '../ai/AiProvider';
import { getAiProvider } from '../ai/getAiProvider';
import { GenerateOutput } from '../ai/schemas';
import { ForbiddenError, ValidationError } from '../lib/errors';

export class GenerateService {
  constructor(
    private brandRepo: BrandRepo = new SupabaseBrandRepo(),
    private getProvider: () => AiProvider = getAiProvider
  ) {}

  async generate(
    userId: string,
    brandId: string,
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<GenerateOutput> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      throw new ValidationError(`Unsupported image type "${mimeType}". Allowed: jpeg, png, webp.`);
    }

    const brand = await this.brandRepo.findById(userId, brandId);
    if (!brand) {
      throw new ForbiddenError(`Cannot generate: Brand "${brandId}" not found or unauthorized.`);
    }

    const provider = this.getProvider();
    return provider.generateTemplate({
      imageBuffer,
      mimeType,
      brand,
    });
  }
}

export const generateService = new GenerateService();
