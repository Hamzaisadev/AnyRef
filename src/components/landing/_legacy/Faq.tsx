'use client';

import React, { useState } from 'react';
import { SectionShell } from './shared/SectionShell';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { ChevronDown } from 'lucide-react';

export function Faq() {
  const { faq } = LANDING_CONTENT;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggleAccordion(idx: number) {
    setOpenIndex(openIndex === idx ? null : idx);
  }

  return (
    <SectionShell
      id="faq"
      theme="paper"
      eyebrow={faq.eyebrow}
      h2={faq.h2}
      align="left"
    >
      <div className="max-w-4xl space-y-4">
        {faq.items.map((item, idx) => {
          const isOpen = openIndex === idx;
          const questionId = `faq-q-${idx}`;
          const answerId = `faq-a-${idx}`;

          return (
            <div
              key={idx}
              className="rounded-2xl bg-white border border-[#0F1020]/10 shadow-sm overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                id={questionId}
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => toggleAccordion(idx)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between space-x-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2BFF]"
              >
                <span className="font-tight font-bold text-base sm:text-xl text-[#0F1020]">
                  {item.question}
                </span>
                <span
                  className={`w-8 h-8 rounded-full bg-[#0F1020]/5 flex items-center justify-center text-[#0F1020] shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-[#4B2BFF] text-white' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>

              <div
                id={answerId}
                role="region"
                aria-labelledby={questionId}
                className={`transition-all duration-300 ease-in-out px-5 sm:px-6 overflow-hidden ${
                  isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                }`}
              >
                <p className="font-sans text-sm sm:text-base text-[#5A6070] leading-relaxed pt-2 border-t border-[#0F1020]/5">
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
