import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ensureDarkContrast, getLuminance } from '@/lib/brandTheme';

describe('Stage 5: Quality & Accessibility Fixes', () => {
  it('S5-1: verifies URL.revokeObjectURL cleanup in generate, autofill, and compare pages', () => {
    const generatePath = path.resolve(process.cwd(), 'src/app/(app)/workspace/generate/page.tsx');
    const autofillPath = path.resolve(process.cwd(), 'src/app/(app)/workspace/autofill/page.tsx');
    const comparePath = path.resolve(process.cwd(), 'src/app/(app)/entries/[id]/compare/page.tsx');

    const generateCode = fs.readFileSync(generatePath, 'utf8');
    const autofillCode = fs.readFileSync(autofillPath, 'utf8');
    const compareCode = fs.readFileSync(comparePath, 'utf8');

    // All three pages must revoke object URLs
    expect(generateCode).toContain('URL.revokeObjectURL(previewUrl)');
    expect(autofillCode).toContain('URL.revokeObjectURL(photoPreview)');
    expect(compareCode).toContain('URL.revokeObjectURL(resultImage)');

    // All three pages must have unmount cleanup returns
    expect(generateCode).toMatch(/useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*return\s*\(\)\s*=>\s*\{[\s\S]*revokeObjectURL/);
    expect(autofillCode).toMatch(/useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*return\s*\(\)\s*=>\s*\{[\s\S]*revokeObjectURL/);
    expect(compareCode).toMatch(/useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*return\s*\(\)\s*=>\s*\{[\s\S]*revokeObjectURL/);
  });

  it('S5-2: verifies brand switcher is not hidden on mobile navigation', () => {
    const navPath = path.resolve(process.cwd(), 'src/components/Navigation.tsx');
    const navCode = fs.readFileSync(navPath, 'utf8');

    expect(navCode).not.toContain('<div className="hidden sm:block">\n            <BrandSwitcher');
    expect(navCode).toContain('<BrandSwitcher');
  });

  it('S5-3: verifies dark mode contrast-safe variant has >= 4.5:1 ratio for very dark brand colors', () => {
    const darkSurfaceLum = getLuminance('#12131F');
    const darkColors = ['#000000', '#0A0B10', '#1E293B', '#111827', '#0F1020', '#1A0B2E'];

    for (const darkHex of darkColors) {
      const safeVariant = ensureDarkContrast(darkHex);
      const safeLum = getLuminance(safeVariant);
      const ratio = (safeLum + 0.05) / (darkSurfaceLum + 0.05);

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('S5-4: verifies prefers-reduced-motion CSS rules in globals.css', () => {
    const cssPath = path.resolve(process.cwd(), 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
    expect(cssContent).toContain('animation-duration: 0.01ms !important');
    expect(cssContent).toContain('transition-duration: 0.01ms !important');
  });

  it('S5-5: verifies unused dead code PaywallModal.tsx is removed', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/PaywallModal.tsx');
    expect(fs.existsSync(modalPath)).toBe(false);
  });
});
