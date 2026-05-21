"use client";

import {Check} from "lucide-react";
import {motion} from "motion/react";

import {WEBSITE_PACKAGES} from "@/components/onboarding/onboarding-data";
import {ShinyBadge, ShinyCta, ShinyDot} from "@/components/brand/shiny-glass";
import {BoostPricing8} from "@/components/blocks/pricing-8";
import {
  PricingCardGlow,
  PricingCardSurface,
} from "@/components/pricing/pricing-card-glow";
import {
  PricingGrainHeading,
  PricingGrainSection,
  PricingGrainStack,
} from "@/components/pricing/pricing-grain-section";

const containerVariants = {
  hidden: {opacity: 0},
  visible: {
    opacity: 1,
    transition: {staggerChildren: 0.12, delayChildren: 0.08},
  },
};

const itemVariants = {
  hidden: {opacity: 0, y: 24},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const},
  },
};

export function LandingPricing() {
  return (
    <section className="relative w-full overflow-x-hidden bg-white py-16 dark:bg-neutral-950">
      <PricingGrainStack>
        <PricingGrainSection variant="website" stackPosition="top">
          <PricingGrainHeading
            variant="website"
            title="Website packages"
            description="Pick the website you want to buy first. Every package is a one-time project fee. Monthly boost add-ons come next."
          />
          <p className="-mt-6 mb-10 text-center text-sm text-[#8fd4a8]/80">
            Pay once — site goes live. No subscriptions, no hidden fees.
          </p>

          <motion.div
            className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-3 lg:gap-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true, margin: "-80px"}}
          >
            {WEBSITE_PACKAGES.map((pkg) => {
              const popular = "popular" in pkg && pkg.popular;
              return (
                <motion.article
                  key={pkg.id}
                  variants={itemVariants}
                  className="relative flex h-full flex-col"
                >
                  <PricingCardGlow
                    variant={popular ? "featured" : "default"}
                    animated={popular}
                    onGrain
                    className="flex-1"
                  >
                    <PricingCardSurface featured={popular} onGrain>
                      {popular ? (
                        <div className="mb-4 flex justify-center">
                          <ShinyBadge>Most popular</ShinyBadge>
                        </div>
                      ) : null}
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                          {pkg.name}
                        </h3>
                        <span className="shrink-0 pt-0.5 text-xs font-medium tracking-wide text-neutral-500 uppercase">
                          One-time
                        </span>
                      </div>
                      <div className="mb-3 flex items-baseline gap-1">
                        <span className="text-4xl font-medium tracking-tight text-neutral-900 dark:text-white">
                          {pkg.price}
                        </span>
                      </div>
                      <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
                        {pkg.priceLabel}
                      </p>
                      <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {pkg.ownership}
                      </p>
                      <ShinyCta
                        href="/onboarding/customer"
                        className="mb-8 block w-full py-3.5 text-center"
                      >
                        Get {pkg.name}
                      </ShinyCta>
                      <p className="mb-3 text-sm font-medium text-neutral-900 dark:text-white">
                        What&apos;s included
                      </p>
                      <ul className="flex flex-col gap-3">
                        {pkg.highlights.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <ShinyDot size="sm" className="mt-0.5 shrink-0">
                              <Check className="size-3" strokeWidth={3} />
                            </ShinyDot>
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </PricingCardSurface>
                  </PricingCardGlow>
                </motion.article>
              );
            })}
          </motion.div>
        </PricingGrainSection>

        <PricingGrainSection variant="boost" stackPosition="bottom">
          <PricingGrainHeading
            variant="boost"
            title="Boost packages"
            description="Optional monthly add-ons after your website is live. Select a website package first, then add boost on checkout."
          />

          <BoostPricing8 onGrain />
        </PricingGrainSection>
      </PricingGrainStack>

      <div className="relative z-10 mx-auto mt-12 flex w-full max-w-[1400px] justify-center px-4 sm:px-6 lg:px-8">
        <ShinyCta href="/onboarding/customer" size="lg">
          Get started
        </ShinyCta>
      </div>
    </section>
  );
}
