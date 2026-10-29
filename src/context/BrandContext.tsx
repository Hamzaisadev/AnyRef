'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Brand } from '@/domain/brand';
import {
  type BrandTheme,
  resolveBrandTheme,
  applyBrandThemeToDocument,
} from '@/lib/brandTheme';

interface BrandContextType {
  brands: Brand[];
  activeBrandId: string;
  activeBrand: Brand | null;
  theme: BrandTheme;
  switchBrand: (brandId: string) => void;
  refreshBrands: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  initialBrands: Brand[];
  initialActiveBrandId?: string;
  children: React.ReactNode;
}

export function BrandProvider({
  initialBrands,
  initialActiveBrandId,
  children,
}: BrandProviderProps) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [activeBrandId, setActiveBrandId] = useState<string>(
    initialActiveBrandId || initialBrands[0]?.id || ''
  );

  const activeBrand = useMemo(() => {
    return brands.find((b) => b.id === activeBrandId) || brands[0] || null;
  }, [brands, activeBrandId]);

  const theme = useMemo(() => {
    return resolveBrandTheme(activeBrand);
  }, [activeBrand]);

  // Apply theme to document CSS variables immediately on client
  useEffect(() => {
    if (activeBrand) {
      applyBrandThemeToDocument(theme);
    }
  }, [theme, activeBrand]);

  const switchBrand = useCallback(
    (newBrandId: string) => {
      setActiveBrandId(newBrandId);
      const targetBrand = brands.find((b) => b.id === newBrandId) || null;
      if (targetBrand) {
        const nextTheme = resolveBrandTheme(targetBrand);
        applyBrandThemeToDocument(nextTheme);
      }
      document.cookie = `anyref_active_brand=${newBrandId}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    },
    [brands, router]
  );

  const refreshBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const data = await res.json();
        const brandList: Brand[] = data.brands || [];
        setBrands(brandList);
        if (brandList.length > 0 && !brandList.some((b) => b.id === activeBrandId)) {
          setActiveBrandId(brandList[0]!.id);
        }
      }
    } catch {
      // Ignore
    }
  }, [activeBrandId]);

  const value = useMemo(
    () => ({
      brands,
      activeBrandId,
      activeBrand,
      theme,
      switchBrand,
      refreshBrands,
    }),
    [brands, activeBrandId, activeBrand, theme, switchBrand, refreshBrands]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextType {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
