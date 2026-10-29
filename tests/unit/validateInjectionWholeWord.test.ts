import { describe, it, expect } from 'vitest';
import { validateInjectionAndBrandRules } from '@/domain/validateInjection';
import { Brand } from '@/domain/brand';

describe('S3-2: validateInjectionAndBrandRules whole-word matching', () => {
  const brandWithNeverCars: Brand = {
    id: 'brand-1',
    user_id: 'user-1',
    name: 'Eco Brand',
    what_you_sell: 'Sustainable packaging',
    why: 'Zero waste',
    tone: 'Clean',
    colors: ['#00FF00'],
    wordmark: 'ECO',
    footer_text: '',
    slogan: '',
    default_values: {},
    never_do_rules: 'avoid cars',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('does NOT reject words that contain the banned word as a substring (e.g. cardboard, carefully)', () => {
    const promptWithSubstring = 'A cardboard box placed carefully on a wooden table.';
    const result = validateInjectionAndBrandRules(promptWithSubstring, brandWithNeverCars);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects prompts that contain the actual whole word or its plural (car, cars)', () => {
    const promptWithCar = 'A red sports car driving through a park.';
    const resultCar = validateInjectionAndBrandRules(promptWithCar, brandWithNeverCars);
    expect(resultCar.valid).toBe(false);
    expect(resultCar.errors[0]).toContain('Prompt violates brand negative rule');

    const promptWithCars = 'Multiple vintage cars parked outside.';
    const resultCars = validateInjectionAndBrandRules(promptWithCars, brandWithNeverCars);
    expect(resultCars.valid).toBe(false);
    expect(resultCars.errors[0]).toContain('Prompt violates brand negative rule');
  });

  it('still rejects script injection, external URLs, and email addresses', () => {
    expect(validateInjectionAndBrandRules('<script>alert(1)</script>', brandWithNeverCars).valid).toBe(false);
    expect(validateInjectionAndBrandRules('Visit https://evil.com for more info', brandWithNeverCars).valid).toBe(false);
    expect(validateInjectionAndBrandRules('Contact us at info@example.com', brandWithNeverCars).valid).toBe(false);
  });
});
