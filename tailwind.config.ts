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
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        'surface-muted': 'var(--surface-muted)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        primary: 'var(--primary)',
        'primary-fg': 'var(--primary-fg)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        'brand-layer': 'var(--brand-layer)',
        'layout-layer': 'var(--layout-layer)',
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        tight: ['var(--font-inter-tight)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
