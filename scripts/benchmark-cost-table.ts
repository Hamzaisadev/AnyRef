import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { GeminiProvider } from '../src/ai/geminiProvider';
import { computeAiCost } from '../src/ai/pricing';
import type { Brand } from '../src/domain/brand';
import type { Slot } from '../src/domain/slot';

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.AI_MODEL || 'gemini-3.5-flash-lite';

if (!apiKey) {
  console.error('GEMINI_API_KEY is not set');
  process.exit(1);
}

const provider = new GeminiProvider(apiKey, modelName);

const IMAGE_FILES = [
  resolve(process.cwd(), 'brag-output/snapshots/frame-00-at-2s.png'),
  resolve(process.cwd(), 'brag-output/snapshots/frame-01-at-7s.png'),
  resolve(process.cwd(), 'brag-output/snapshots/frame-02-at-12.5s.png'),
  resolve(process.cwd(), 'brag-output/brag.jpg'),
  resolve(process.cwd(), 'brag-output/snapshots/contact-sheet.jpg'),
];

const SAMPLE_BRANDS: Brand[] = [
  {
    id: 'b1111111-1111-4111-8111-111111111111',
    user_id: 'u1',
    name: 'Rewired Audio',
    what_you_sell: 'Noise-canceling studio headphones and DACs',
    why: 'Deep focus for engineers and creators',
    tone: 'Minimalist, technical, authoritative',
    colors: ['#0F1020', '#4B2BFF', '#F4F4F6'],
    wordmark: 'REWIRED',
    slogan: 'Engineered for Pure Focus.',
    footer_text: 'rewired.audio — Free 2-day studio shipping',
    never_do_rules: 'Never use neon gradients; never use cartoon mascots.',
    default_values: { cta_text: 'Shop Studio Series' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    user_id: 'u1',
    name: 'Kettl & Crumb',
    what_you_sell: 'Insulated ceramic-lined travel tumblers and artisan pour-over kits',
    why: 'Keep specialty coffee tasting like ceramic, never metallic',
    tone: 'Warm, tactile, grounded',
    colors: ['#2C3E35', '#D4A373', '#FAF7F2'],
    wordmark: 'KETTL & CRUMB',
    slogan: 'Pure taste on every trail.',
    footer_text: 'Lifetime thermal warranty',
    never_do_rules: 'Never show damaged or rusted tumblers; never use low-resolution clipart.',
    default_values: { cta_text: 'Explore the Collection' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_SLOTS: Slot[] = [
  {
    key: 'wordmark',
    label: 'Brand Wordmark',
    type: 'short_text',
    required: true,
    brand_field: 'wordmark',
    optional_block: false,
    never_invent: false,
  },
  {
    key: 'headline',
    label: 'Primary Headline',
    type: 'short_text',
    required: true,
    brand_field: null,
    optional_block: false,
    never_invent: false,
    max_length: 60,
  },
  {
    key: 'subheadline',
    label: 'Supporting Subheadline',
    type: 'short_text',
    required: true,
    brand_field: null,
    optional_block: false,
    never_invent: false,
    max_length: 120,
  },
  {
    key: 'price_tag',
    label: 'Retail Price',
    type: 'short_text',
    required: false,
    brand_field: null,
    optional_block: true,
    never_invent: true,
  },
  {
    key: 'cta_text',
    label: 'Call to Action',
    type: 'short_text',
    required: true,
    brand_field: null,
    optional_block: false,
    never_invent: false,
    default: 'Order Now',
  },
  {
    key: 'primary_color',
    label: 'Primary Brand Color',
    type: 'color',
    required: true,
    brand_field: 'colors_primary',
    optional_block: false,
    never_invent: false,
  },
];

const AUTOFILL_HINTS = [
  'Matte black over-ear wireless studio headphones with braided cable',
  '16oz forest green insulated ceramic coffee tumbler',
  'Compact desktop USB-C headphone amplifier and DAC',
  'Pour-over gooseneck copper kettle on walnut base',
  'Limited edition titanium studio monitor earphones',
  'Double-wall espresso travel mug in warm sand finish',
  'Balanced XLR studio cable and adapter kit',
  'Cold brew glass carafe with stainless steel mesh filter',
  'Open-back reference planar magnetic headphones',
  'Ceramic tasting cup set for specialty espresso',
];

const BRAND_DESCRIPTIONS = [
  `We are Artisan Sourdough Co., a neighborhood bakery crafting organic, naturally fermented artisan breads and pastries for local families and cafes. Our voice is warm, rustic, and welcoming. We love earth tones like deep forest green #2D5A27 and warm cream #F9F6F0. Slogan: Baked with patience. Footer note: Fresh delivery every morning before 7am. Never use artificial additives or industrial shortcuts.`,
  `Hum aik modern desi chai cafe hain jiska naam 'Chai Khana Lounge' hai. Hum karak chai, crispy parathay aur desi nashta serve karte hain. Hamara tone friendly aur energetic hai. Slogan: Har cup mein sukoon. Never use stock western coffee photos.`,
  `Lumiere Botanicals sells cold-pressed organic facial oils and barrier repair serums for sensitive skin. Minimalist clinical-botanical aesthetic. Palette uses sage #6B8E78 and ivory #FDFBF7. Slogan: Calm skin, naturally. Never make medical cure claims.`,
  `VoltForge builds compact GaN fast chargers and braided magnetic USB-C cables for remote software engineers. Tone is sharp, geeky, and no-nonsense. Colors: obsidian #111318 and electric cyan #00E5FF. Slogan: Power without bulk.`,
  `Zest & Loom is a small-batch handwoven linen homeware studio making table runners, napkins, and throw pillows. Warm Mediterranean tone. Never use synthetic fabric textures or harsh neon colors.`,
];

interface CallRecord {
  kind: 'generate' | 'autofill' | 'brand_draft';
  index: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  costLiteUsd: number;
  costFlash38Usd: number;
  durationMs: number;
}

async function main() {
  console.log(`Running live benchmark on model: ${modelName}`);
  const records: CallRecord[] = [];
  const extractedSlotsList: Slot[][] = [];

  // 1. Run 10 real generate calls
  console.log('\n--- Running 10 real GENERATE calls ---');
  for (let i = 0; i < 10; i++) {
    const imgPath = IMAGE_FILES[i % IMAGE_FILES.length]!;
    const mimeType = imgPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const imageBuffer = fs.readFileSync(imgPath);
    const brand = SAMPLE_BRANDS[i % SAMPLE_BRANDS.length]!;

    const t0 = Date.now();
    const res = await provider.generateTemplate({
      imageBuffer,
      mimeType,
      brand,
    });
    const durationMs = Date.now() - t0;

    if (res.slots && res.slots.length > 0) {
      extractedSlotsList.push(res.slots);
    }

    const inputTokens = res.usage?.inputTokens ?? 0;
    const outputTokens = res.usage?.outputTokens ?? 0;
    const reasoningTokens = res.usage?.reasoningTokens ?? 0;
    const costLiteUsd = computeAiCost(inputTokens, outputTokens, reasoningTokens, {
      inputPerMillion: 0.30,
      outputPerMillion: 2.50,
    });
    const costFlash38Usd = computeAiCost(inputTokens, outputTokens, reasoningTokens, {
      inputPerMillion: 0.75,
      outputPerMillion: 3.75,
    });

    records.push({
      kind: 'generate',
      index: i + 1,
      inputTokens,
      outputTokens,
      reasoningTokens,
      costLiteUsd,
      costFlash38Usd,
      durationMs,
    });
    console.log(
      `[generate #${i + 1}] in=${inputTokens} out=${outputTokens} reasoning=${reasoningTokens} costLite=$${costLiteUsd.toFixed(6)} (${durationMs}ms)`
    );
  }

  // 2. Run 10 real autofill calls
  console.log('\n--- Running 10 real AUTOFILL calls ---');
  for (let i = 0; i < 10; i++) {
    const imgPath = IMAGE_FILES[(i + 2) % IMAGE_FILES.length]!;
    const mimeType = imgPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const imageBuffer = fs.readFileSync(imgPath);
    const brand = SAMPLE_BRANDS[i % SAMPLE_BRANDS.length]!;
    const slots = extractedSlotsList[i] || DEFAULT_SLOTS;
    const hint = AUTOFILL_HINTS[i]!;

    const t0 = Date.now();
    const res = await provider.autofillSlots({
      imageBuffer,
      mimeType,
      brand,
      slots,
      hint,
    });
    const durationMs = Date.now() - t0;

    const inputTokens = res.usage?.inputTokens ?? 0;
    const outputTokens = res.usage?.outputTokens ?? 0;
    const reasoningTokens = res.usage?.reasoningTokens ?? 0;
    const costLiteUsd = computeAiCost(inputTokens, outputTokens, reasoningTokens, {
      inputPerMillion: 0.30,
      outputPerMillion: 2.50,
    });
    const costFlash38Usd = computeAiCost(inputTokens, outputTokens, reasoningTokens, {
      inputPerMillion: 0.75,
      outputPerMillion: 3.75,
    });

    records.push({
      kind: 'autofill',
      index: i + 1,
      inputTokens,
      outputTokens,
      reasoningTokens,
      costLiteUsd,
      costFlash38Usd,
      durationMs,
    });
    console.log(
      `[autofill #${i + 1}] in=${inputTokens} out=${outputTokens} reasoning=${reasoningTokens} costLite=$${costLiteUsd.toFixed(6)} (${durationMs}ms)`
    );
  }

  // 3. Run 5 real brand_draft calls
  console.log('\n--- Running 5 real BRAND_DRAFT calls ---');
  for (let i = 0; i < 5; i++) {
    const description = BRAND_DESCRIPTIONS[i]!;
    const t0 = Date.now();
    const res = await provider.draftBrand({
      description,
    });
    const durationMs = Date.now() - t0;

    const inputTokens = res.usage?.inputTokens ?? 0;
    const outputTokens = res.usage?.outputTokens ?? 0;
    const reasoningTokens = res.usage?.reasoningTokens ?? 0;
    const costLiteUsd = computeAiCost(inputTokens, outputTokens, reasoningTokens, {
      inputPerMillion: 0.30,
      outputPerMillion: 2.50,
    });
    const costFlash38Usd = computeAiCost(inputTokens, outputTokens, reasoningTokens, {
      inputPerMillion: 0.75,
      outputPerMillion: 3.75,
    });

    records.push({
      kind: 'brand_draft',
      index: i + 1,
      inputTokens,
      outputTokens,
      reasoningTokens,
      costLiteUsd,
      costFlash38Usd,
      durationMs,
    });
    console.log(
      `[brand_draft #${i + 1}] in=${inputTokens} out=${outputTokens} reasoning=${reasoningTokens} costLite=$${costLiteUsd.toFixed(6)} (${durationMs}ms)`
    );
  }

  function summarize(kind: 'generate' | 'autofill' | 'brand_draft') {
    const subset = records.filter((r) => r.kind === kind);
    const n = subset.length;
    const avgIn = subset.reduce((a, b) => a + b.inputTokens, 0) / n;
    const avgOut = subset.reduce((a, b) => a + b.outputTokens, 0) / n;
    const avgReason = subset.reduce((a, b) => a + b.reasoningTokens, 0) / n;
    const avgCostLite = subset.reduce((a, b) => a + b.costLiteUsd, 0) / n;
    const avgCostFlash38 = subset.reduce((a, b) => a + b.costFlash38Usd, 0) / n;
    const avgDurationMs = subset.reduce((a, b) => a + b.durationMs, 0) / n;
    return {
      calls: n,
      avgInputTokens: Math.round(avgIn * 10) / 10,
      avgOutputTokens: Math.round(avgOut * 10) / 10,
      avgReasoningTokens: Math.round(avgReason * 10) / 10,
      avgCostLiteUsd: Number(avgCostLite.toFixed(6)),
      avgCostFlash38Usd: Number(avgCostFlash38.toFixed(6)),
      avgDurationMs: Math.round(avgDurationMs),
    };
  }

  const genSummary = summarize('generate');
  const autoSummary = summarize('autofill');
  const draftSummary = summarize('brand_draft');

  // Plus Plan Monthly Quota (30 days):
  // generate_per_day = 50 -> 1,500 / month
  // autofill_per_day = 100 -> 3,000 / month
  // brand_draft_per_day = 20 -> 600 / month
  const monthly100LiteGenAutoOnly =
    1500 * genSummary.avgCostLiteUsd + 3000 * autoSummary.avgCostLiteUsd;
  const monthly100LiteAllThree =
    monthly100LiteGenAutoOnly + 600 * draftSummary.avgCostLiteUsd;

  const monthly100Flash38GenAutoOnly =
    1500 * genSummary.avgCostFlash38Usd + 3000 * autoSummary.avgCostFlash38Usd;
  const monthly100Flash38AllThree =
    monthly100Flash38GenAutoOnly + 600 * draftSummary.avgCostFlash38Usd;

  const report = {
    timestamp: new Date().toISOString(),
    modelTested: modelName,
    pricingSources: {
      modelsUrl: 'https://ai.google.dev/gemini-api/docs/models',
      pricingUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      verifiedDate: '2026-10-29',
      gemini35FlashLite: { inputPer1M: 0.30, outputPer1M: 2.50 },
      gemini38Flash: { inputPer1M: 0.75, outputPer1M: 3.75 },
    },
    summaries: {
      generate: genSummary,
      autofill: autoSummary,
      brand_draft: draftSummary,
    },
    plusQuotaMonthlyCost: {
      quota30Days: {
        generate: 1500,
        autofill: 3000,
        brand_draft: 600,
      },
      gemini35FlashLite: {
        genAndAutofillOnly: {
          pct25: Number((monthly100LiteGenAutoOnly * 0.25).toFixed(2)),
          pct50: Number((monthly100LiteGenAutoOnly * 0.50).toFixed(2)),
          pct100: Number(monthly100LiteGenAutoOnly.toFixed(2)),
        },
        includingBrandDraft: {
          pct25: Number((monthly100LiteAllThree * 0.25).toFixed(2)),
          pct50: Number((monthly100LiteAllThree * 0.50).toFixed(2)),
          pct100: Number(monthly100LiteAllThree.toFixed(2)),
        },
      },
      gemini38Flash: {
        genAndAutofillOnly: {
          pct25: Number((monthly100Flash38GenAutoOnly * 0.25).toFixed(2)),
          pct50: Number((monthly100Flash38GenAutoOnly * 0.50).toFixed(2)),
          pct100: Number(monthly100Flash38GenAutoOnly.toFixed(2)),
        },
        includingBrandDraft: {
          pct25: Number((monthly100Flash38AllThree * 0.25).toFixed(2)),
          pct50: Number((monthly100Flash38AllThree * 0.50).toFixed(2)),
          pct100: Number(monthly100Flash38AllThree.toFixed(2)),
        },
      },
    },
    records,
  };

  const outPath = resolve(process.cwd(), 'docs/spike/cost_benchmark_25_runs.json');
  fs.mkdirSync(resolve(process.cwd(), 'docs/spike'), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(report.summaries, null, 2));
  console.log('\n=== PLUS QUOTA MONTHLY COST ===');
  console.log(JSON.stringify(report.plusQuotaMonthlyCost, null, 2));
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
