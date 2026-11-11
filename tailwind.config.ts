import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        paper: 'var(--paper)',
        primary: 'var(--primary)',
        'primary-fg': 'var(--primary-fg)',
        'primary-hover': 'var(--primary-hover)',
        'primary-deep': 'var(--primary-deep)',
        'paper-2': 'var(--paper-2)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        'brand-blue': 'var(--brand-blue)',
        'layout-gray': 'var(--layout-gray)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        'text-on-ink': 'var(--text-on-ink)',
        'text-muted-on-ink': 'var(--text-muted-on-ink)',
        'text-on-paper': 'var(--text-on-paper)',
        'text-muted-on-paper': 'var(--text-muted-on-paper)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        'surface-muted': 'var(--surface-muted)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'brand-layer': 'var(--brand-blue)',
        'layout-layer': 'var(--layout-gray)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        tight: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-body)', 'sans-serif'],
      },
      fontSize: {
        'display-xl': [
          'clamp(3.25rem, 8.5vw, 9rem)',
          { lineHeight: '0.95', letterSpacing: '-0.035em' },
        ],
        h2: [
          'clamp(2.25rem, 5vw, 4.5rem)',
          { lineHeight: '1.02', letterSpacing: '-0.03em' },
        ],
        h3: [
          'clamp(1.35rem, 2vw, 2rem)',
          { lineHeight: '1.15' },
        ],
        'body-lg': [
          'clamp(1.05rem, 1.3vw, 1.25rem)',
          { lineHeight: '1.55' },
        ],
        body: [
          '1rem',
          { lineHeight: '1.6' },
        ],
        mono: [
          'clamp(0.8125rem, 1vw, 0.9375rem)',
          { lineHeight: '1.65' },
        ],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)',
      },
      spacing: {
        'nav-h': 'var(--nav-h)',
      },
    },
  },
  plugins: [],
};

export default config;
