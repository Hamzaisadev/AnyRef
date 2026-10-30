export type TargetModel = 'midjourney' | 'flux' | 'ideogram' | 'sd_comfyui';

export type AspectRatio =
  | '1:1'
  | '16:9'
  | '9:16'
  | '4:5'
  | '5:4'
  | '3:4'
  | '4:3'
  | '2:3'
  | '3:2'
  | '21:9';

export interface CompileOptions {
  aspectRatio?: AspectRatio | string;
  negativePrompt?: string;
  rawMode?: boolean;
  stylize?: number;
  version?: string;
  cfgScale?: number;
  steps?: number;
  sampler?: string;
}

export interface CompiledPrompt {
  target: TargetModel;
  label: string;
  positivePrompt: string;
  negativePrompt?: string;
  fullCommand: string;
  warnings: string[];
  parameters: {
    aspectRatio?: string;
    rawMode?: boolean;
    version?: string;
    stylize?: number;
    cfgScale?: number;
    steps?: number;
    [key: string]: string | number | boolean | undefined;
  };
  comfyUiPayload?: Record<string, unknown>;
}

export const LEGACY_KEYWORDS = [
  'photorealistic',
  'hyperrealistic',
  '8k',
  'octane render',
  'unreal engine',
  'masterpiece',
  'trending on artstation',
  'ultra realistic',
  'high resolution',
  'best quality',
] as const;

/**
 * Normalizes whitespaces across lines while keeping single line or clean breaks
 */
function cleanWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Midjourney v6.1 Compiler:
 * - Appends parameters: --ar, --v 6.1, --style raw, --s, --no
 * - Strips newlines for /imagine prompt compatibility
 */
function compileMidjourney(text: string, options: CompileOptions): CompiledPrompt {
  const warnings: string[] = [];
  const singleLineText = cleanWhitespace(text).replace(/\n+/g, ' ');

  const ar = options.aspectRatio || '4:5';
  const v = options.version || '6.1';
  const rawMode = options.rawMode !== false; // Default raw mode for commercial/graphic design

  const paramParts: string[] = [];
  paramParts.push(`--ar ${ar}`);
  paramParts.push(`--v ${v}`);
  if (rawMode) {
    paramParts.push('--style raw');
  }
  if (typeof options.stylize === 'number' && !isNaN(options.stylize)) {
    const clampedS = Math.max(0, Math.min(1000, Math.round(options.stylize)));
    paramParts.push(`--s ${clampedS}`);
  }

  // Handle negative terms via --no
  let negativeClean: string | undefined = undefined;
  if (options.negativePrompt && options.negativePrompt.trim()) {
    // Strip commas, normalize spaces for MJ --no syntax
    negativeClean = options.negativePrompt
      .replace(/[,;]+/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
    if (negativeClean) {
      paramParts.push(`--no ${negativeClean}`);
    }
  }

  if (singleLineText.length > 1500) {
    warnings.push(
      `Midjourney prompt is ${singleLineText.length} characters long. Midjourney may truncate words past ~1000 characters.`
    );
  }

  const fullCommand = `/imagine prompt: ${singleLineText} ${paramParts.join(' ')}`;

  return {
    target: 'midjourney',
    label: 'Midjourney v6.1',
    positivePrompt: singleLineText,
    negativePrompt: negativeClean,
    fullCommand,
    warnings,
    parameters: {
      aspectRatio: ar,
      version: v,
      rawMode,
      stylize: options.stylize,
    },
  };
}

/**
 * Flux.1 Compiler:
 * - Negative prompt stripping (Flux architecture has no negative conditioning)
 * - Legacy tag stripping to encourage natural descriptive prose
 * - Natural flow formatting
 */
function compileFlux(text: string, options: CompileOptions): CompiledPrompt {
  const warnings: string[] = [];
  let processed = cleanWhitespace(text);

  // 1. Negative stripping
  if (options.negativePrompt && options.negativePrompt.trim()) {
    warnings.push(
      'Flux.1 architecture does not support negative prompts. Negative prompt was stripped to prevent prompt degradation.'
    );
  }

  // 2. Tag stripping for natural descriptive flow
  const removedTags: string[] = [];
  for (const kw of LEGACY_KEYWORDS) {
    const regex = new RegExp(`(?:,\\s*)?\\b${kw}\\b(?:\\s*,)?`, 'gi');
    if (regex.test(processed)) {
      removedTags.push(kw);
      processed = processed.replace(regex, ' ');
    }
  }
  if (removedTags.length > 0) {
    warnings.push(
      `Stripped legacy tag-stuffing (${removedTags.join(', ')}) to optimize for Flux.1's natural language T5-XXL encoder.`
    );
  }

  // Sanitize punctuation after tag removal: collapse multi-commas, remove spaces before punctuation, remove leading/trailing punctuation, fix comma-period collisions
  processed = cleanWhitespace(processed)
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/,\s*,+/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/\.\s*,/g, '.')
    .replace(/^[\s,;:]+/, '')
    .replace(/[\s,;:]+$/, '')
    .trim();

  const ar = options.aspectRatio || '4:5';

  return {
    target: 'flux',
    label: 'Flux.1',
    positivePrompt: processed,
    negativePrompt: undefined,
    fullCommand: processed,
    warnings,
    parameters: {
      aspectRatio: ar,
    },
  };
}

