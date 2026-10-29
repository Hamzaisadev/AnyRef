import type { Brand } from '@/domain/brand';

export interface BrandTheme {
  primary: string;
  primaryRgb: string;
  primaryFg: string;
  accent: string;
  accentRgb: string;
  accentFg: string;
  brandLayer: string;
  brandLayerRgb: string;
}

export const DEFAULT_THEME: BrandTheme = {
  primary: '#4B2BFF',
  primaryRgb: '75 43 255',
  primaryFg: '#FFFFFF',
  accent: '#FF8A3D',
  accentRgb: '255 138 61',
  accentFg: '#0F1020',
  brandLayer: '#2B7BFF',
  brandLayerRgb: '43 123 255',
};

export function hexToRgb(hex: string): { r: number; g: number; b: number; rgbString: string } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) {
    return { r: 75, g: 43, b: 255, rgbString: '75 43 255' };
  }
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return { r, g, b, rgbString: `${r} ${g} ${b}` };
}

export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return toLinear(r) * 0.2126 + toLinear(g) * 0.7152 + toLinear(b) * 0.0722;
}

/**
 * Calculates whether black or white text provides better WCAG contrast ratio on the given background.
 */
export function getContrastForeground(hex: string): string {
  const lum = getLuminance(hex);
  const contrastWithWhite = 1.05 / (lum + 0.05);
  const contrastWithDark = (lum + 0.05) / 0.055;
  return contrastWithDark >= contrastWithWhite ? '#0F1020' : '#FFFFFF';
}

/**
 * Detects if a hex code is a near-black neutral/ink background color (e.g. #0F1020, #111827, #000000).
 */
export function isNeutralInk(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max < 45 && max - min < 25;
}

/**
 * Resolves dynamic theme colors from a Brand profile.
 * - Intelligently checks if the first color is a dark ink/neutral.
 * - Extracts primary, accent, and brand-layer tokens with proper contrast text.
 */
export function resolveBrandTheme(brand?: Brand | null): BrandTheme {
  if (!brand || !brand.colors || brand.colors.length === 0) {
    return DEFAULT_THEME;
  }

  const colors = brand.colors.filter((c) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(c));
  if (colors.length === 0) {
    return DEFAULT_THEME;
  }

  let primary = colors[0]!;
  let accent = DEFAULT_THEME.accent;
  let brandLayer = colors[0]!;

  if (colors.length === 1) {
    primary = colors[0]!;
    brandLayer = colors[0]!;
    accent = getLuminance(primary) > 0.4 ? '#0F1020' : '#FF8A3D';
  } else if (colors.length === 2) {
    if (isNeutralInk(colors[0]!) && !isNeutralInk(colors[1]!)) {
      primary = colors[1]!;
      accent = colors[0]!;
      brandLayer = colors[1]!;
    } else {
      primary = colors[0]!;
      accent = colors[1]!;
      brandLayer = colors[0]!;
    }
  } else {
    // 3 or more colors
    if (isNeutralInk(colors[0]!) && !isNeutralInk(colors[1]!)) {
      primary = colors[1]!;
      accent = colors[2] || colors[0]!;
      brandLayer = colors[1]!;
    } else {
      primary = colors[0]!;
      accent = colors[1]!;
      brandLayer = colors[2] || colors[0]!;
    }
  }

  return {
    primary,
    primaryRgb: hexToRgb(primary).rgbString,
    primaryFg: getContrastForeground(primary),
    accent,
    accentRgb: hexToRgb(accent).rgbString,
    accentFg: getContrastForeground(accent),
    brandLayer,
    brandLayerRgb: hexToRgb(brandLayer).rgbString,
  };
}

/**
 * Generates dynamic CSS variables string for insertion into a <style> tag.
 */
export function generateBrandCssVariables(theme: BrandTheme): string {
  return `:root {
  --primary: ${theme.primary};
  --primary-rgb: ${theme.primaryRgb};
  --primary-fg: ${theme.primaryFg};
  --accent: ${theme.accent};
  --accent-rgb: ${theme.accentRgb};
  --accent-fg: ${theme.accentFg};
  --brand-layer: ${theme.brandLayer};
  --brand-layer-rgb: ${theme.brandLayerRgb};
}`;
}

/**
 * Updates CSS variables directly on the client document root in real time.
 */
export function applyBrandThemeToDocument(theme: BrandTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-rgb', theme.primaryRgb);
  root.style.setProperty('--primary-fg', theme.primaryFg);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-rgb', theme.accentRgb);
  root.style.setProperty('--accent-fg', theme.accentFg);
  root.style.setProperty('--brand-layer', theme.brandLayer);
  root.style.setProperty('--brand-layer-rgb', theme.brandLayerRgb);
}
