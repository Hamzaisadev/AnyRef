'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Wand2, Sparkles, Palette, LogOut } from 'lucide-react';
import { BrandSwitcher } from './BrandSwitcher';
import { useBrand } from '@/context/BrandContext';
import type { Brand } from '@/domain/brand';

interface NavigationProps {
  brands?: Brand[];
  activeBrandId?: string;
  userEmail?: string;
}

export function Navigation({ brands: propBrands, activeBrandId: propActiveBrandId, userEmail }: NavigationProps) {
  const pathname = usePathname();

  let context: ReturnType<typeof useBrand> | null = null;
  try {
    context = useBrand();
  } catch {
    context = null;
  }

  const activeBrand = context?.activeBrand;

  const navLinks = [
    { href: '/library', label: 'Library', icon: Layers },
    { href: '/workspace/generate', label: 'Deconstruct', icon: Wand2 },
    { href: '/workspace/autofill', label: 'Autofill', icon: Sparkles },
    { href: '/brands', label: 'Brands', icon: Palette },
  ];

  return (
    <header className="border-b border-ink/10 bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Logo & Brand Switcher */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          <Link
            href="/library"
            className="flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 -m-1"
            aria-label="Anyref home"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary group-hover:scale-105 transition-all duration-150 shadow-2xs">
              <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <rect x="6" y="6" width="52" height="52" rx="12" stroke="currentColor" strokeWidth="4" />
                <path
                  d="M24 20h-6v24h6M40 20h6v24h-6"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="32" cy="32" r="4" fill="var(--accent)" />
              </svg>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-tight font-bold text-xl text-ink tracking-tight group-hover:text-primary transition-colors">
                anyref
              </span>
              {activeBrand?.wordmark && (
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase transition-colors">
                  {activeBrand.wordmark}
                </span>
              )}
            </div>
          </Link>

          <div className="hidden sm:block">
            <BrandSwitcher initialBrands={propBrands} activeBrandId={propActiveBrandId} />
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/library' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] ${
                  isActive
                    ? 'bg-ink text-paper font-semibold shadow-xs'
                    : 'text-layout-layer hover:text-ink hover:bg-ink/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-accent' : 'text-layout-layer'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: User & Sign Out */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {userEmail && (
            <span
              className="hidden lg:inline text-xs text-layout-layer max-w-[150px] truncate font-mono bg-paper px-2 py-1 rounded border border-ink/10"
              title={userEmail}
            >
              {userEmail}
            </span>
          )}

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center space-x-1.5 text-xs text-layout-layer hover:text-danger px-2.5 py-1.5 rounded-lg border border-ink/10 hover:border-danger/30 hover:bg-danger/5 transition-all duration-150 font-medium active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              title="Sign out of Anyref"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
