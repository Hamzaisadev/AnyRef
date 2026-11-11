import type { Metadata } from 'next';
import { Archivo, Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import './landing.css';
import { TelemetryProvider } from '@/components/analytics/TelemetryProvider';
import { Motion } from '@/components/lp/Motion';

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

/**
 * Landing-page type. Archivo carries the display voice because its width axis IS the
 * concept: a held field compresses, a resolved one expands (see DESIGN.md).
 * Switzer is the text/UI voice. Both are scoped to `.lp`; the app keeps Inter.
 */
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-display-lp',
  display: 'swap',
});

const switzer = localFont({
  src: [
    { path: '../fonts/switzer-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/switzer-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/switzer-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-switzer',
  display: 'swap',
});

// Runs before first paint. Two jobs:
//  1. flag js/motion, so hidden-until-revealed styles only apply when both are on;
//  2. start the loader counter immediately, instead of waiting ~1s for React to
//     hydrate before the engine can boot. The engine adopts the running count via
//     window.__loaderStart, so the visitor sees progress from the first frame.
const flags = `document.documentElement.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion');window.__loaderStart=Date.now()`;

// Runs immediately after the loader markup, so it can find #loader. Starts the counter
// about a second before React finishes hydrating and the engine can take over; the
// engine adopts this value and clock rather than restarting at zero.
const startCount = `(function(){if(!document.documentElement.classList.contains('motion'))return;var r=document.getElementById('loader');if(!r)return;var c=r.querySelector('[data-loader-count]'),b=r.querySelector('[data-loader-bar]'),s=0;window.__loaderTick=setInterval(function(){s=Math.min(96,s+(96-s)*0.08+1.2);if(c)c.textContent=String(Math.round(s)).padStart(3,'0');if(b)b.style.transform='scaleX('+s/100+')'},32)})()`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://anyref.app'),
  title: {
    default: 'Anyref: on-brand posters that never invent a price',
    template: '%s | Anyref',
  },
  description:
    'Anyref renders on-brand marketing posters from any reference image, and blocks the render if a price, discount or date would have to be invented.',
  keywords: [
    'on-brand AI poster generator',
    'AI poster maker for small business',
    'brand-safe AI marketing images',
    'never-invent price guardrails',
    'reference poster to branded poster',
    'AI ad creative without hallucinated prices',
    'Midjourney and Flux prompt export',
    'zero-cost winner vault',
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
    title: 'Anyref: on-brand posters that never invent a price',
    description:
      'Renders marketing posters from any reference image. If a price, discount or date is missing, it stops and asks you.',
    images: [
      {
        url: '/brand/social-preview.svg',
        width: 1280,
        height: 640,
        alt: 'Anyref: a poster with its discount field held open and stamped Needs you',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anyref: posters that never invent a price',
    description:
      'Renders marketing posters from any reference image. If a price, discount or date is missing, it stops and asks you.',
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
      className={`dark ${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} ${archivo.variable} ${switzer.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Must run before paint: the engine's reveal styles are gated on these classes.
            Written as a static child rather than via React's raw-HTML escape hatch,
            which this repo bans outright (tests/unit/securitySql.test.ts). The string
            is a compile-time constant with no interpolation. */}
        <script>{flags}</script>
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
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {/* Persistent across navigations: lives in the root layout for free. */}
        {/* The bands are created by src/motion/setup.ts on first use. */}
        <div id="curtain" aria-hidden="true">
          <div className="curtain__panel" />
        </div>

        {/* First-load sequence: the product's own act, performed on itself.
            A blank sheet fills with a poster's parts in order (ground, image, brand,
            headline), and the price field stays struck out and stamped NEEDS YOU until
            the very last beat, when it resolves. The counter is a render percentage.
            Anyone who watches it has already understood what Anyref does. */}
        <div id="loader" role="status" aria-label="Rendering">
          <div className="loader__top">
            <span className="loader__name" data-loader-out>
              Anyref
            </span>
            {/* suppressHydrationWarning: the pre-boot script updates this text before
                React hydrates, and React must not reset it to 000. */}
            <span
              className="loader__count"
              data-loader-out
              data-loader-count
              suppressHydrationWarning
            >
              000
            </span>
          </div>

          <div className="loader__stage">
            <div className="loader__sheet" data-loader-sheet>
              <span className="loader__layer loader__layer--image" data-layer="1" />
              <span className="loader__layer loader__layer--brand" data-layer="2">
                Verda
              </span>
              <span className="loader__layer loader__layer--head" data-layer="3">
                Everything
                <br />
                greener
              </span>
              <span className="loader__layer loader__layer--price" data-layer="4">
                <span data-loader-price>Needs you</span>
              </span>
            </div>
          </div>

          <div className="loader__foot">
            <span className="loader__step" data-loader-step>
              Reading the reference
            </span>
            <div className="loader__bar" data-loader-bar />
          </div>
        </div>
        <script>{startCount}</script>
        <TelemetryProvider />
        {children}
        {/* Last child of <body>: React runs child effects first, so page components
            register with the engine before it boots. Global, not per-page — otherwise
            navigating to a page that lacks it would leave the curtain stuck down. */}
        <Motion />
      </body>
    </html>
  );
}
