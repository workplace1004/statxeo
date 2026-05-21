"use client";

import { motion } from "motion/react";
import { Sparkles, Leaf, HeartHandshake } from "lucide-react";

const items = [
  {
    Icon: Sparkles,
    title: "Small batch,\nmade to order",
  },
  {
    Icon: Leaf,
    title: "Clean ingredients,\nnothing hidden",
  },
  {
    Icon: HeartHandshake,
    title: "Free returns,\nno questions",
  },
];

export default function Features8() {
  return (
    <section className="w-full min-h-screen flex items-center justify-center py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 w-full">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="flex flex-col items-center text-center gap-6"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle, #f5f5f5 0%, #e5e5e5 100%)",
                }}
              >
                <item.Icon className="w-6 h-6 text-neutral-800" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-neutral-900 dark:text-white leading-tight whitespace-pre-line">
                {item.title}
              </h3>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-xs text-neutral-500 dark:text-neutral-500"
        >
          *Applies to orders placed within our return window.
        </motion.p>
      </div>
    </section>
  );
}
