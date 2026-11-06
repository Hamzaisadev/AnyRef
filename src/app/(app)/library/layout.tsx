import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prompt Library & Curated Winner Vault | Anyref',
  description:
    'Browse production-grade, tested poster prompt templates across Tech, Skincare, Lifestyle, Streetwear, and Luxury Horology. Remix with zero AI token cost.',
  keywords: [
    'Midjourney prompt library',
    'curated FLUX prompt templates',
    'commercial poster prompt vault',
    'zero cost prompt remixing',
    'tested AI image prompts',
  ],
  alternates: {
    canonical: 'https://anyref.app/library',
  },
  openGraph: {
    title: 'Prompt Library & Curated Winner Vault | Anyref',
    description:
      'Explore battle-tested poster formulas in the Anyref Curated Vault. Lock and remix templates with your brand in 1 click.',
    url: 'https://anyref.app/library',
    type: 'website',
    images: [
      {
        url: '/brand/og/og-winner-vault.svg',
        width: 1200,
        height: 630,
        alt: 'Anyref Curated Winner Vault & Prompt Library',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Library & Curated Winner Vault | Anyref',
    description:
      'Browse production-grade, tested poster prompt templates across Tech, Skincare, Lifestyle, Streetwear, and Luxury Horology.',
    images: ['/brand/og/og-winner-vault.svg'],
    creator: '@anyrefapp',
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
