"use client";

import { ShinyGlassButton } from "@/components/brand/shiny-glass";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = [
  { id: "white-label", label: "White-Label" },
  { id: "affiliate", label: "Affiliate" },
  { id: "general", label: "General" },
] as const;

const FAQS = {
  affiliate: {
    faqs: [
      {
        answer:
          "Affiliates earn commissions on referred customers who subscribe to StatXEO. Track clicks, leads, and closed deals in your affiliate dashboard with payout management built in.",
        question: "How do affiliate commissions work?",
      },
      {
        answer:
          "You get referral links, QR codes, marketing assets, sales training, and meeting booking with dedicated account executives per vertical.",
        question: "What tools do affiliates receive?",
      },
      {
        answer:
          "Open the Affiliate workspace to explore the dashboard, or start from the home page account selector if you want to compare all paths first.",
        question: "How do I get started as an affiliate?",
      },
    ],
    title: "Affiliate",
  },
  general: {
    faqs: [
      {
        answer:
          "White-label is for agencies operating StatXEO under their brand with customer management and margins. Affiliate is for partners who refer businesses and earn commissions without running a branded platform.",
        question: "What is the difference between white-label and affiliate?",
      },
      {
        answer:
          "Yes. Use Switch account in any workspace footer to return to the landing page and pick a different path.",
        question: "Can I explore multiple account types?",
      },
      {
        answer:
          "StatXEO handles AI website generation, SEO/XEO, social posting, reviews, calling, and growth automation so partners can focus on sales and relationships.",
        question: "What does StatXEO fulfill for my clients?",
      },
    ],
    title: "General",
  },
  "white-label": {
    faqs: [
      {
        answer:
          "Agencies and resellers operate a branded StatXEO workspace — manage customers, onboarding, websites, SEO, social, automation, billing, and team access under your agency identity.",
        question: "Who is the white-label program for?",
      },
      {
        answer:
          "You control branding, customer relationships, and packaging. StatXEO provides the AI engine, fulfillment tools, and platform infrastructure with reseller-friendly margins.",
        question: "What do I control vs. StatXEO?",
      },
      {
        answer:
          "Go to the White-Label workspace to configure branding and onboard your first customer, or compare paths on this page before committing.",
        question: "How do I launch my agency workspace?",
      },
    ],
    title: "White-Label",
  },
} as const;

type CategoryId = keyof typeof FAQS;

export function PartnersFaq() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("white-label");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const current = FAQS[selectedCategory];

  return (
    <section
      id="faq"
      className="w-full bg-neutral-100 dark:bg-neutral-900"
      aria-label="Partner FAQ"
    >
      <div className="w-full px-4 py-12 sm:px-6 lg:px-16">
        <div className="mx-auto w-full max-w-[1400px]">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl dark:text-white"
          >
            Partner questions
          </motion.h2>

          <div className="mb-8 flex flex-wrap gap-2">
            {CATEGORIES.map((category) =>
              selectedCategory === category.id ? (
                <ShinyGlassButton
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setOpenIndex(0);
                  }}
                  className="cursor-pointer rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  {category.label}
                </ShinyGlassButton>
              ) : (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setOpenIndex(0);
                  }}
                  className="cursor-pointer rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                >
                  {category.label}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-16 dark:bg-neutral-950"
      >
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
          <h3 className="text-2xl font-medium text-neutral-900 sm:text-3xl lg:sticky lg:top-24 lg:self-start dark:text-white">
            {current.title}
          </h3>

          <div className="flex flex-col">
            {current.faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="border-b border-neutral-200 dark:border-neutral-800"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="group flex w-full items-start justify-between gap-4 py-6 text-left sm:py-8"
                >
                  <span className="flex-1 text-base font-medium text-neutral-900 group-hover:text-neutral-600 sm:text-lg dark:text-white dark:group-hover:text-neutral-300">
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <Minus className="mt-0.5 size-5 shrink-0 text-neutral-900 dark:text-white" />
                  ) : (
                    <Plus className="mt-0.5 size-5 shrink-0 text-neutral-900 dark:text-white" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {openIndex === index ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-8 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400">
                        {faq.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
