'use client';

import { ChevronDown } from 'lucide-react';
import type { Brand } from '@/domain/brand';
import { useBrand } from '@/context/BrandContext';

interface BrandSwitcherProps {
  initialBrands?: Brand[];
  activeBrandId?: string;
  onBrandChange?: (brandId: string) => void;
}

export function BrandSwitcher({
  initialBrands = [],
  activeBrandId,
  onBrandChange,
}: BrandSwitcherProps) {
  let context: ReturnType<typeof useBrand> | null = null;
  try {
    context = useBrand();
  } catch {
    context = null;
  }

  const brands = context ? context.brands : initialBrands;
  const currentBrandId = context ? context.activeBrandId : (activeBrandId || initialBrands[0]?.id || '');

  function handleChange(brandId: string) {
    if (context) {
      context.switchBrand(brandId);
    } else {
      document.cookie = `anyref_active_brand=${brandId}; path=/; max-age=31536000; SameSite=Lax`;
    }
    onBrandChange?.(brandId);
  }

  const activeBrand = brands.find((b) => b.id === currentBrandId) || brands[0];

  if (brands.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center">
      <div className="relative flex items-center space-x-2 bg-surface border border-border-subtle hover:border-primary/40 px-3 py-1.5 rounded-lg shadow-2xs transition-all duration-150 group">
        {activeBrand && activeBrand.colors.length > 0 && (
          <div className="flex -space-x-1.5 shrink-0" aria-hidden="true">
            {activeBrand.colors.slice(0, 3).map((hex, i) => (
              <span
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-surface shadow-2xs transition-transform group-hover:scale-105"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        )}

        <select
          value={currentBrandId}
          onChange={(e) => handleChange(e.target.value)}
          aria-label="Select active brand"
          className="appearance-none bg-surface text-ink text-xs sm:text-sm font-semibold pr-5 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer tracking-tight"
        >
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id} className="bg-surface text-ink">
              {brand.name}
            </option>
          ))}
        </select>

        <ChevronDown className="w-3.5 h-3.5 text-layout-layer pointer-events-none absolute right-2.5 transition-transform group-hover:text-primary" />
      </div>
    </div>
  );
}
