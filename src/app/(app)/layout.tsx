import { getUser } from '@/services/session';
import { brandService } from '@/services/brandService';
import { Navigation } from '@/components/Navigation';
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

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navigation
        brands={brands}
        activeBrandId={activeBrandId}
        userEmail={user?.email}
      />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
