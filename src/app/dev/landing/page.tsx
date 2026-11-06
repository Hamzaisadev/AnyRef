import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/landing/shared/Container';
import { Heading } from '@/components/landing/shared/Heading';
import ScrollDevPage from './scroll/page';

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

export default function DevLandingGalleryPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const componentNames = Object.keys(registry);

  return (
    <main className="min-h-screen py-16 bg-[var(--ink)] text-[var(--text-on-ink)]">
      <Container>
        <div className="space-y-8">
          <div>
            <Heading level="h2">Landing Component Gallery</Heading>
            <p className="mt-2 text-text-muted-on-ink font-mono text-sm">
              Component isolated test routes for development
            </p>
          </div>

          {componentNames.length === 0 ? (
            <div className="p-8 rounded-card border border-border-subtle bg-surface text-text-muted-on-ink">
              No components registered yet in dev registry.
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {componentNames.map((name) => (
                <li key={name}>
                  <Link
                    href={`/dev/landing/${name}`}
                    className="block p-4 rounded-card border border-border-subtle bg-surface hover:border-primary/40 hover:text-accent transition-colors"
                  >
                    <span className="font-mono text-sm font-medium">{name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </main>
  );
}
