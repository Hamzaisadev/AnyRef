import { getUser } from '@/services/session';
import { brandService } from '@/services/brandService';
import { Navigation } from '@/components/Navigation';
import { BrandProvider } from '@/context/BrandContext';
import { resolveBrandTheme, generateBrandCssVariables } from '@/lib/brandTheme';
import { cookies } from 'next/headers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const brands = user ? await brandService.listBrands(user.id) : [];

  const cookieStore = await cookies();
  const activeBrandId = cookieStore.get('anyref_active_brand')?.value || brands[0]?.id;
  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0] || null;

  const theme = resolveBrandTheme(activeBrand);
  const themeCss = generateBrandCssVariables(theme);

  return (
    <BrandProvider initialBrands={brands} initialActiveBrandId={activeBrandId}>
      {/* Dynamic Server-Side Brand CSS Variables (prevents FOUC) */}
      <style id="anyref-dynamic-brand-theme">{themeCss}</style>
      <div className="min-h-screen flex flex-col bg-paper transition-colors duration-300">
        <Navigation userEmail={user?.email} />
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </div>
    </BrandProvider>
  );
}
