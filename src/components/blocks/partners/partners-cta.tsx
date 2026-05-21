"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { ShinyCta } from "@/components/brand/shiny-glass";

export function PartnersCta() {
  return (
    <section className="w-full bg-white px-4 py-12 sm:px-6 sm:py-20 lg:px-8 dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-6 rounded-3xl bg-neutral-900 px-6 py-12 text-center sm:px-10 sm:py-16 dark:bg-neutral-100"
      >
        <p className="text-xs font-medium tracking-[0.2em] text-[#8fd4a8] uppercase dark:text-[#3d6b55]">
          Ready to partner?
        </p>
        <h2 className="max-w-xl text-2xl font-medium tracking-tight text-white sm:text-3xl dark:text-neutral-900">
          Launch your agency brand or start earning referral commissions today.
        </h2>
        <p className="max-w-lg text-sm text-neutral-300 sm:text-base dark:text-neutral-600">
          Start white-label or affiliate onboarding, or return to the home page to
          begin as a customer.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <ShinyCta
            href="/onboarding/white-label"
            rounded="rounded-full"
            className="group inline-flex items-center gap-2 px-6 py-3"
          >
            White-Label workspace
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </ShinyCta>
          <Link
            href="/onboarding/affiliate"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-900 no-underline transition-colors hover:bg-neutral-200 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
          >
            Affiliate workspace
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
