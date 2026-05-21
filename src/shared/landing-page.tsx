"use client";

import Cta4 from "@/components/blocks/cta-4";
import {Features5} from "@/components/blocks/features-5";
import Footer7 from "@/components/blocks/footer-7";
import {Hero1} from "@/components/blocks/hero-1";
import {HowItWorks2} from "@/components/blocks/how-it-works-2";
import {Navigation3} from "@/components/blocks/navigation-3";
import {LandingPricing} from "@/components/blocks/landing-pricing";
import SocialProof5 from "@/components/blocks/social-proof-5";

export function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation3 />
      <main id="main-content">
        <Hero1 />
        <section id="features" aria-label="Features">
          <Features5 />
        </section>
        <section id="how-it-works" aria-label="How it works">
          <HowItWorks2 />
        </section>
        <section id="testimonials" aria-label="Testimonials">
          <SocialProof5 />
        </section>
        <section id="pricing" aria-label="Pricing">
          <LandingPricing />
        </section>
        <section id="get-started" aria-label="Get started">
          <Cta4 />
        </section>
      </main>
      <Footer7 />
    </div>
  );
}
