import { EntryRepo, SupabaseEntryRepo } from '../data/entryRepo';
import { BrandRepo, SupabaseBrandRepo } from '../data/brandRepo';
import { AiProvider } from '../ai/AiProvider';
import { getAiProvider } from '../ai/getAiProvider';
import { NotFoundError, ValidationError } from '../lib/errors';
import type { AutofillOutput } from '../ai/schemas';

export interface SanitizedAutofillResult extends AutofillOutput {
  layoutFitWarning: boolean;
  intendedProductShape?: string | null;
  productShape: string;
}

export class AutofillService {
  constructor(
    private entryRepo: EntryRepo = new SupabaseEntryRepo(),
    private brandRepo: BrandRepo = new SupabaseBrandRepo(),
    private getProvider: () => AiProvider = getAiProvider
  ) {}

  async autofill(
    userId: string,
    entryId: string,
    imageBuffer: Buffer,
    mimeType: string,
    hint?: string
  ): Promise<SanitizedAutofillResult> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      throw new ValidationError(`Unsupported image type "${mimeType}". Allowed: jpeg, png, webp.`);
    }

    const entry = await this.entryRepo.findById(userId, entryId);
    if (!entry) {
      throw new NotFoundError(`Entry "${entryId}" not found.`);
    }

    const brand = await this.brandRepo.findById(userId, entry.brand_id);
    if (!brand) {
      throw new NotFoundError(`Brand "${entry.brand_id}" not found.`);
    }

    const provider = this.getProvider();
    const rawOutput = await provider.autofillSlots({
      imageBuffer,
      mimeType,
      brand,
      slots: entry.slots,
      hint,
    });

    // Hard Rule 3: Programmatic Post-Filter
    // The app never invents prices, discounts or dates. Slots of those types stay empty
    // and flagged needs_you unless the user typed them or a brand default exists.
    const sanitizedValues = { ...rawOutput.values };
    const needsYouSet = new Set(rawOutput.needs_you);

    for (const slot of entry.slots) {
      if (slot.never_invent) {
        // AI is strictly forbidden from populating this slot
        delete sanitizedValues[slot.key];
        needsYouSet.add(slot.key);
      }
    }

    // Check layout-fit compatibility
    const intendedShape = entry.intended_product_shape;
    const actualShape = rawOutput.product_shape;
    const layoutFitWarning = Boolean(
      intendedShape &&
      intendedShape !== 'any' &&
      actualShape !== 'other' &&
      intendedShape !== actualShape
    );

    return {
      ...rawOutput,
      values: sanitizedValues,
      needs_you: Array.from(needsYouSet),
      layoutFitWarning,
      intendedProductShape: intendedShape,
      productShape: actualShape,
    };
  }
}

export const autofillService = new AutofillService();
