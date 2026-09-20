import { LandingNav } from "@/components/landing/LandingNav";
import { SplitHero } from "@/components/landing/SplitHero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { MethodSection } from "@/components/landing/MethodSection";
import { ProgressionSection } from "@/components/landing/ProgressionSection";
import { CampaignsSection } from "@/components/landing/CampaignsSection";
import { SponsorsSection } from "@/components/landing/SponsorsSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="bg-canvas text-ink">
      <LandingNav />
      <SplitHero />
      <ProblemSection />
      <MethodSection />
      <ProgressionSection />
      <CampaignsSection />
      <SponsorsSection />
      <LandingFooter />
    </div>
  );
}