/**
 * Ideogram 2.0 Compiler:
 * - Quoted typography optimization
 * - Graphic design layout framing
 */
function compileIdeogram(text: string, options: CompileOptions): CompiledPrompt {
  const warnings: string[] = [];
  const processed = cleanWhitespace(text);

  // Check if text has quoted words (Ideogram relies heavily on explicit quotes for typography)
  const hasQuotes = /["'].+?["']/.test(processed);
  if (!hasQuotes) {
    warnings.push(
      'Ideogram 2.0 achieves maximum typographic fidelity when slogans and wordmarks are enclosed in double quotes (e.g. "BRAND NAME").'
    );
  }

  if (options.negativePrompt && options.negativePrompt.trim()) {
    warnings.push(
      'Ideogram 2.0 does not prioritize negative prompts in graphic design workflows. Recommend focusing on positive typography cues.'
    );
  }

  const ar = options.aspectRatio || '4:5';

  return {
    target: 'ideogram',
    label: 'Ideogram 2.0',
    positivePrompt: processed,
    fullCommand: processed,
    warnings,
    parameters: {
      aspectRatio: ar,
      quotedTypographyOptimized: hasQuotes,
    },
  };
}

/**
 * Resolves standard empty latent pixel dimensions (width/height) for aspect ratios.
 */
export function getLatentDimensionsForAspectRatio(ar: AspectRatio | string = '4:5'): { width: number; height: number } {
  switch (ar) {
    case '1:1':
      return { width: 1024, height: 1024 };
    case '16:9':
      return { width: 1344, height: 768 };
    case '9:16':
      return { width: 768, height: 1344 };
    case '4:5':
      return { width: 896, height: 1152 };
    case '5:4':
      return { width: 1152, height: 896 };
    case '3:4':
      return { width: 864, height: 1152 };
    case '4:3':
      return { width: 1152, height: 864 };
    case '2:3':
      return { width: 832, height: 1216 };
    case '3:2':
      return { width: 1216, height: 832 };
    case '21:9':
      return { width: 1536, height: 640 };
    default:
      return { width: 896, height: 1152 };
  }
}

/**
 * Stable Diffusion / ComfyUI Compiler:
 * - Positive and Negative split
 * - Ready-to-paste ComfyUI JSON node specification
 */
function compileSdComfy(text: string, options: CompileOptions): CompiledPrompt {
  const warnings: string[] = [];
  const positivePrompt = cleanWhitespace(text);

  const defaultNegatives = [
    'blurry',
    'low quality',
    'distorted text',
    'bad typography',
    'deformed letters',
    'watermark',
    'pixelated',
    'low resolution',
  ];

  let combinedNegative = defaultNegatives.join(', ');
  if (options.negativePrompt && options.negativePrompt.trim()) {
    combinedNegative = `${options.negativePrompt.trim()}, ${combinedNegative}`;
  }

  const ar = options.aspectRatio || '4:5';
  const cfgScale = options.cfgScale ?? 7.0;
  const steps = options.steps ?? 30;
  const sampler = options.sampler ?? 'dpmpp_2m_karras';
  const latentDims = getLatentDimensionsForAspectRatio(ar);

  const fullCommand = `[POSITIVE PROMPT]\n${positivePrompt}\n\n[NEGATIVE PROMPT]\n${combinedNegative}`;

  const comfyUiPayload: Record<string, unknown> = {
    client_id: 'anyref-compiler',
    prompt: {
      '1': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: positivePrompt,
          clip: ['4', 1],
        },
        _meta: { title: 'Positive Prompt (AnyRef)' },
      },
      '2': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: combinedNegative,
          clip: ['4', 1],
        },
        _meta: { title: 'Negative Prompt (AnyRef)' },
      },
      '3': {
        class_type: 'KSampler',
        inputs: {
          model: ['4', 0],
          positive: ['1', 0],
          negative: ['2', 0],
          latent_image: ['5', 0],
          seed: 42,
          steps: steps,
          cfg: cfgScale,
          sampler_name: sampler,
          scheduler: 'karras',
          denoise: 1.0,
        },
        _meta: { title: 'KSampler' },
      },
      '4': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: 'v1-5-pruned-emaonly.safetensors',
        },
        _meta: { title: 'Load Checkpoint' },
      },
      '5': {
        class_type: 'EmptyLatentImage',
        inputs: {
          width: latentDims.width,
          height: latentDims.height,
          batch_size: 1,
        },
        _meta: { title: 'Empty Latent Image' },
      },
      '6': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['3', 0],
          vae: ['4', 2],
        },
        _meta: { title: 'VAE Decode' },
      },
      '7': {
        class_type: 'SaveImage',
        inputs: {
          filename_prefix: 'AnyRef',
          images: ['6', 0],
        },
        _meta: { title: 'Save Image' },
      },
    },
  };

  return {
    target: 'sd_comfyui',
    label: 'Stable Diffusion / ComfyUI',
    positivePrompt,
    negativePrompt: combinedNegative,
    fullCommand,
    warnings,
    parameters: {
      aspectRatio: ar,
      cfgScale,
      steps,
      sampler,
    },
    comfyUiPayload,
  };
}

/**
 * Deep Module: Multi-Model Target Compiler
 * Compiles a rendered prompt for a specific AI image generator target.
 */
export function compilePrompt(
  renderedText: string,
  target: TargetModel,
  options: CompileOptions = {}
): CompiledPrompt {
  switch (target) {
    case 'midjourney':
      return compileMidjourney(renderedText, options);
    case 'flux':
      return compileFlux(renderedText, options);
    case 'ideogram':
      return compileIdeogram(renderedText, options);
    case 'sd_comfyui':
      return compileSdComfy(renderedText, options);
    default: {
      const _exhaustive: never = target;
      throw new Error(`Unsupported target model: ${_exhaustive}`);
    }
  }
}

/**
 * Compiles rendered prompt across all supported targets at once.
 */
export function compileAllTargets(
  renderedText: string,
  options: CompileOptions = {}
): Record<TargetModel, CompiledPrompt> {
  return {
    midjourney: compileMidjourney(renderedText, options),
    flux: compileFlux(renderedText, options),
    ideogram: compileIdeogram(renderedText, options),
    sd_comfyui: compileSdComfy(renderedText, options),
  };
}
