import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/services/session';
import { brandService } from '@/services/brandService';
import { entryService } from '@/services/entryService';
import { withErrorHandler } from '@/lib/apiHandler';
import type { Slot } from '@/domain/slot';
import { z } from 'zod';

const StudioSaveSchema = z.object({
  brand_id: z.string().uuid().nullable().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  prompt_template: z.string().min(10),
  headline: z.string().default(''),
  offer: z.string().default(''),
  cta: z.string().default(''),
  accent_color: z.string().default('#4B2BFF'),
  brand_name: z.string().default(''),
  engine: z.string().default('universal'),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireUser(request);
    const body = await request.json();
    const parsed = StudioSaveSchema.parse(body);

    const safeAccentColor = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(parsed.accent_color)
      ? parsed.accent_color
      : '#4B2BFF';

    let targetBrandId = parsed.brand_id;
    if (!targetBrandId) {
      const existingBrands = await brandService.listBrands(user.id);
      if (existingBrands.length > 0 && existingBrands[0]) {
        targetBrandId = existingBrands[0].id;
      } else {
        const brandName = parsed.brand_name.trim() || 'My Studio Brand';
        const newBrand = await brandService.createBrand(user.id, {
          name: brandName,
          what_you_sell: 'Commercial products and merchandise',
          colors: [safeAccentColor],
          wordmark: brandName,
        });
        targetBrandId = newBrand.id;
      }
    }

    // Dynamically discover all placeholders and optional block keys referenced in prompt_template
    // to strictly adhere to validatePromptTemplate (every referenced key must have a slot; every slot must be referenced).
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const optionalBlockRegex = /\[\[\?([a-z0-9_]+):/g;

    const referencedKeys = new Set<string>();
    const optionalKeys = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = placeholderRegex.exec(parsed.prompt_template)) !== null) {
      const k = match[1]?.trim().toLowerCase();
      if (k) referencedKeys.add(k);
    }
    while ((match = optionalBlockRegex.exec(parsed.prompt_template)) !== null) {
      const k = match[1]?.trim().toLowerCase();
      if (k) {
        referencedKeys.add(k);
        optionalKeys.add(k);
      }
    }

    const defaultValues: Record<
      string,
      { label: string; defaultVal: string; type: Slot['type']; brandField?: any }
    > = {
      headline: { label: 'Headline', defaultVal: parsed.headline, type: 'short_text' },
      main_headline: { label: 'Headline', defaultVal: parsed.headline, type: 'short_text' },
      title: { label: 'Title', defaultVal: parsed.headline, type: 'short_text' },
      offer: { label: 'Offer', defaultVal: parsed.offer, type: 'short_text' },
      badge: { label: 'Offer Badge', defaultVal: parsed.offer, type: 'short_text' },
      discount_text: { label: 'Discount Text', defaultVal: parsed.offer, type: 'short_text' },
      discount_badge: { label: 'Discount Badge', defaultVal: parsed.offer, type: 'short_text' },
      cta: { label: 'Call To Action', defaultVal: parsed.cta, type: 'short_text' },
      call_to_action: { label: 'Call To Action', defaultVal: parsed.cta, type: 'short_text' },
      button: { label: 'Action Button', defaultVal: parsed.cta, type: 'short_text' },
      accent_color: { label: 'Accent Color', defaultVal: safeAccentColor, type: 'color' },
      color: { label: 'Accent Color', defaultVal: safeAccentColor, type: 'color' },
      brand_name: { label: 'Brand Name', defaultVal: parsed.brand_name, type: 'short_text', brandField: 'name' },
      brand_wordmark: {
        label: 'Brand Wordmark',
        defaultVal: parsed.brand_name,
        type: 'short_text',
        brandField: 'wordmark',
      },
      wordmark: { label: 'Wordmark', defaultVal: parsed.brand_name, type: 'short_text', brandField: 'wordmark' },
      product_description: { label: 'Product Description', defaultVal: '', type: 'short_text' },
      product_name: { label: 'Product Name', defaultVal: '', type: 'short_text' },
      product_title: { label: 'Product Title', defaultVal: '', type: 'short_text' },
      product: { label: 'Product', defaultVal: '', type: 'short_text' },
    };

    const slots: Slot[] = Array.from(referencedKeys).map((key) => {
      const def = defaultValues[key];
      const isOptional = optionalKeys.has(key);
      return {
        key,
        label:
          def?.label ||
          key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .slice(0, 60),
        type: def?.type || 'short_text',
        required: !isOptional,
        optional_block: isOptional,
        never_invent: false,
        brand_field: def?.brandField || null,
        default: def?.defaultVal || '',
      };
    });

    const entry = await entryService.createEntry(user.id, {
      brand_id: targetBrandId,
      prompt_template: parsed.prompt_template,
      slots,
      status: 'draft',
      poster_type: 'launch',
      intended_product_shape: 'any',
      note: parsed.notes || `Saved from Dual-Drop Studio (${parsed.engine})`,
    });

    return NextResponse.json({ entry, brand_id: targetBrandId }, { status: 201 });
  }, request);
}
