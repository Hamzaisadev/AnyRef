import { describe, it, expect } from 'vitest';
import { CURATED_TEMPLATES } from '@/domain/curatedTemplates';
import { compilePrompt, compileAllTargets } from '@/domain/promptCompiler';
import { renderPrompt } from '@/domain/renderPrompt';
import { CreateEntryBodySchema } from '@/domain/apiSchemas';
import type { Brand } from '@/domain/brand';
import type { Entry } from '@/domain/entry';
import {
  escapeCsvCell,
  buildBatchCsv,
  buildComfyUiBatchQueue,
  resolveAspectRatioForProductShape,
} from '@/domain/batchExport';

describe('Strategic Enhancements Suite', () => {
  const sampleBrand: Brand = {
    id: '11111111-1111-4111-8111-111111111111',
    user_id: 'user-001',
    name: 'Veloce Dynamics',
    what_you_sell: 'Carbon fiber racing bicycles',
    why: 'Peak speed without vibration fatigue',
    tone: 'Aggressive, technical, minimalist',
    colors: ['#0A0A10', '#E50914', '#F4F4F6'],
    wordmark: 'VELOCE',
    logo_path: 'https://storage.supabase.co/logos/veloce.png',
    footer_text: 'veloce.cc — Handcrafted in Milan',
    slogan: 'Engineered Velocity',
    never_do_rules: 'Never show rusted frames, never use neon green or comic fonts.',
    default_values: { headline: 'BREAK THE RECORD' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('1. Curated Template Zero-Cost Brand Cloning Contract', () => {
    it('all curated templates produce payloads that satisfy CreateEntryBodySchema', () => {
      for (const t of CURATED_TEMPLATES) {
        const payload = {
          brand_id: sampleBrand.id,
          prompt_template: t.prompt_template,
          slots: t.slots,
          status: 'draft',
          poster_type: t.poster_type,
          intended_product_shape: t.intended_product_shape,
          note: `Cloned from Curated Vault: ${t.title}`,
        };

        const result = CreateEntryBodySchema.safeParse(payload);
        expect(
          result.success,
          `Template "${t.title}" failed CreateEntryBodySchema: ${JSON.stringify(
            result.error?.errors
          )}`
        ).toBe(true);
      }
    });

    it('cloned templates resolve with active brand tokens seamlessly', () => {
      const techTemplate = CURATED_TEMPLATES.find((t) => t.id === 'vault-cyber-tech')!;
      expect(techTemplate).toBeDefined();

      const values: Record<string, string> = {
        brand_name: sampleBrand.wordmark,
        primary_color: sampleBrand.colors[0]!,
        secondary_color: sampleBrand.colors[1]!,
        product_name: 'AeroStrike Carbon X1',
        headline: sampleBrand.default_values?.headline || 'SPEED REDEFINED',
        price_tag: '$6,499',
        footer_note: sampleBrand.footer_text,
      };

      const rendered = renderPrompt(techTemplate.prompt_template, techTemplate.slots, values);
      expect(rendered.text).toContain('"VELOCE"');
      expect(rendered.text).toContain('#0A0A10');
      expect(rendered.text).toContain('#E50914');
      expect(rendered.text).toContain('"BREAK THE RECORD"');
      expect(rendered.text).toContain('"$6,499"');
      expect(rendered.text).toContain('"veloce.cc — Handcrafted in Milan"');
      expect(rendered.missingRequired).toHaveLength(0);
    });
  });

  describe('2. Multi-Model Target Compiler Specifications', () => {
    const rawRendered =
      'Studio poster for "VELOCE" racing bicycle with aerodynamic carbon chassis. Dramatic rim lighting in #E50914. Headline: "BREAK THE RECORD".';

    it('Midjourney v6.1 preserves quotes and appends parameters correctly', () => {
      const compiled = compilePrompt(rawRendered, 'midjourney', {
        aspectRatio: '16:9',
        rawMode: true,
        stylize: 300,
        negativePrompt: sampleBrand.never_do_rules,
      });

      expect(compiled.fullCommand).toMatch(/^\/imagine prompt:/);
      expect(compiled.fullCommand).toContain('--ar 16:9');
      expect(compiled.fullCommand).toContain('--v 6.1');
      expect(compiled.fullCommand).toContain('--style raw');
      expect(compiled.fullCommand).toContain('--s 300');
      expect(compiled.fullCommand).toContain('--no Never show rusted frames never use neon green or comic fonts.');
    });

    it('Flux.1 strips negative prompts and does not append --no or negative keywords', () => {
      const compiled = compilePrompt(rawRendered, 'flux', {
        negativePrompt: sampleBrand.never_do_rules,
        aspectRatio: '9:16',
      });

      expect(compiled.target).toBe('flux');
      expect(compiled.negativePrompt).toBeUndefined();
      expect(compiled.fullCommand).not.toContain('--no');
      expect(compiled.fullCommand).not.toContain('never use neon');
      expect(compiled.warnings.length).toBeGreaterThan(0);
      expect(compiled.warnings[0]).toContain('Flux.1 architecture does not support negative prompts');
    });

    it('Ideogram 2.0 optimizes quoted typography and sets graphic design metadata', () => {
      const compiled = compilePrompt(rawRendered, 'ideogram', {
        aspectRatio: '1:1',
      });

      expect(compiled.target).toBe('ideogram');
      expect(compiled.positivePrompt).toContain('"VELOCE"');
      expect(compiled.positivePrompt).toContain('"BREAK THE RECORD"');
      expect(compiled.parameters.quotedTypographyOptimized).toBe(true);
    });

    it('SD / ComfyUI outputs split positive and negative prompts with ComfyUI node graph', () => {
      const compiled = compilePrompt(rawRendered, 'sd_comfyui', {
        negativePrompt: 'low resolution, artifacts',
        cfgScale: 7.0,
        steps: 25,
      });

      expect(compiled.target).toBe('sd_comfyui');
      expect(compiled.positivePrompt).toBe(rawRendered);
      expect(compiled.negativePrompt).toContain('low resolution, artifacts');
      expect(compiled.negativePrompt).toContain('distorted text');
      expect(compiled.comfyUiPayload).toBeDefined();

      const nodes = (compiled.comfyUiPayload as any).prompt;
      expect(nodes['1'].inputs.text).toBe(rawRendered);
      expect(nodes['2'].inputs.text).toContain('distorted text');
      expect(nodes['3'].inputs.cfg).toBe(7.0);
      expect(nodes['3'].inputs.steps).toBe(25);
    });

    it('compileAllTargets returns all 4 compilers', () => {
      const all = compileAllTargets(rawRendered, {
        negativePrompt: sampleBrand.never_do_rules,
      });

      expect(all.midjourney).toBeDefined();
      expect(all.flux).toBeDefined();
      expect(all.ideogram).toBeDefined();
      expect(all.sd_comfyui).toBeDefined();
    });
  });

  describe('3. Batch Export & Serialization Contracts', () => {
    it('escapes CSV cells correctly when cell contains commas, quotes, or newlines using domain escapeCsvCell', () => {
      expect(escapeCsvCell('Simple')).toBe('"Simple"');
      expect(escapeCsvCell('With, Comma')).toBe('"With, Comma"');
      expect(escapeCsvCell('With "Quotes"')).toBe('"With ""Quotes"""');
      expect(escapeCsvCell('With\nNewline')).toBe('"With\nNewline"');
      expect(escapeCsvCell(null)).toBe('""');
      expect(escapeCsvCell(undefined)).toBe('""');
      expect(escapeCsvCell('✨ Organic Café — €19.99')).toBe('"✨ Organic Café — €19.99"');
    });

    it('builds CSV with UTF-8 Byte Order Mark (\\uFEFF) to prevent Excel character corruption (mojibake)', () => {
      const mockEntry: Entry = {
        id: 'entry-001',
        brand_id: sampleBrand.id,
        user_id: sampleBrand.user_id,
        prompt_template: 'Poster for {{brand_name}}: {{product_name}}, "{{headline}}".',
        slots: [
          {
            key: 'brand_name',
            label: 'Brand',
            type: 'short_text',
            required: true,
            optional_block: false,
            never_invent: false,
            brand_field: 'wordmark',
          },
          {
            key: 'product_name',
            label: 'Product',
            type: 'short_text',
            required: true,
            optional_block: false,
            never_invent: false,
            brand_field: null,
            default: 'AeroFrame',
          },
          {
            key: 'headline',
            label: 'Headline',
            type: 'short_text',
            required: true,
            optional_block: false,
            never_invent: false,
            brand_field: null,
          },
        ],
        status: 'draft',
        poster_type: 'launch',
        intended_product_shape: 'tall',
        note: '',
        parent_entry_id: null,
        reference_path: null,
        result_path: null,
        system_prompt_version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockBatch = [
        {
          product_guess: 'Carbon Speedster',
          productShape: 'tall' as const,
          values: {
            headline: { value: 'ÉLÉGANCE & VITESSE — €6,499' },
          },
        },
      ];

      const csv = buildBatchCsv(mockEntry, mockBatch, sampleBrand);

      // Must start with UTF-8 BOM
      expect(csv.startsWith('\uFEFF')).toBe(true);
      // Must contain header row
      expect(csv).toContain('"Batch Index","Product Identified","Product Shape","Layout Fit Warning","Rendered Prompt"');
      // Must contain Unicode and special characters intact
      expect(csv).toContain('ÉLÉGANCE & VITESSE — €6,499');
      expect(csv).toContain('"VELOCE"');
    });

    it('resolves correct aspect ratio for product shapes: square to 1:1, tall to 9:16, wide to 16:9', () => {
      expect(resolveAspectRatioForProductShape('square')).toBe('1:1');
      expect(resolveAspectRatioForProductShape('tall')).toBe('9:16');
      expect(resolveAspectRatioForProductShape('wide')).toBe('16:9');
      expect(resolveAspectRatioForProductShape(undefined)).toBe('4:5');
    });

    it('builds complete ComfyUI batch queue payload with correct aspect ratio mappings', () => {
      const mockEntry: Entry = {
        id: 'entry-002',
        brand_id: sampleBrand.id,
        user_id: sampleBrand.user_id,
        prompt_template: 'Studio shot of {{product_name}} with "{{headline}}".',
        slots: [
          {
            key: 'product_name',
            label: 'Product',
            type: 'short_text',
            required: true,
            optional_block: false,
            never_invent: false,
            brand_field: null,
          },
          {
            key: 'headline',
            label: 'Headline',
            type: 'short_text',
            required: true,
            optional_block: false,
            never_invent: false,
            brand_field: null,
          },
        ],
        status: 'draft',
        poster_type: 'launch',
        intended_product_shape: 'tall',
        note: '',
        parent_entry_id: null,
        reference_path: null,
        result_path: null,
        system_prompt_version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockBatch = [
        {
          product_guess: 'Carbon Frame',
          productShape: 'tall' as const,
          values: { product_name: { value: 'Carbon Frame' }, headline: { value: 'FAST' } },
        },
        {
          product_guess: 'Aero Wheelset',
          productShape: 'square' as const,
          values: { product_name: { value: 'Aero Wheelset' }, headline: { value: 'LIGHT' } },
        },
      ];

      const payload = buildComfyUiBatchQueue(mockEntry, mockBatch, sampleBrand);

      expect(payload.total_prompts).toBe(2);
      expect(payload.client_id).toBe('anyref-comfyui-queue');
      expect(payload.queue[0]?.product_guess).toBe('Carbon Frame');
      expect(payload.queue[0]?.positive_prompt).toContain('Carbon Frame');

      // Check aspect ratio mapping: item 0 (tall) has empty latent 9:16 (768 x 1344)
      const graphTall = payload.queue[0]?.workflow_graph?.prompt as any;
      expect(graphTall['5'].inputs.width).toBe(768);
      expect(graphTall['5'].inputs.height).toBe(1344);

      // Check aspect ratio mapping: item 1 (square) has empty latent 1:1 (1024 x 1024)
      const graphSquare = payload.queue[1]?.workflow_graph?.prompt as any;
      expect(graphSquare['5'].inputs.width).toBe(1024);
      expect(graphSquare['5'].inputs.height).toBe(1024);
    });
  });
});
