import type { Brand } from '@/domain/brand';

export interface BrandTheme {
  primary: string;
  primaryRgb: string;
  primaryFg: string;
  darkPrimary: string;
  darkPrimaryRgb: string;
  darkPrimaryFg: string;
  accent: string;
  accentRgb: string;
  accentFg: string;
  brandLayer: string;
  brandLayerRgb: string;
}

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
  return contrastWithDark >= contrastWithWhite ? '#15130F' : '#FBF7F0';
}

/**
 * Ensures a color has sufficient WCAG AA contrast (>= 4.5:1) against the dark surface (#12131F).
 * If the color is too dark, lightens it progressively while maintaining hue.
 */
export function ensureDarkContrast(hex: string, minContrast: number = 4.5): string {
  const darkSurfaceLum = getLuminance('#12131F'); // ~0.0055
  let currentLum = getLuminance(hex);
  let ratio = (Math.max(currentLum, darkSurfaceLum) + 0.05) / (Math.min(currentLum, darkSurfaceLum) + 0.05);

  if (ratio >= minContrast && currentLum > darkSurfaceLum) {
    return hex;
  }

  let { r, g, b } = hexToRgb(hex);

  // If pure/near black, shift toward a readable tint
  if (r < 20 && g < 20 && b < 20) {
    r = 75;
    g = 140;
    b = 255;
  }

  for (let i = 0; i < 20; i++) {
    r = Math.min(255, Math.round(r + (255 - r) * 0.15));
    g = Math.min(255, Math.round(g + (255 - g) * 0.15));
    b = Math.min(255, Math.round(b + (255 - b) * 0.15));

    const testHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    currentLum = getLuminance(testHex);
    ratio = (currentLum + 0.05) / (darkSurfaceLum + 0.05);
    if (ratio >= minContrast) {
      return testHex;
    }
  }

  return '#93C5FD';
}

/**
 * The product's own colours, used whenever a brand has not supplied its own.
 *
 * These are the landing page's ember and amber (see src/app/globals.css). This object
 * is injected as a style block by the app layout on every request, so it overrides the
 * CSS tokens: leaving the old violet here would have undone the palette unification
 * the moment anyone signed in.
 */
export const DEFAULT_THEME: BrandTheme = {
  primary: '#FF4D2E',
  primaryRgb: '255 77 46',
  primaryFg: '#1A0B06',
  darkPrimary: ensureDarkContrast('#FF4D2E'),
  darkPrimaryRgb: hexToRgb(ensureDarkContrast('#FF4D2E')).rgbString,
  darkPrimaryFg: getContrastForeground(ensureDarkContrast('#FF4D2E')),
  accent: '#F2B705',
  accentRgb: '242 183 5',
  accentFg: '#241A00',
  brandLayer: '#1B4DFF',
  brandLayerRgb: '27 77 255',
};

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
 * - Computes a contrast-safe dark mode variant (darkPrimary) for legibility on dark backgrounds.
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
    accent = getLuminance(primary) > 0.4 ? '#15130F' : '#F2B705';
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

  const darkPrimary = ensureDarkContrast(primary);

  return {
    primary,
    primaryRgb: hexToRgb(primary).rgbString,
    primaryFg: getContrastForeground(primary),
    darkPrimary,
    darkPrimaryRgb: hexToRgb(darkPrimary).rgbString,
    darkPrimaryFg: getContrastForeground(darkPrimary),
    accent,
    accentRgb: hexToRgb(accent).rgbString,
    accentFg: getContrastForeground(accent),
    brandLayer,
    brandLayerRgb: hexToRgb(brandLayer).rgbString,
  };
}

/**
 * Generates dynamic CSS variables string for insertion into a <style> tag.
 * Injects contrast-safe dark mode variables under @media (prefers-color-scheme: dark).
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
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary: ${theme.darkPrimary || theme.primary};
    --primary-rgb: ${theme.darkPrimaryRgb || theme.primaryRgb};
    --primary-fg: ${theme.darkPrimaryFg || theme.primaryFg};
  }
}`;
}

/**
 * Updates CSS variables directly on the client document root in real time.
 */
export function applyBrandThemeToDocument(theme: BrandTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const activePrimary = isDark && theme.darkPrimary ? theme.darkPrimary : theme.primary;
  const activePrimaryRgb = isDark && theme.darkPrimaryRgb ? theme.darkPrimaryRgb : theme.primaryRgb;
  const activePrimaryFg = isDark && theme.darkPrimaryFg ? theme.darkPrimaryFg : theme.primaryFg;

  root.style.setProperty('--primary', activePrimary);
  root.style.setProperty('--primary-rgb', activePrimaryRgb);
  root.style.setProperty('--primary-fg', activePrimaryFg);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-rgb', theme.accentRgb);
  root.style.setProperty('--accent-fg', theme.accentFg);
  root.style.setProperty('--brand-layer', theme.brandLayer);
  root.style.setProperty('--brand-layer-rgb', theme.brandLayerRgb);
}
