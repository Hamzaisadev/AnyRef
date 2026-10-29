'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Brand } from '@/domain/brand';

interface BrandSwitcherProps {
  initialBrands: Brand[];
  activeBrandId?: string;
  onBrandChange?: (brandId: string) => void;
}

export function BrandSwitcher({
  initialBrands,
  activeBrandId,
  onBrandChange,
}: BrandSwitcherProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [selectedId, setSelectedId] = useState<string>(
    activeBrandId || initialBrands[0]?.id || ''
  );

  useEffect(() => {
    if (initialBrands.length > 0 && !selectedId) {
      setSelectedId(initialBrands[0]?.id || '');
    }
  }, [initialBrands, selectedId]);

  function handleChange(brandId: string) {
    setSelectedId(brandId);
    document.cookie = `anyref_active_brand=${brandId}; path=/; max-age=31536000; SameSite=Lax`;
    onBrandChange?.(brandId);
  }

  const activeBrand = brands.find((b) => b.id === selectedId) || brands[0];

  return (
    <div className="relative inline-flex items-center">
      <div className="relative flex items-center space-x-2 bg-paper/90 border border-ink/15 hover:border-ink/30 px-3 py-1.5 rounded-lg shadow-2xs transition-all duration-150 group">
        {activeBrand && activeBrand.colors.length > 0 && (
          <div className="flex -space-x-1.5 shrink-0" aria-hidden="true">
            {activeBrand.colors.slice(0, 3).map((hex, i) => (
              <span
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        )}

        <select
          value={selectedId}
          onChange={(e) => handleChange(e.target.value)}
          aria-label="Select active brand"
          className="appearance-none bg-transparent text-ink text-xs sm:text-sm font-semibold pr-5 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer tracking-tight"
        >
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        <ChevronDown className="w-3.5 h-3.5 text-layout-layer pointer-events-none absolute right-2.5 transition-transform group-hover:text-ink" />
      </div>
    </div>
  );
}
