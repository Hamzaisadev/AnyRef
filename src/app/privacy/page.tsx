import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Anyref',
  description: 'Anyref data privacy practices, GDPR compliance disclosures, and sub-processor documentation.',
  alternates: {
    canonical: 'https://anyref.app/privacy',
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
      name: 'Privacy Policy',
      item: 'https://anyref.app/privacy',
    },
  ],
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold font-tight tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-layout-layer">
            How Anyref safeguards your creative references, brand assets, and personal information.
          </p>
        </div>

        <div className="prose prose-sm text-ink space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold">1. Information We Collect</h2>
            <p className="text-layout-layer">
              We collect your email address for passwordless authentication, brand metadata (color palettes, voice guidelines), and saved prompt templates. We never inspect or store payment credit card numbers; payment data is managed exclusively by our Merchant of Record.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">2. Artificial Intelligence Vision Processing</h2>
            <p className="text-layout-layer">
              When you upload a poster reference to the deconstruction studio, image bytes are sent over encrypted TLS connections to Google Gemini vision models strictly for layout analysis and slot extraction. Images are not retained or utilized to train future AI models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">3. Sub-Processors</h2>
            <p className="text-layout-layer">
              Anyref utilizes trusted infrastructure sub-processors including Supabase (data storage and authentication) and Google Cloud (AI model inference). All sub-processors adhere to SOC 2 Type II and GDPR data protection requirements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">4. Your Data Protection Rights</h2>
            <p className="text-layout-layer">
              Under GDPR and CCPA, you retain full rights to request an export of all user-generated brands and entries at any time, as well as the right to self-serve account deletion. Contact our team at <strong className="text-ink">privacy@anyref.app</strong> for any inquiries.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
