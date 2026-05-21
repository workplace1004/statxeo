"use client";

import Footer7 from "@/components/blocks/footer-7";
import { Navigation3 } from "@/components/blocks/navigation-3";
import { PartnersCta } from "@/components/blocks/partners/partners-cta";
import { PartnersFaq } from "@/components/blocks/partners/partners-faq";
import { PartnersFeatures } from "@/components/blocks/partners/partners-features";
import { PartnersHero } from "@/components/blocks/partners/partners-hero";
import { PartnersHowItWorks } from "@/components/blocks/partners/partners-how-it-works";
import { PartnersPaths } from "@/components/blocks/partners/partners-paths";

export function PartnersPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation3 variant="partners" />
      <main id="main-content">
        <PartnersHero />
        <PartnersPaths />
        <PartnersHowItWorks />
        <PartnersFeatures />
        <PartnersFaq />
        <PartnersCta />
      </main>
      <Footer7 />
    </div>
  );
}
