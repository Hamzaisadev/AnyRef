'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'Does AnyRef generate or render images directly inside the app?',
      answer:
        'No, and that is by deliberate design. In-app image generators lock you into outdated models with steep credit markups. AnyRef is a dedicated visual prompt engineering studio that deconstructs references and outputs production-grade prompts and ordered asset checklists for Midjourney v6, FLUX.1, and Ideogram—where image quality is highest and you already have subscriptions.',
    },
    {
      question: 'Why can’t I just ask ChatGPT or Claude to write my image prompts?',
      answer:
        'General LLMs hallucinate fake discounts, forget your brand colors after three prompts, cannot detect aspect-ratio geometry conflicts, and dump walls of messy text. AnyRef gives you a dedicated visual architecture: hard Never-Invent guardrails for prices and dates, tri-color slot visual highlighting, in-memory layout-fit warnings, and zero-cost winner reusability.',
    },
    {
      question: 'Are my client’s unreleased product photos and embargoed assets secure?',
      answer:
        '100% secure. Product photos dropped into the Autofill Studio are processed purely in-memory (ephemeral RAM) to extract campaign slots and check aspect-ratio fit. They are never written to disk, stored in cloud databases, or used for model training. Once the prompt compiles, the image data is instantly wiped.',
    },
    {
      question: 'How does the Zero-Cost Winner Vault save my team money?',
      answer:
        'When you find a prompt formula that produces an approved, high-converting poster in Midjourney or Flux, stamp it as a "Winner". AnyRef locks that template. Next month, when you launch a new product or holiday campaign, you swap the product cutout and headline with zero AI API token costs ($0.00). Your prompt library compounds in value over time.',
    },
    {
      question: 'Which image generation platforms work with AnyRef prompts?',
      answer:
        'AnyRef compiles prompts specifically tuned for Midjourney v6.1 (including multi-image upload ordering and --sref styling), FLUX.1 [Schnell & Dev], Ideogram v2 (for crisp typography alignment), and Recraft v3. You can also paste prompts into Stable Diffusion or DALL-E 3.',
    },
    {
      question: 'Do I need prior prompt engineering experience to get great results?',
      answer:
        'Zero. AnyRef does the technical heavy lifting: extracting camera focal lengths, 3-point lighting setups, negative prompt constraints, and typographic hierarchy from reference posters. You simply review the tri-color slots, drop your product photo, and copy the final prompt.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <section 
      id="faq" 
      aria-labelledby="faq-heading" 
      className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto w-full"
    >
      {/* Schema.org FAQPage structured data */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-cyan-950/60 text-cyan-300 border border-cyan-400/30">
          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Objections Addressed</span>
        </div>

        <h2 
          id="faq-heading" 
          className="font-tight font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight"
        >
          Frequently Asked Questions
        </h2>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          Everything you need to know about AnyRef’s prompt architecture, security, and external workflow.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-slate-950/80 shadow-md overflow-hidden transition-all hover:border-white/20"
            >
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[52px]"
              >
                <span className="font-tight font-bold text-base sm:text-lg text-white">
                  {faq.question}
                </span>
                <span
                  className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-cyan-300 border-cyan-400/30 bg-cyan-950/50' : ''
                  }`}
                  aria-hidden="true"
                >
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>

              {isOpen && (
                <div 
                  id={`faq-answer-${index}`}
                  className="px-5 sm:px-6 pb-6 pt-1 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-white/5"
                >
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
