"use client";

import { useState } from "react";
import { motion } from "motion/react";

import { ShinyCta } from "@/components/brand/shiny-glass";
import { textWithShinyXeo } from "@/components/brand/shiny-xeo";
import {
  FeatureHoverScene,
  type FeatureSceneId,
} from "@/components/features/hover-scenes";

const features: {
  id: FeatureSceneId;
  title: string;
  description: string;
}[] = [
  {
    id: "website-builder",
    title: "AI website builder",
    description:
      "Launch a professional site in minutes. AI generates pages, copy, and layouts tailored to your local business.",
  },
  {
    id: "seo-xeo",
    title: "SEO & XEO engine",
    description:
      "Track keywords, fix on-page issues, and climb Google rankings with automated SEO scoring and recommendations.",
  },
  {
    id: "social-calendar",
    title: "Social calendar + AI content",
    description:
      "Plan posts across channels, generate captions and creatives, and stay consistent without hiring an agency.",
  },
  {
    id: "review-management",
    title: "Review management",
    description:
      "Monitor reviews, respond with AI drafts, and turn happy customers into social proof that drives new leads.",
  },
  {
    id: "calling",
    title: "Calling & lead capture",
    description:
      "Track calls, route leads, and never miss a customer — integrated with your CRM and automation workflows.",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    description:
      "Your 24/7 marketing copilot. Ask questions, get campaign ideas, and automate repetitive growth tasks.",
  },
];

export function Features5() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950 relative">
      {/* Dashed Top Right Fade Grid */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(229, 229, 229, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229, 229, 229, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 100% at 100% 0%, #000 20%, transparent 80%)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 100% at 100% 0%, #000 20%, transparent 80%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      <div
        className="absolute inset-0 z-0 opacity-0 dark:opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(64, 64, 64, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(64, 64, 64, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 100% at 100% 0%, #000 20%, transparent 80%)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 100% at 100% 0%, #000 20%, transparent 80%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl tracking-tight sm:text-4xl md:text-5xl lg:text-6xl font-normal text-neutral-900 dark:text-white mb-6 max-w-3xl"
          >
            Everything local businesses need to grow online
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-base tracking-tight sm:text-lg text-neutral-600 dark:text-neutral-400 mb-8"
          >
            Websites, SEO, social, reviews, calls, and AI — unified in one platform
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4"
          >
            <ShinyCta
              href="/onboarding/customer"
              rounded="rounded-lg"
              className="tracking-tight w-full sm:w-auto"
            >
              Get started free
            </ShinyCta>
            <a
              href="#pricing"
              className="tracking-tight px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium text-sm sm:text-base border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200 w-full sm:w-auto text-center no-underline cursor-pointer"
            >
              View pricing
            </a>
          </motion.div>
        </div>

        {/* Features Grid — dark bento card with high-contrast text */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              className={`p-8 md:p-10 bg-neutral-950
                  ${index !== 5 ? "border-b border-neutral-800" : ""}
                  ${index % 2 === 0 && index !== 4 ? "md:border-r md:border-neutral-800" : ""}
                  ${(index + 1) % 3 !== 0 ? "lg:border-r lg:border-neutral-800" : ""}
                  ${index < 3 ? "lg:border-b lg:border-neutral-800" : ""}
                `}
            >
              <div className="mb-8 flex justify-center">
                <FeatureHoverScene
                  id={feature.id}
                  active={hoveredIndex === index}
                />
              </div>

              <h3 className="text-lg tracking-tight sm:text-xl font-semibold text-white mb-3">
                {textWithShinyXeo(feature.title, "on-dark")}
              </h3>

              <p className="text-sm tracking-tight sm:text-base text-neutral-400 leading-normal">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
