import { describe, it, expect } from 'vitest';
import { Slot, SlotType } from '@/domain/slot';
import { GenerateOutput, AutofillOutput } from '@/ai/schemas';

describe('Seam 2: Domain & AI Schemas', () => {
  describe('Slot schema', () => {
    it('validates a correct Slot definition', () => {
      const validSlot = {
        key: 'wordmark_text',
        label: 'Brand Wordmark',
        type: 'short_text',
        max_length: 40,
        required: true,
        hint: 'Centered at top',
        brand_field: 'wordmark',
        optional_block: false,
        never_invent: false,
      };

      const parsed = Slot.parse(validSlot);
      expect(parsed.key).toBe('wordmark_text');
      expect(parsed.brand_field).toBe('wordmark');
      expect(parsed.never_invent).toBe(false);
    });

    it('rejects invalid slot keys that do not match snake_case identifier rules', () => {
      const invalidSlot = {
        key: 'Invalid-Key!',
        label: 'Brand Wordmark',
        type: 'short_text',
        required: true,
        brand_field: null,
        optional_block: false,
      };

      expect(() => Slot.parse(invalidSlot)).toThrow();
    });

    it('defaults never_invent to false when omitted', () => {
      const slotWithoutNeverInvent = {
        key: 'headline',
        label: 'Headline',
        type: 'short_text',
        required: true,
        brand_field: null,
        optional_block: false,
      };

      const parsed = Slot.parse(slotWithoutNeverInvent);
      expect(parsed.never_invent).toBe(false);
    });
  });

  describe('GenerateOutput schema', () => {
    it('validates a complete AI generation payload', () => {
      const validPayload = {
        prompt_template: 'A'.repeat(250),
        slots: [
          {
            key: 'headline',
            label: 'Headline',
            type: 'short_text',
            required: true,
            brand_field: null,
            optional_block: false,
            never_invent: false,
          },
        ],
        poster_type: 'launch',
        intended_product_shape: 'tall',
        layout_notes: 'Minimalist lighting with tall central subject.',
      };

      const parsed = GenerateOutput.parse(validPayload);
      expect(parsed.poster_type).toBe('launch');
      expect(parsed.slots.length).toBe(1);
    });

    it('rejects prompt templates that are too short (under 200 characters)', () => {
      const shortPayload = {
        prompt_template: 'Too short prompt template.',
        slots: [],
        poster_type: 'other',
        intended_product_shape: 'any',
        layout_notes: 'Notes',
      };

      expect(() => GenerateOutput.parse(shortPayload)).toThrow();
    });
  });

  describe('AutofillOutput schema', () => {
    it('validates a structured autofill payload', () => {
      const validAutofill = {
        values: {
          headline: {
            value: 'NEXT GEN SOUND',
            source: 'ai',
            confidence: 'high',
          },
        },
        needs_you: ['discount_code'],
        product_shape: 'tall',
        product_guess: 'Wireless headphones',
      };

      const parsed = AutofillOutput.parse(validAutofill);
      expect(parsed.values['headline']?.value).toBe('NEXT GEN SOUND');
      expect(parsed.needs_you).toContain('discount_code');
    });
  });
});
