import type { Entry } from './entry';
import type { Brand } from './brand';
import { buildInitialAutofillValues } from './slot';
import { renderPrompt } from './renderPrompt';
import { compilePrompt } from './promptCompiler';
import type { SanitizedAutofillResult } from '../services/autofillService';

/**
 * Escapes a cell value for CSV output following RFC 4180 standards.
 */
export function escapeCsvCell(cell: string | number | boolean | null | undefined): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Resolves prompt aspect ratio from product shape.
 * Square products map to 1:1, tall to 9:16, wide to 16:9, and fallback to 4:5.
 */
export function resolveAspectRatioForProductShape(shape?: string | null): string {
  if (shape === 'tall') return '9:16';
  if (shape === 'wide') return '16:9';
  if (shape === 'square') return '1:1';
  return '4:5';
}

export interface BatchExportItem {
  product_guess: string;
  productShape?: string | null;
  layoutFitWarning?: boolean;
  values?: Record<string, { value: string; source?: string; confidence?: string }>;
  needs_you?: string[];
}

/**
 * Builds an RFC 4180 compliant CSV string for a batch of autofilled products.
 * Prepends the UTF-8 Byte Order Mark (\uFEFF) to prevent character corruption (mojibake) in Microsoft Excel.
 */
export function buildBatchCsv(
  selectedEntry: Entry,
  batchItems: BatchExportItem[],
  activeBrand: Brand | null,
  activeBatchIndex: number = 0,
  activeValues?: Record<string, string>
): string {
  if (!selectedEntry || batchItems.length === 0) return '';

  const slotKeys = selectedEntry.slots
    .filter((s) => s.type !== 'attachment')
    .map((s) => s.key);

  const headers = [
    'Batch Index',
    'Product Identified',
    'Product Shape',
    'Layout Fit Warning',
    'Rendered Prompt',
    ...slotKeys,
  ];

  const rows = batchItems.map((item, idx) => {
    const values =
      idx === activeBatchIndex && activeValues
        ? activeValues
        : buildInitialAutofillValues(selectedEntry.slots, activeBrand, item);

    const rendered = renderPrompt(selectedEntry.prompt_template, selectedEntry.slots, values);

    return [
      idx + 1,
      item.product_guess,
      item.productShape || 'unknown',
      item.layoutFitWarning ? 'Yes' : 'No',
      rendered.text,
      ...slotKeys.map((k) => values[k] || ''),
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  const csvBody = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  // Prepend UTF-8 BOM so Excel on Windows decodes Unicode/emojis cleanly without ANSI corruption
  return `\uFEFF${csvBody}`;
}

export interface ComfyUiQueueItem {
  batch_index: number;
  product_guess: string;
  product_shape?: string | null;
  positive_prompt: string;
  negative_prompt?: string;
  workflow_graph?: Record<string, unknown>;
}

export interface ComfyUiBatchQueuePayload {
  client_id: string;
  generated_at: string;
  entry_id: string;
  brand_name: string;
  total_prompts: number;
  queue: ComfyUiQueueItem[];
}

/**
 * Builds a structured ComfyUI batch queue payload from an entry template and batch extraction results.
 */
export function buildComfyUiBatchQueue(
  selectedEntry: Entry,
  batchItems: BatchExportItem[],
  activeBrand: Brand | null,
  activeBatchIndex: number = 0,
  activeValues?: Record<string, string>
): ComfyUiBatchQueuePayload {
  const queue: ComfyUiQueueItem[] = batchItems.map((item, idx) => {
    const values =
      idx === activeBatchIndex && activeValues
        ? activeValues
        : buildInitialAutofillValues(selectedEntry.slots, activeBrand, item);

    const rendered = renderPrompt(selectedEntry.prompt_template, selectedEntry.slots, values);
    const targetAspectRatio = resolveAspectRatioForProductShape(item.productShape);

    const compiled = compilePrompt(rendered.text, 'sd_comfyui', {
      negativePrompt: activeBrand?.never_do_rules || undefined,
      aspectRatio: targetAspectRatio,
    });

    return {
      batch_index: idx + 1,
      product_guess: item.product_guess,
      product_shape: item.productShape || undefined,
      positive_prompt: compiled.positivePrompt,
      negative_prompt: compiled.negativePrompt,
      workflow_graph: compiled.comfyUiPayload,
    };
  });

  return {
    client_id: 'anyref-comfyui-queue',
    generated_at: new Date().toISOString(),
    entry_id: selectedEntry.id,
    brand_name: activeBrand?.name || 'Active Brand',
    total_prompts: queue.length,
    queue,
  };
}
