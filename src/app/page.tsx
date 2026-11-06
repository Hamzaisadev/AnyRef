import Link from 'next/link';
import { nav } from '@/lib/landing/content';

export default function HomePage() {
  return (
    <main className="flex-1 min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center space-y-4 max-w-md">
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-on-ink">
          Anyref
        </h1>
        <p className="text-text-muted-on-ink text-base sm:text-lg font-body leading-relaxed">
          The new landing page is being rebuilt.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/workspace/studio"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-sm font-semibold text-white shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-primary"
          >
            Launch Dual-Drop Studio
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-surface border border-border-subtle text-sm font-medium text-text-on-ink hover:text-accent transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            {nav.signIn}
          </Link>
        </div>
      </div>
    </main>
  );
}
