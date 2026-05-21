"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { ShinyAccent, ShinyCta } from "@/components/brand/shiny-glass";

export function PartnersHero() {
  return (
    <section className="w-full bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-6 text-center"
      >
        <span className="inline-flex items-center rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium tracking-wide text-neutral-700 uppercase dark:border-neutral-700 dark:text-neutral-300">
          Partner program
        </span>
        <h1 className="max-w-3xl text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl dark:text-white">
          Grow with StatXEO —{" "}
          <ShinyAccent>your way</ShinyAccent>
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-400">
          Whether you operate an agency under your own brand or earn commissions
          referring local businesses, StatXEO gives you AI-powered websites, SEO,
          and marketing automation to sell and fulfill at scale.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col items-center gap-3 sm:flex-row"
        >
          <ShinyCta href="#paths" rounded="rounded-full" className="px-6 py-3">
            Compare partner paths
          </ShinyCta>
          <Link
            href="/onboarding/customer"
            className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900 no-underline transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-900"
          >
            View all account types
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
