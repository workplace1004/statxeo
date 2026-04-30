"use client";

import { motion } from "motion/react";
import DepthCard from "@/components/react-bits/depth-card";

const cards = [
  {
    title: "Crawl-ready by default",
    description:
      "Sitemap, robots directives, and indexable trust pages help this sales site look like a real operating business instead of a placeholder funnel.",
    href: "/faq",
    cta: "See FAQ",
    image: "/card_1.png",
  },
  {
    title: "Legal + buyer trust",
    description:
      "Privacy policy, hosted site terms, and product terms give prospects the signals they expect before paying for SEO and messaging infrastructure.",
    href: "/privacy-policy",
    cta: "Read privacy policy",
    image: "/card_2.png",
  },
  {
    title: "AI-readable discovery",
    description:
      "llms output and structured content support better machine readability for modern agent-based discovery and recommendation flows.",
    href: "/llms.txt",
    cta: "Open llms.txt",
    image: "/card_3.png",
  },
] as const;

export function SeoReadinessSection() {
  return (
    <section className="w-full px-4 py-18 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <p className="text-sm font-mono uppercase tracking-[0.22em] text-primary">Search legitimacy</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built to look legitimate to buyers, crawlers, and AI systems.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            If this is selling SEO, automation, and 10DLC-aware lead capture, the site itself should visibly prove it has the pages and technical assets a serious business would have.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="flex"
            >
              <DepthCard
                image={card.image}
                title={card.title}
                description={card.description}
                ctaLabel={card.cta}
                href={card.href}
                width="100%"
                height={380}
                borderRadius="28px"
                maxRotation={10}
                maxTranslation={12}
                disableOnMobile
                ariaLabel={card.cta}
                className="neo-surface h-full min-h-[380px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
                contentClassName="justify-end px-6 py-7 sm:px-7"
                spotlightColor="rgba(148, 163, 184, 0.35)"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
