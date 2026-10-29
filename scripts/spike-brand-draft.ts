import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import { GeminiProvider, DEFAULT_BRAND_DRAFT_SYSTEM_PROMPT } from '../src/ai/geminiProvider';
import { validateBrandDraft } from '../src/domain/validateBrandDraft';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ Error: GEMINI_API_KEY is not set');
  process.exit(1);
}

const provider = new GeminiProvider(apiKey);

interface TestCase {
  id: string;
  title: string;
  language: string;
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'run-1-bakery',
    title: 'Artisan Sourdough Bakery (English)',
    language: 'English',
    description: `We are Artisan Sourdough Co., a neighborhood bakery crafting organic, naturally fermented artisan breads and pastries for local families and cafes. Our voice is warm, rustic, and welcoming. We love earth tones like deep forest green #2D5A27 and warm cream #F9F6F0. Slogan: Baked with patience. Footer note: Fresh delivery every morning before 7am. Never use artificial additives or industrial shortcuts.`,
  },
  {
    id: 'run-2-desi-chai',
    title: 'Chai Khana Lounge (Roman Urdu)',
    language: 'Roman Urdu',
    description: `Hum aik modern desi chai cafe hain jiska naam 'Chai Khana Lounge' hai. Hum karak chai, crispy parathay aur desi nashta serve kartay hain young professionals aur students ko. Humari tone friendly, energetic aur desi cool honi chahiye. Colors deep maroon #800020 aur mustard yellow #FFDB58 hain. Slogan: Garam chai, purani yaadein. Kabhi bhi boring corporate tone use mat karna. Delivery free over 500 rupees.`,
  },
  {
    id: 'run-3-cloud-saas',
    title: 'CloudMetrics DevOps Observability (English SaaS)',
    language: 'English',
    description: `CloudMetrics is an automated infrastructure cost optimization and cloud telemetry platform for DevOps teams and engineering managers. Tone should be precise, authoritative, minimal, and engineering-focused. Our primary brand color is midnight navy #0B192C and accent is neon cyan #00FFFF. Wordmark: CLOUDMETRICS. Never use cartoonish illustrations or hype marketing buzzwords. Footer text: Secure by design. Built for engineers.`,
  },
  {
    id: 'run-4-minimal-florist',
    title: 'Zest & Bloom Floral Studio (Minimal, No Colors Given)',
    language: 'English',
    description: `Zest & Bloom is a boutique floral design studio creating custom botanical arrangements and architectural bouquets for intimate weddings, editorial shoots, and quiet luxury events. Our tone is artistic, refined, poetic, and serene. Slogan: Poetry in petals. Never use gaudy plastic wraps or neon dyes.`,
  },
  {
    id: 'run-5-organic-honey',
    title: 'Khaalis Honey (Mixed English & Roman Urdu)',
    language: 'Mixed (Urdu/English)',
    description: `Mera brand 'Khaalis Honey' pure organic raw Sidr honey bechta hai health-conscious families ko. 100% natural, unpasteurized, no artificial sugar or chemicals. Tone honi chahiye authentic, trustworthy, clean aur rooted in nature. Colors golden amber #D4A373 aur olive green #556B2F. Slogan: Straight from the hives. Kabhi bhi fake health claims ya artificial images use mat karna. Delivery all across Pakistan.`,
  },
];

async function runFiveDraftSpikes() {
  console.log('===============================================================');
  console.log('🤖 Running 5 Real Gemini brand_draft Calls for Token & Cost Measurement');
  console.log('===============================================================\n');

  const results: any[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;
  let totalDurationMs = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i]!;
    console.log(`\n--- [${i + 1}/5] Running: ${tc.title} ---`);
    console.log(`Description (${tc.description.length} chars):\n"${tc.description}"\n`);

    const start = Date.now();
    try {
      const response = await provider.draftBrand({
        description: tc.description,
        systemPrompt: DEFAULT_BRAND_DRAFT_SYSTEM_PROMPT,
      });
      const durationMs = Date.now() - start;

      // Validate through domain validator
      const { usage, ...draft } = response;
      const validated = validateBrandDraft(draft, tc.description);

      const inputTokens = usage?.inputTokens ?? 0;
      const outputTokens = usage?.outputTokens ?? 0;
      const totalTokens = inputTokens + outputTokens;
      // Gemini 3.5 / 2.5 Flash pricing: $0.075 / 1M input, $0.30 / 1M output
      const costUsd = (inputTokens * 0.075 + outputTokens * 0.30) / 1_000_000;

      console.log(`✅ Success in ${durationMs}ms`);
      console.log(`   Tokens: Input=${inputTokens}, Output=${outputTokens}, Total=${totalTokens}`);
      console.log(`   Cost: $${costUsd.toFixed(6)} USD`);
      console.log(`   Extracted Brand:`, {
        name: validated.name,
        slogan: validated.slogan,
        tone: validated.tone,
        colors: validated.colors,
        footer: validated.footer_text,
        never_do: validated.never_do_rules,
      });

      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      totalCostUsd += costUsd;
      totalDurationMs += durationMs;

      results.push({
        testCase: tc,
        durationMs,
        usage: { inputTokens, outputTokens, totalTokens, costUsd },
        draft: validated,
      });
    } catch (err: any) {
      console.error(`❌ Failed run ${tc.id}:`, err);
      process.exit(1);
    }
  }

  const count = TEST_CASES.length;
  const avgInputTokens = Math.round(totalInputTokens / count);
  const avgOutputTokens = Math.round(totalOutputTokens / count);
  const avgTotalTokens = Math.round((totalInputTokens + totalOutputTokens) / count);
  const avgCostUsd = totalCostUsd / count;
  const avgDurationMs = Math.round(totalDurationMs / count);

  console.log('\n===============================================================');
  console.log('📊 5-RUN SUMMARY & BENCHMARK AVERAGES');
  console.log('===============================================================');
  console.log(`Runs:                 ${count}`);
  console.log(`Avg Input Tokens:     ${avgInputTokens}`);
  console.log(`Avg Output Tokens:    ${avgOutputTokens}`);
  console.log(`Avg Total Tokens:     ${avgTotalTokens}`);
  console.log(`Avg Cost per Call:    $${avgCostUsd.toFixed(6)} USD`);
  console.log(`Avg Response Time:    ${avgDurationMs}ms`);
  console.log('===============================================================\n');

  const summary = {
    timestamp: new Date().toISOString(),
    runsCount: count,
    averages: {
      avgInputTokens,
      avgOutputTokens,
      avgTotalTokens,
      avgCostUsd: Number(avgCostUsd.toFixed(6)),
      avgDurationMs,
    },
    runs: results,
  };

  const outputDir = resolve(process.cwd(), 'docs/spike');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(
    resolve(outputDir, 'brand_draft_5_runs.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log(`Saved benchmark results to docs/spike/brand_draft_5_runs.json`);
}

runFiveDraftSpikes().catch((err) => {
  console.error('Fatal error during benchmark:', err);
  process.exit(1);
});
