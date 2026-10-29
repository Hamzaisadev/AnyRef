import { describe, it, expect } from 'vitest';
import {
  resolveBrandTheme,
  generateBrandCssVariables,
  hexToRgb,
  getLuminance,
  getContrastForeground,
  DEFAULT_THEME,
} from '@/lib/brandTheme';
import type { Brand } from '@/domain/brand';

describe('brandTheme', () => {
  it('falls back to default theme when brand is null or has no colors', () => {
    expect(resolveBrandTheme(null)).toEqual(DEFAULT_THEME);

    const emptyBrand = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Empty Brand',
      colors: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as Brand;

    expect(resolveBrandTheme(emptyBrand)).toEqual(DEFAULT_THEME);
  });

  it('correctly maps Rewired palette (ink, primary, accent)', () => {
    const rewired = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Rewired',
      colors: ['#0F1020', '#4B2BFF', '#FF8A3D'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as Brand;

    const theme = resolveBrandTheme(rewired);
    expect(theme.primary).toBe('#4B2BFF');
    expect(theme.accent).toBe('#FF8A3D');
    expect(theme.brandLayer).toBe('#4B2BFF');
    expect(theme.primaryRgb).toBe('75 43 255');
  });

  it('correctly maps Riwayat palette (burgundy, gold, silk)', () => {
    const riwayat = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Riwayat',
      colors: ['#4A1521', '#D4AF37', '#F7F6F2'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as Brand;

    const theme = resolveBrandTheme(riwayat);
    expect(theme.primary).toBe('#4A1521');
    expect(theme.accent).toBe('#D4AF37');
    expect(theme.primaryFg).toBe('#FFFFFF'); // Burgundy is dark, needs white text
    expect(theme.accentFg).toBe('#0F1020'); // Gold is bright, needs dark ink text
  });

  it('calculates contrast foreground accurately', () => {
    expect(getContrastForeground('#FFFFFF')).toBe('#0F1020'); // Bright
    expect(getContrastForeground('#D4AF37')).toBe('#0F1020'); // Gold (bright)
    expect(getContrastForeground('#000000')).toBe('#FFFFFF'); // Dark
    expect(getContrastForeground('#4B2BFF')).toBe('#FFFFFF'); // Dark blue
    expect(getContrastForeground('#4A1521')).toBe('#FFFFFF'); // Dark wine
  });

  it('generates valid CSS variables string for HTML style tag', () => {
    const theme = {
      primary: '#123456',
      primaryRgb: '18 52 86',
      primaryFg: '#FFFFFF',
      accent: '#FF8800',
      accentRgb: '255 136 0',
      accentFg: '#0F1020',
      brandLayer: '#123456',
      brandLayerRgb: '18 52 86',
    };

    const css = generateBrandCssVariables(theme);
    expect(css).toContain('--primary: #123456;');
    expect(css).toContain('--accent: #FF8800;');
    expect(css).toContain('--primary-fg: #FFFFFF;');
    expect(css).toContain('--accent-fg: #0F1020;');
  });
});
