'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandSwitcher } from './BrandSwitcher';
import type { Brand } from '@/domain/brand';

interface NavigationProps {
  brands: Brand[];
  activeBrandId?: string;
  userEmail?: string;
}

export function Navigation({ brands, activeBrandId, userEmail }: NavigationProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/library', label: 'Library' },
    { href: '/workspace/generate', label: 'Generate' },
    { href: '/workspace/autofill', label: 'Autofill' },
    { href: '/brands', label: 'Brands' },
  ];

  return (
    <header className="border-b border-ink/10 bg-white/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Logo & Brand Switcher */}
        <div className="flex items-center space-x-6">
          <Link href="/library" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none">
                <rect x="6" y="6" width="52" height="52" rx="12" stroke="currentColor" strokeWidth="4" />
                <path
                  d="M24 20h-6v24h6M40 20h6v24h-6"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="32" cy="32" r="4" fill="#FF8A3D" />
              </svg>
            </div>
            <span className="font-tight font-bold text-xl text-ink tracking-tight">
              anyref
            </span>
          </Link>

          <div className="hidden sm:block">
            <BrandSwitcher initialBrands={brands} activeBrandId={activeBrandId} />
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center space-x-1 sm:space-x-3">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/library' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-ink/5 text-primary font-semibold'
                    : 'text-layout-layer hover:text-ink hover:bg-ink/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: User & Sign Out */}
        <div className="flex items-center space-x-3">
          {userEmail && (
            <span className="hidden md:inline text-xs text-layout-layer max-w-[140px] truncate" title={userEmail}>
              {userEmail}
            </span>
          )}

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-layout-layer hover:text-danger px-2.5 py-1.5 rounded border border-ink/10 hover:border-danger/30 transition-all font-medium"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
