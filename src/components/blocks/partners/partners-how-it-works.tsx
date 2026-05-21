"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const STEPS = [
  {
    description:
      "Tell us whether you are white-labeling as an agency or referring as an affiliate. We align you with the right workspace, onboarding, and support channel.",
    id: 1,
    title: "Choose your partner path",
  },
  {
    description:
      "White-label partners configure branding and invite customers. Affiliates grab referral links, marketing assets, and training modules from day one.",
    id: 2,
    title: "Set up your workspace",
  },
  {
    description:
      "StatXEO AI builds websites, runs SEO/XEO, posts on social, and automates growth — you focus on selling and relationships while the platform fulfills.",
    id: 3,
    title: "Sell and let AI fulfill",
  },
] as const;

export function PartnersHowItWorks() {
  const [activeStep, setActiveStep] = useState(1);
  const current = STEPS.find((step) => step.id === activeStep)!;

  return (
    <section
      id="how-it-works"
      className="w-full bg-white px-4 py-12 sm:px-6 sm:py-20 lg:px-8 dark:bg-neutral-950"
      aria-label="How partnering works"
    >
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-6 text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
            How partnering works
          </h2>

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative border-l-2 border-dashed border-neutral-200 dark:border-neutral-800"
          >
            {STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className="relative w-full cursor-pointer text-left"
              >
                <motion.div
                  className="absolute top-0 bottom-0 left-0 -ml-px w-0.5 bg-[#3d6b55]"
                  initial={false}
                  animate={{
                    opacity: activeStep === step.id ? 1 : 0,
                    scaleY: activeStep === step.id ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ originY: 0.5 }}
                />
                <motion.div className="py-3 pl-6" layout>
                  <h3
                    className={`text-base font-medium transition-colors sm:text-lg ${
                      activeStep === step.id
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-400 dark:text-neutral-600"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <AnimatePresence>
                    {activeStep === step.id ? (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 overflow-hidden text-sm text-neutral-600 dark:text-neutral-400"
                      >
                        {step.description}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <p className="text-xs font-medium tracking-[0.2em] text-[#1e4a32] uppercase dark:text-[#8fd4a8]">
            Step {current.id}
          </p>
          <h3 className="mt-3 text-2xl font-medium text-neutral-900 dark:text-white">
            {current.title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            {current.description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
