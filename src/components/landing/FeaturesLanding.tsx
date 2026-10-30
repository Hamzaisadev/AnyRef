import DefinitionSection from './DefinitionSection';
import SocialProofBar from './SocialProofBar';
import ProblemAgitationSection from './ProblemAgitationSection';
import InteractiveSlotDemo from './InteractiveSlotDemo';
import FeaturesSection from './FeaturesSection';
import ComparisonSection from './ComparisonSection';
import HowItWorksSection from './HowItWorksSection';
import FaqSection from './FaqSection';
import FinalCtaSection from './FinalCtaSection';
import LandingFooter from './LandingFooter';

export default function FeaturesLanding() {
  return (
    <div className="relative z-20 w-full flex flex-col items-center">
      {/* 0. Primary AI Search & GEO Extractable Definition Block */}
      <DefinitionSection />

      {/* 1. Social Proof & Generation Engine Compatibility Bar */}
      <SocialProofBar />

      {/* 2. PAS Framework: Problem & Agitation */}
      <ProblemAgitationSection />

      {/* 3. Interactive Tri-Color Slot Architecture Demonstration */}
      <InteractiveSlotDemo />

      {/* 4. PAS Framework: Solve — Comprehensive Feature Breakdown (All 10 Features) */}
      <FeaturesSection />

      {/* 5. Head-to-Head Comparison Matrix: Ad-Hoc Prompting vs AnyRef */}
      <ComparisonSection />

      {/* 6. How It Works (4 Deterministic Steps) */}
      <HowItWorksSection />

      {/* 7. Objection Handling FAQ with Schema.org Structured Data */}
      <FaqSection />

      {/* 8. High-Converting Final Call to Action with Risk Reversals */}
      <FinalCtaSection />

      {/* 9. Semantic Studio Footer */}
      <LandingFooter />
    </div>
  );
}
