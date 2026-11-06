/**
 * Landing Page Design Tokens
 * 
 * Strict token definitions matching the Anyref landing specification.
 */

export const tokens = {
  colors: {
    ink: '#0F1020',
    ink2: '#171935',
    paper: '#F7F6F2',
    primary: '#4B2BFF',
    accent: '#FF8A3D',
    brandBlue: '#2B7BFF',
    layoutGray: '#9AA0AE',
    success: '#1E9E6A',
    danger: '#D64545',
    textOnInk: '#F2F1FA',
    textMutedOnInk: '#A9ABC4',
    textOnPaper: '#14152B',
    textMutedOnPaper: '#5B5D75',
  },
  dimensions: {
    navH: '72px',
  },
  radii: {
    card: '14px',
    pill: '999px',
  },
} as const;

export const LANDING_COLORS = tokens.colors;

export const SLOT_COLORS = {
  brand: { text: '#2B7BFF', bg: 'rgba(43,123,255,0.15)', border: 'rgba(43,123,255,0.3)' },
  campaign: { text: '#FF8A3D', bg: 'rgba(255,138,61,0.15)', border: 'rgba(255,138,61,0.3)' },
  layout: { text: '#9AA0AE', bg: 'rgba(154,160,174,0.15)', border: 'rgba(154,160,174,0.3)' },
} as const;

export const ANIMATION_TOKENS = {
  duration: { fast: 0.15, medium: 0.3, slow: 0.6 },
  ease: 'power2.out',
} as const;

export interface ContrastPair {
  name: string;
  text: string;
  background: string;
  minRatio: number;
  description?: string;
}

export const contrastPairs: readonly ContrastPair[] = [
  {
    name: 'text-on-ink on ink',
    text: '#F2F1FA',
    background: '#0F1020',
    minRatio: 4.5,
    description: 'Primary body & headings on dark ink background',
  },
  {
    name: 'text-muted-on-ink on ink',
    text: '#A9ABC4',
    background: '#0F1020',
    minRatio: 4.5,
    description: 'Muted secondary text on dark ink background',
  },
  {
    name: 'text-on-ink on ink-2',
    text: '#F2F1FA',
    background: '#171935',
    minRatio: 4.5,
    description: 'Primary text on secondary dark surface',
  },
  {
    name: 'text-muted-on-ink on ink-2',
    text: '#A9ABC4',
    background: '#171935',
    minRatio: 4.5,
    description: 'Muted secondary text on secondary dark surface',
  },
  {
    name: 'text-on-paper on paper',
    text: '#14152B',
    background: '#F7F6F2',
    minRatio: 4.5,
    description: 'Primary text on light paper background',
  },
  {
    name: 'text-muted-on-paper on paper',
    text: '#5B5D75',
    background: '#F7F6F2',
    minRatio: 4.5,
    description: 'Muted text on light paper background',
  },
  {
    name: 'white on primary',
    text: '#FFFFFF',
    background: '#4B2BFF',
    minRatio: 4.5,
    description: 'CTA button text on primary purple background',
  },
  {
    name: 'ink on accent',
    text: '#0F1020',
    background: '#FF8A3D',
    minRatio: 4.5,
    description: 'Dark text on accent badge/button',
  },
  {
    name: 'accent on ink',
    text: '#FF8A3D',
    background: '#0F1020',
    minRatio: 4.5,
    description: 'Accent text/badges on dark ink background',
  },
  {
    name: 'brand-blue on ink',
    text: '#2B7BFF',
    background: '#0F1020',
    minRatio: 4.5,
    description: 'Brand blue highlights on dark ink background',
  },
] as const;
