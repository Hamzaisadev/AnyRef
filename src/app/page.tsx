import { AwwwardsHero } from '@/components/hero/AwwwardsHero';
import FeaturesLanding from '@/components/landing/FeaturesLanding';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#090A10] text-slate-100 flex flex-col selection:bg-primary selection:text-white">
      {/* ========================================================
          HERO SECTION — Animated 3D Deconstruction Studio
          (Maintained by Hero Agent)
          ======================================================== */}
      <AwwwardsHero />

      {/* ========================================================
          HIGH-CONVERTING PAS FEATURES LANDING PAGE
          Comprehensive PAS framework breakdown for all features
          ======================================================== */}
      <FeaturesLanding />
    </main>
  );
}
