import type { Metadata } from 'next';
import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { TelemetryProvider } from '@/components/analytics/TelemetryProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://anyref.app'),
  title: {
    default: 'Anyref — AI Poster Prompt Studio | Turn Any Reference into Your Brand Prompts',
    template: '%s | Anyref',
  },
  description:
    'Private visual prompt-engineering studio. Deconstruct Pinterest and Behance poster references into reusable, brand-consistent image prompts for Midjourney v6, FLUX.1, and Ideogram.',
  keywords: [
    'AI poster prompt engineering',
    'Midjourney v6 prompt generator',
    'FLUX.1 prompt builder',
    'Pinterest reference to prompt',
    'brand-safe AI prompts',
    'Never-Invent guardrails',
    'prompt deconstruction',
    'commercial poster prompt templates',
    'graphic design prompt templates',
    'zero-cost winner vault',
    'Ideogram prompt typography',
    'visual prompt library',
  ],
  authors: [{ name: 'Anyref Team', url: 'https://anyref.app' }],
  creator: 'Anyref',
  publisher: 'Anyref Studio',
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://anyref.app',
    siteName: 'Anyref Studio',
    title: 'Anyref — Turn Any Reference Poster into Brand-Locked AI Prompts',
    description:
      'Deconstruct visual references into reusable prompt templates with tri-color slot encoding, Never-Invent guardrails, and ordered multi-asset checklists.',
    images: [
      {
        url: '/brand/social-preview.svg',
        width: 1280,
        height: 640,
        alt: 'Anyref Visual Prompt Engineering Studio Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anyref — AI Poster Prompt Studio',
    description:
      'Turn Pinterest references into reusable, brand-consistent Midjourney & Flux prompt templates in 60 seconds.',
    images: ['/brand/social-preview.svg'],
    creator: '@anyrefapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/brand/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/brand/logo.svg',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Anyref',
  url: 'https://anyref.app',
  logo: 'https://anyref.app/brand/logo.svg',
  description:
    'Private visual prompt-engineering studio and prompt-library web application that turns poster references into brand-locked AI prompts.',
  sameAs: [
    'https://x.com/anyrefapp',
    'https://github.com/anyref/anyref',
    'https://discord.gg/anyref',
    'https://www.linkedin.com/company/anyref',
  ],
};

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Anyref Studio',
  url: 'https://anyref.app',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'All (Modern Web Browsers)',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  featureList: [
    'Reference Poster Deconstruction',
    'Brand DNA Injection & Automatic Slot Binding',
    'Programmatic Never-Invent Guardrails',
    'Zero-Cost Winner Vault',
    'Autofill Studio & In-Memory Ephemeral RAM Processing',
    'Midjourney v6.1 and FLUX.1 Ordered Multi-Asset Checklists',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Anyref',
  url: 'https://anyref.app',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://anyref.app/library?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(softwareApplicationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <TelemetryProvider />
        {children}
      </body>
    </html>
  );
}
