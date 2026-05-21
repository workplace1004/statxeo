"use client";

import { ShinyGlassSpan } from "@/components/brand/shiny-glass";

import { Briefcase, Handset } from "@gravity-ui/icons";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PATHS = [
  {
    badge: "Agency / Reseller",
    benefits: [
      "Customer & subaccount management",
      "AI website generator + SEO/XEO engine",
      "White-label branding & reseller margins",
      "Automation center & team management",
    ],
    cta: "Open White-Label workspace",
    description:
      "Operate your own branded version of the platform. Manage customers, automate fulfillment, and monitor growth from a single agency dashboard.",
    href: "/onboarding/white-label",
    howItWorks: [
      "Apply and configure your agency branding",
      "Onboard customers with AI-built websites and SEO",
      "Fulfill SEO, social, and campaigns under your brand",
    ],
    icon: Briefcase,
    id: "white-label",
    label: "White-Label",
    who: "Marketing agencies, web studios, and resellers who want StatXEO under their brand with healthy margins.",
  },
  {
    badge: "Sell & Earn",
    benefits: [
      "Tracking links, QR codes & widgets",
      "Lead pipeline & commission tracking",
      "Marketing assets & sales training",
      "Meeting booking & payout management",
    ],
    cta: "Open Affiliate workspace",
    description:
      "Sell the StatXEO platform and track commissions. Get marketing assets, training, and payouts while we handle product delivery.",
    href: "/onboarding/affiliate",
    howItWorks: [
      "Get referral links, assets, and training",
      "Share StatXEO with local businesses you know",
      "Track leads, book demos, and earn commissions",
    ],
    icon: Handset,
    id: "affiliate",
    label: "Affiliate",
    who: "Consultants, creators, and sales partners who refer businesses and earn on every closed deal.",
  },
] as const;

export function PartnersPaths() {
  return (
    <section
      id="paths"
      className="w-full bg-neutral-50 px-4 py-12 sm:px-6 sm:py-20 lg:px-8 dark:bg-neutral-900"
      aria-label="Partner paths"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-[1400px]"
      >
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-medium tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl dark:text-white">
            Two ways to partner
          </h2>
          <p className="mt-3 text-base text-neutral-600 dark:text-neutral-400">
            Pick the model that fits how you sell. Both paths include AI-powered
            fulfillment — websites, SEO, social, and growth automation.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {PATHS.map((path, index) => {
            const Icon = path.icon;

            return (
              <article
                key={path.id}
                id={path.id}
                className="flex flex-col rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="flex flex-1 flex-col gap-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="flex items-start gap-4"
                  >
                    <ShinyGlassSpan className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl">
                      <Icon className="relative z-10 size-6" />
                    </ShinyGlassSpan>
                    <div>
                      <p className="text-xs font-medium tracking-[0.15em] text-neutral-500 uppercase dark:text-neutral-400">
                        {path.badge}
                      </p>
                      <h3 className="mt-1 text-2xl font-medium text-neutral-900 dark:text-white">
                        {path.label}
                      </h3>
                    </div>
                  </motion.div>

                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {path.description}
                  </p>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                      Who it&apos;s for
                    </h4>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {path.who}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                      Benefits
                    </h4>
                    <ul className="mt-3 flex flex-col gap-2">
                      {path.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#3d6b55]" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                      How it works
                    </h4>
                    <ol className="mt-3 flex flex-col gap-2">
                      {path.howItWorks.map((step, stepIndex) => (
                        <li
                          key={step}
                          className="flex gap-3 text-sm text-neutral-700 dark:text-neutral-300"
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            {stepIndex + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </motion.div>

                  <Link
                    href={path.href}
                    className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white no-underline transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    {path.cta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              </article>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
