"use client";

import { motion } from "motion/react";
import { Layers, Sparkles, TrendingUp } from "lucide-react";

const ITEMS = [
  {
    Icon: Sparkles,
    title: "AI fulfillment\nincluded",
    description: "Websites, SEO/XEO, social, and automation — not just a dashboard.",
  },
  {
    Icon: Layers,
    title: "Built for\nlocal businesses",
    description: "Positioning and playbooks tuned for plumbers, clinics, salons, and more.",
  },
  {
    Icon: TrendingUp,
    title: "Revenue you\ncan scale",
    description: "Reseller margins for agencies, commissions and assets for affiliates.",
  },
] as const;

export function PartnersFeatures() {
  return (
    <section className="w-full bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          {ITEMS.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="flex size-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900"
              >
                <item.Icon
                  className="size-6 text-neutral-800 dark:text-neutral-200"
                  strokeWidth={1.5}
                />
              </motion.div>
              <h3 className="text-xl font-medium tracking-tight whitespace-pre-line text-neutral-900 sm:text-2xl dark:text-white">
                {item.title}
              </h3>
              <p className="max-w-xs text-sm text-neutral-600 dark:text-neutral-400">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
