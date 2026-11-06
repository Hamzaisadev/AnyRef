import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ScrollDevPage from '../scroll/page';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Registry map for isolated landing component previews.
 */
const registry: Record<string, React.ComponentType> = {
  scroll: ScrollDevPage,
};

export default async function DevLandingComponentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { name } = await params;
  const Component = registry[name];

  if (!Component) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--ink)] text-[var(--text-on-ink)]">
      <Component />
    </main>
  );
}
