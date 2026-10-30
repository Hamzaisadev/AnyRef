import { describe, it, expect } from 'vitest';
import { compilePrompt, compileAllTargets } from '@/domain/promptCompiler';
import { renderPrompt } from '@/domain/renderPrompt';
import type { Slot } from '@/domain/slot';

describe('Multi-Model Target Compiler (src/domain/promptCompiler.ts)', () => {
  const samplePrompt = 'Commercial studio poster for "REWIRED" wireless headphones. Minimalist aesthetic, deep obsidian background with electric blue rim lighting.';

  describe('Midjourney v6.1 Compiler', () => {
    it('appends --ar, --v 6.1, and --style raw by default', () => {
      const result = compilePrompt(samplePrompt, 'midjourney', { aspectRatio: '16:9' });
      expect(result.target).toBe('midjourney');
      expect(result.fullCommand).toContain('/imagine prompt:');
      expect(result.fullCommand).toContain('--ar 16:9');
      expect(result.fullCommand).toContain('--v 6.1');
      expect(result.fullCommand).toContain('--style raw');
      expect(result.fullCommand).toContain('"REWIRED"');
    });

    it('formats negative prompt into --no syntax without commas', () => {
      const result = compilePrompt(samplePrompt, 'midjourney', {
        negativePrompt: 'neon gradients, cartoon mascots, blurry text',
      });
      expect(result.fullCommand).toContain('--no neon gradients cartoon mascots blurry text');
      expect(result.negativePrompt).toBe('neon gradients cartoon mascots blurry text');
    });

    it('supports custom stylize parameter --s', () => {
      const result = compilePrompt(samplePrompt, 'midjourney', { stylize: 250 });
      expect(result.fullCommand).toContain('--s 250');
    });

    it('warns when prompt exceeds 1500 chars', () => {
      const longPrompt = 'A'.repeat(1600);
      const result = compilePrompt(longPrompt, 'midjourney');
      expect(result.warnings.some((w) => w.includes('Midjourney prompt is'))).toBe(true);
    });
  });

  describe('Flux.1 Compiler', () => {
    it('strips negative prompts and adds architecture guidance warning', () => {
      const result = compilePrompt(samplePrompt, 'flux', {
        negativePrompt: 'blurry, bad quality, cartoon',
      });
      expect(result.target).toBe('flux');
      expect(result.negativePrompt).toBeUndefined();
      expect(result.fullCommand).not.toContain('blurry');
      expect(result.warnings.some((w) => w.includes('Flux.1 architecture does not support negative prompts'))).toBe(true);
    });

    it('strips legacy tag-stuffing buzzwords for natural descriptive flow and cleans punctuation', () => {
      const tagSalad = 'Studio poster of "REWIRED" headphones, masterpiece, 8k, photorealistic, ultra realistic, clean typography.';
      const result = compilePrompt(tagSalad, 'flux');
      expect(result.fullCommand).not.toContain('masterpiece');
      expect(result.fullCommand).not.toContain('8k');
      expect(result.fullCommand).not.toContain('photorealistic');
      expect(result.warnings.some((w) => w.includes('Stripped legacy tag-stuffing'))).toBe(true);

      // Edge case: tags at boundary should not leave leading or trailing commas
      const boundaryTags = '8k, photorealistic, Minimalist wireless headphones, masterpiece';
      const cleanBoundary = compilePrompt(boundaryTags, 'flux');
      expect(cleanBoundary.fullCommand).toBe('Minimalist wireless headphones');

      // Edge case: tag followed by period should not leave dangling comma-period
      const dotCollision = 'Studio headphones, photorealistic. High precision.';
      const cleanDot = compilePrompt(dotCollision, 'flux');
      expect(cleanDot.fullCommand).toBe('Studio headphones. High precision.');
    });
  });

  describe('Ideogram 2.0 Compiler', () => {
    it('preserves quoted typography and sets graphic design parameters', () => {
      const result = compilePrompt(samplePrompt, 'ideogram', { aspectRatio: '9:16' });
      expect(result.target).toBe('ideogram');
      expect(result.positivePrompt).toContain('"REWIRED"');
      expect(result.parameters.aspectRatio).toBe('9:16');
      expect(result.parameters.quotedTypographyOptimized).toBe(true);
    });

    it('warns if text lacks quoted typography', () => {
      const unquoted = 'Poster for headphones with minimalist blue rim lighting';
      const result = compilePrompt(unquoted, 'ideogram');
      expect(result.warnings.some((w) => w.includes('Ideogram 2.0 achieves maximum typographic fidelity'))).toBe(true);
    });
  });

  describe('Stable Diffusion / ComfyUI Compiler', () => {
    it('splits prompt into distinct Positive and Negative prompts with default mitigations', () => {
      const result = compilePrompt(samplePrompt, 'sd_comfyui', {
        negativePrompt: 'low saturation, text errors',
      });
      expect(result.target).toBe('sd_comfyui');
      expect(result.positivePrompt).toBe(samplePrompt);
      expect(result.negativePrompt).toContain('low saturation');
      expect(result.negativePrompt).toContain('distorted text');
      expect(result.fullCommand).toContain('[POSITIVE PROMPT]');
      expect(result.fullCommand).toContain('[NEGATIVE PROMPT]');
      expect(result.comfyUiPayload).toBeDefined();
    });

    it('generates a complete, fully connected ComfyUI node graph JSON payload without missing node references', () => {
      const result = compilePrompt(samplePrompt, 'sd_comfyui', {
        aspectRatio: '16:9',
        cfgScale: 7.5,
        steps: 28,
        sampler: 'euler_ancestral',
      });
      expect(result.comfyUiPayload).toHaveProperty('client_id');
      const promptObj = (result.comfyUiPayload as any).prompt;

      // Positive & Negative text encoders
      expect(promptObj['1'].inputs.text).toBe(samplePrompt);
      expect(promptObj['1'].inputs.clip).toEqual(['4', 1]);
      expect(promptObj['2'].inputs.text).toContain('distorted text');
      expect(promptObj['2'].inputs.clip).toEqual(['4', 1]);

      // KSampler connections
      expect(promptObj['3'].inputs.cfg).toBe(7.5);
      expect(promptObj['3'].inputs.steps).toBe(28);
      expect(promptObj['3'].inputs.model).toEqual(['4', 0]);
      expect(promptObj['3'].inputs.positive).toEqual(['1', 0]);
      expect(promptObj['3'].inputs.negative).toEqual(['2', 0]);
      expect(promptObj['3'].inputs.latent_image).toEqual(['5', 0]);

      // Checkpoint loader node 4
      expect(promptObj['4']).toBeDefined();
      expect(promptObj['4'].class_type).toBe('CheckpointLoaderSimple');

      // Empty latent image node 5 with 16:9 dimensions (1344 x 768)
      expect(promptObj['5']).toBeDefined();
      expect(promptObj['5'].class_type).toBe('EmptyLatentImage');
      expect(promptObj['5'].inputs.width).toBe(1344);
      expect(promptObj['5'].inputs.height).toBe(768);

      // VAE decode node 6 and SaveImage node 7
      expect(promptObj['6']).toBeDefined();
      expect(promptObj['6'].class_type).toBe('VAEDecode');
      expect(promptObj['7']).toBeDefined();
      expect(promptObj['7'].class_type).toBe('SaveImage');
    });
  });

  describe('compileAllTargets', () => {
    it('compiles all 4 targets simultaneously', () => {
      const all = compileAllTargets(samplePrompt, { aspectRatio: '4:5' });
      expect(all.midjourney).toBeDefined();
      expect(all.flux).toBeDefined();
      expect(all.ideogram).toBeDefined();
      expect(all.sd_comfyui).toBeDefined();
      expect(all.midjourney.target).toBe('midjourney');
      expect(all.flux.target).toBe('flux');
      expect(all.ideogram.target).toBe('ideogram');
      expect(all.sd_comfyui.target).toBe('sd_comfyui');
    });
  });

  describe('renderPrompt quality warnings', () => {
    const slots: Slot[] = [
      {
        key: 'headline',
        label: 'Headline',
        type: 'short_text',
        required: true,
        optional_block: false,
        never_invent: false,
        brand_field: null,
      },
    ];

    it('flags legacy buzzwords in renderPrompt warnings', () => {
      const template = 'Poster with {{headline}}, 8k photorealistic masterpiece.';
      const res = renderPrompt(template, slots, { headline: 'LAUNCH' });
      expect(res.warnings.some((w) => w.includes('Contains legacy buzzwords'))).toBe(true);
    });

    it('flags newly synced buzzwords like high resolution and best quality', () => {
      const template = 'Poster with {{headline}}, best quality high resolution.';
      const res = renderPrompt(template, slots, { headline: 'LAUNCH' });
      expect(res.warnings.some((w) => w.includes('Contains legacy buzzwords'))).toBe(true);
    });

    it('flags missing required slots in warnings', () => {
      const template = 'Poster with {{headline}}.';
      const res = renderPrompt(template, slots, {});
      expect(res.warnings.some((w) => w.includes('Missing required slot inputs: headline'))).toBe(true);
    });
  });
});
