'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { LANDING_CONTENT } from '@/lib/landing/content';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const { nav } = LANDING_CONTENT;

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;

      // Blur background after 40px
      if (currentY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Hide when scrolling down, show when scrolling up
      if (currentY > 120 && currentY > lastScrollY.current + 5) {
        setVisible(false);
      } else if (currentY < lastScrollY.current - 5 || currentY <= 120) {
        setVisible(true);
      }

      lastScrollY.current = currentY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trap focus and close on Escape for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', href);
      }
      setMobileMenuOpen(false);
    }
  }

  return (
    <>
      <nav
        aria-label="Main Navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        } ${
          scrolled
            ? 'bg-[#0F1020]/90 backdrop-blur-md border-b border-white/10 shadow-lg'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 h-16 sm:h-20 flex items-center justify-between">
          {/* Left: Anyref mark + wordmark */}
          <Link
            href="/"
            className="flex items-center space-x-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2BFF] rounded-lg p-1"
            aria-label="Anyref Homepage"
          >
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
            <span className="font-tight font-extrabold text-xl tracking-tight text-white">
              {nav.brandName.toLowerCase()}
            </span>
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            {nav.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-tight font-medium text-[#9AA0AE] hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2BFF] rounded px-1.5 py-0.5"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right CTAs (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href={nav.signIn.href}
              className="text-sm font-tight font-semibold text-[#9AA0AE] hover:text-white px-3.5 py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {nav.signIn.label}
            </Link>

            <Link
              href={nav.startFree.href}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wide uppercase text-white bg-[#4B2BFF] hover:bg-[#391BDF] shadow-[0_4px_15px_rgba(75,43,255,0.4)] transition-all active:scale-95 focus:outline-none focus-visible:ring-3 focus-visible:ring-[#4B2BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1020] min-h-[40px]"
            >
              <span>{nav.startFree.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FF8A3D]" />
            </Link>
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#9AA0AE] hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2BFF]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Full-Screen Overlay Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-0 z-40 bg-[#0F1020] flex flex-col justify-between p-6 sm:p-8 pt-24 md:hidden"
        >
          <div className="flex flex-col space-y-6">
            <span className="text-[11px] font-mono tracking-widest text-[#9AA0AE] uppercase border-b border-white/10 pb-3">
              Navigation
            </span>
            {nav.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="font-tight font-extrabold text-2xl text-white hover:text-[#4B2BFF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2BFF] rounded py-1"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col space-y-4 pt-6 border-t border-white/10">
            <Link
              href={nav.signIn.href}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 text-base font-tight font-semibold text-[#9AA0AE] hover:text-white rounded-xl border border-white/10"
            >
              {nav.signIn.label}
            </Link>
            <Link
              href={nav.startFree.href}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3.5 text-base font-tight font-bold text-white bg-[#4B2BFF] hover:bg-[#391BDF] rounded-xl shadow-lg flex items-center justify-center space-x-2"
            >
              <span>{nav.startFree.label}</span>
              <ArrowRight className="w-4 h-4 text-[#FF8A3D]" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
