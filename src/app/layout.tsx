import type { Metadata } from 'next';
import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Anyref — Any reference. Your brand. Ready to prompt.',
  description:
    'A private prompt-library web app that turns Pinterest poster references into reusable, fill-in-the-blank image-generation prompts.',
  icons: {
    icon: '/brand/logo.svg',
  },
  openGraph: {
    title: 'Anyref — Prompt Studio',
    description: 'Any reference. Your brand. Ready to prompt.',
    images: [{ url: '/brand/social-preview.svg', width: 1280, height: 640 }],
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
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}
