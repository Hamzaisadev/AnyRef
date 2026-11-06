import React from 'react';
import Link from 'next/link';
import { LANDING_CONTENT } from '@/lib/landing/content';

export function Footer() {
  const { footer } = LANDING_CONTENT;

  return (
    <footer
      className="relative w-full bg-[#0F1020] text-[#9AA0AE] border-t border-white/10 py-12 sm:py-16 px-4 sm:px-6 md:px-12"
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Left: Mark + Wordmark + Tagline */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4B2BFF] flex items-center justify-center text-white shadow-md">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M8 8h2v8H8M14 8h2v8h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="1.5" fill="#FF8A3D" />
              </svg>
            </div>
            <span className="font-tight font-extrabold text-2xl tracking-tight text-white">
              {footer.brandName.toLowerCase()}
            </span>
          </div>

          <p className="font-sans text-sm text-[#9AA0AE] max-w-sm">
            {footer.tagline}
          </p>
        </div>

        {/* Right: Legal & Navigation Links + Copyright */}
        <div className="flex flex-col md:items-end space-y-4">
          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-6 text-sm font-mono">
            {footer.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[#9AA0AE] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2BFF] rounded"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="text-xs font-mono text-[#9AA0AE]/60">
            <span>{footer.copyright}</span>
            <span className="mx-2">&bull;</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
