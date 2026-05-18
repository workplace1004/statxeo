import { Navbar } from "@/components/sections/navbar";
import { HeroSection } from "@/components/sections/hero";
import { FeaturesSection } from "@/components/sections/features";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { LeadRoutingCtaSection } from "@/components/sections/lead-routing-cta";
import Footer1 from "@/components/blocks/footer-1";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://statxeo.com";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Statxeo",
      url: siteUrl,
      logo: `${siteUrl}/blackNBG.svg`,
      description:
        "Statxeo builds high-converting SEO websites with 10DLC-ready messaging and Statxt lead routing for service businesses.",
    },
    {
      "@type": "WebSite",
      name: "Statxeo",
      url: siteUrl,
      potentialAction: {
        "@type": "ReadAction",
        target: siteUrl,
      },
    },
    {
      "@type": "Service",
      serviceType: "SEO website build and lead routing",
      provider: {
        "@type": "Organization",
        name: "Statxeo",
      },
      areaServed: "United States",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "149.99",
        highPrice: "999.99",
        priceCurrency: "USD",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroSection />
        <FeaturesSection />

        <section className="py-6 sm:py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </section>

        <HowItWorksSection />

        <section className="py-6 sm:py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </section>

        <LeadRoutingCtaSection />

        <section className="py-6 sm:py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </section>

      </main>
      <Footer1 />
    </>
  );
}
