import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Anyref',
  description: 'Anyref platform terms of service, acceptable use guidelines, and subscriber policies.',
  alternates: {
    canonical: 'https://anyref.app/terms',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://anyref.app',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Terms of Service',
      item: 'https://anyref.app/terms',
    },
  ],
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-layout-layer hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Anyref</span>
        </Link>

        <div className="space-y-2 border-b border-border-subtle pb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Version 1.0.0 • Effective Oct 29, 2026</span>
          </div>
          <h1 className="text-3xl font-bold font-tight tracking-tight">Terms of Service</h1>
          <p className="text-sm text-layout-layer">
            Please read these terms carefully before utilizing the Anyref AI prompt engineering studio.
          </p>
        </div>

        <div className="prose prose-sm text-ink space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold">1. Acceptance & Age Requirements</h2>
            <p className="text-layout-layer">
              By accessing Anyref, creating an account, or purchasing a subscription, you confirm that you are at least 16 years of age and agree to comply with these Terms of Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">2. Ownership and Reference Imagery</h2>
            <p className="text-layout-layer">
              Users upload reference posters and marketing graphics solely for prompt deconstruction and layout parameter extraction. You retain full ownership of your created templates. Uploaded references remain strictly private to your workspace and are never made public or used for training artificial intelligence models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">3. Subscriptions & Billing</h2>
            <p className="text-layout-layer">
              Anyref provides a free tier with generous daily deconstruction and autofill quotas. An upgraded Plus tier is planned for future release. When paid billing is activated, transactions will be handled through an authorized Merchant of Record partner.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">4. Account Deletion & Data Retention</h2>
            <p className="text-layout-layer">
              You may request immediate account deletion from your settings. A 14-day grace period is provided during which you may restore your account before all stored assets are permanently purged.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
