"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { motion } from "motion/react";

import {
  ShinyBadge,
  ShinyCta,
  ShinyDot,
  ShinyGlassSpan,
} from "@/components/brand/shiny-glass";
import {
  PricingCardGlow,
  PricingCardSurface,
} from "@/components/pricing/pricing-card-glow";

const plans = [
  {
    name: "Starter",
    price: { monthly: 49, annual: 39 },
    description: "For solo local businesses getting online",
    features: [
      "AI website builder",
      "Basic SEO scoring",
      "Social calendar (2 channels)",
      "Review monitoring",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: { monthly: 149, annual: 119 },
    description: "Everything to rank, post, and capture leads on autopilot",
    features: [
      "Full SEO & XEO engine",
      "Unlimited social + AI content",
      "AI Assistant",
      "Calling & lead capture",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Agency",
    price: { monthly: 399, annual: 329 },
    description:
      "White-label platform for agencies and resellers managing clients.",
    features: [
      "Unlimited subaccounts",
      "White-label branding",
      "Team management",
      "Dedicated account manager",
      "Reseller margins",
    ],
    popular: false,
  },
];

export function Pricing6() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-visible bg-white px-4 py-12 sm:px-6 lg:px-8 dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full relative z-10 flex flex-col items-center">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl sm:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            Simple pricing for <br />
            every stage of growth
          </h2>
        </div>

        <div className="flex items-center justify-center mb-16">
          <div className="p-1 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center relative w-60">
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)]"
              style={{ left: "0.25rem" }}
              animate={{
                x: billingCycle === "monthly" ? 0 : "100%",
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 35,
                mass: 0.8,
              }}
            >
              <ShinyGlassSpan className="block h-full w-full rounded-full" aria-hidden />
            </motion.div>

            <button
              onClick={() => setBillingCycle("monthly")}
              className={`relative cursor-pointer z-10 flex-1 py-2 text-sm font-medium rounded-full transition-colors duration-200 text-center ${billingCycle === "monthly"
                ? "text-white"
                : "text-neutral-500 dark:text-neutral-400"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`relative cursor-pointer z-10 flex-1 py-2 text-sm font-medium rounded-full transition-colors duration-200 text-center ${billingCycle === "annual"
                ? "text-white"
                : "text-neutral-500 dark:text-neutral-400"
                }`}
            >
              Annual
            </button>
          </div>
        </div>

        <motion.div
          className="grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-2 sm:px-4 lg:grid-cols-3 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative h-full w-full"
            >
              <PricingCardGlow
                variant={plan.popular ? "featured" : "default"}
                animated={plan.popular}
              >
                <PricingCardSurface featured={plan.popular}>
                  <div className="flex justify-between items-center mb-4">
                    <h3
                      className={`text-xl font-medium ${plan.popular ? "text-[#1e4a32] dark:text-[#8fd4a8]" : "text-neutral-600 dark:text-neutral-400"}`}
                    >
                      {plan.name}
                    </h3>
                    {plan.popular ? (
                      <ShinyBadge>Most Popular</ShinyBadge>
                    ) : null}
                  </div>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-medium tracking-tight text-neutral-900 dark:text-white">
                      ${" "}
                      {billingCycle === "monthly"
                        ? plan.price.monthly
                        : plan.price.annual}
                      ,00
                    </span>
                  </div>

                  <p
                    className={`text-sm mb-8 leading-relaxed ${plan.popular ? "text-neutral-500 dark:text-neutral-300" : "text-neutral-500 dark:text-neutral-400"}`}
                  >
                    {plan.description}
                  </p>

                  <ShinyCta
                    href="/onboarding/customer"
                    className="mb-8 block w-full py-3.5 text-center"
                  >
                    {index === 2 ? "Contact sales" : "Start 14-day trial"}
                  </ShinyCta>

                  <div className="space-y-4">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      What&apos;s included :
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          {plan.popular ? (
                            <ShinyDot size="sm">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </ShinyDot>
                          ) : (
                            <div className="rounded-full bg-neutral-900 p-1 text-white dark:bg-white dark:text-black">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </div>
                          )}
                          <span
                            className={`text-sm ${plan.popular ? "text-neutral-600 dark:text-neutral-300" : "text-neutral-600 dark:text-neutral-400"}`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </PricingCardSurface>
              </PricingCardGlow>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
