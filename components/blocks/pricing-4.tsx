"use client";

import { motion } from "motion/react";

export default function Pricing4() {
  return (
    <section className="relative w-full">
      {/* Top Section - Light Gray */}
      <div className="bg-neutral-100 dark:bg-neutral-900 py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] w-full">
          {/* Pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <span className="inline-flex items-center px-4 py-1 rounded-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-900 dark:text-white">
              Pricing
            </span>
          </motion.div>

          {/* Large Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-center text-neutral-900 dark:text-white leading-tight mb-6"
          >
            Deploy Faster,
            <br />
            Scale Smarter
          </motion.h1>
        </div>
      </div>

      {/* Bottom Section - White */}
      <div className="bg-white dark:bg-neutral-950 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] w-full">
          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <p className="text-xl sm:text-2xl font-medium text-neutral-900 dark:text-white mb-2">
              Ship code faster with automated CI/CD.
            </p>
            <p className="text-xl sm:text-2xl font-medium text-neutral-900 dark:text-white">
              Free for small teams.
            </p>
          </motion.div>

          {/* Pricing Cards Container */}
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-4xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white dark:bg-neutral-950 rounded-3xl p-6 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1.5 rounded-sm bg-black dark:bg-white text-white dark:text-black text-xs font-medium">
                    Starter
                  </span>
                  <span className="px-3 py-1.5 rounded-sm bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-medium">
                    Monthly
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-end justify-between mb-6">
                  <span className="text-5xl font-bold text-neutral-900 dark:text-white">
                    $29
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 pb-2">
                    per month/user
                  </span>
                </div>

                {/* Description */}
                <p className="text-neutral-900 dark:text-white text-base mb-8">
                  Perfect for side projects and small teams.
                </p>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      5 team members
                    </p>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      100 build minutes/month
                    </p>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      Community support
                    </p>
                  </div>
                  <div className="border-t border-b border-neutral-200 dark:border-neutral-800 py-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      Basic analytics
                    </p>
                  </div>
                </div>

                <div className="flex-1" />

                {/* Button */}
                <button className="cursor-pointer w-full px-6 py-2.5 rounded-sm bg-black dark:bg-white text-white dark:text-black font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200">
                  Get started
                </button>
              </motion.div>

              {/* Recommended Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 flex flex-col shadow-xl border border-neutral-200 dark:border-neutral-800 scale-[1.03]"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1.5 rounded-sm bg-teal-400 text-black text-xs font-medium">
                    Pro
                  </span>
                  <span className="px-3 py-1.5 rounded-sm bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-medium">
                    Annual
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-end justify-between mb-6">
                  <span className="text-5xl font-bold text-neutral-900 dark:text-white">
                    $99
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 pb-2">
                    per year/user
                  </span>
                </div>

                {/* Description */}
                <p className="text-neutral-900 dark:text-white text-base mb-8">
                  For teams shipping production apps at scale.
                </p>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      Unlimited team members
                    </p>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      2,000 build minutes/month
                    </p>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      Priority support
                    </p>
                  </div>
                  <div className="border-t border-b border-neutral-200 dark:border-neutral-700 py-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      Advanced deployments
                    </p>
                  </div>
                </div>

                <div className="flex-1" />

                {/* Button */}
                <button className="w-full px-6 py-2.5 rounded-sm cursor-pointer bg-teal-400 hover:bg-teal-300 text-black font-medium text-sm transition-colors duration-200">
                  Checkout now
                </button>
              </motion.div>

              {/* Enterprise Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white dark:bg-neutral-950 rounded-3xl p-6 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1.5 rounded-sm bg-black dark:bg-white text-white dark:text-black text-xs font-medium">
                    Enterprise
                  </span>
                  <span className="px-3 py-1.5 rounded-sm bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-medium">
                    Custom
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-end justify-between mb-6">
                  <span className="text-5xl font-bold text-neutral-900 dark:text-white">
                    Enterprise
                  </span>
                </div>

                {/* Description */}
                <p className="text-neutral-900 dark:text-white text-base mb-8">
                  Tailored infrastructure for mission-critical workloads.
                </p>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      Unlimited build minutes
                    </p>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      SOC 2 compliance
                    </p>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      Dedicated support engineer
                    </p>
                  </div>
                  <div className="border-t border-b border-neutral-200 dark:border-neutral-800 py-4">
                    <p className="text-neutral-900 dark:text-white text-sm">
                      Self-hosted option
                    </p>
                  </div>
                </div>

                <div className="flex-1" />

                {/* Button */}
                <button className="cursor-pointer w-full px-6 py-2.5 rounded-sm bg-black dark:bg-white text-white dark:text-black font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200">
                  Contact us
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
