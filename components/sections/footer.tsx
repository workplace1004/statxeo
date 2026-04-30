"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const footerCards = [
  {
    title: "Product",
    links: [
      { text: "Features", href: "#features" },
      { text: "Pricing", href: "#pricing" },
      { text: "How It Works", href: "#how-it-works" },
      { text: "Get Started", href: "#intake" },
    ],
  },
  {
    title: "Legal",
    links: [
      { text: "Hosted Site Terms", href: "/statxeo/terms" },
      { text: "Product Terms", href: "/statxeo/product-terms" },
      { text: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
  {
    title: "Company",
    links: [
      { text: "Statxt Platform", href: "#", external: true },
      { text: "Contact", href: "#intake" },
    ],
  },
];

export function FooterSection() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-border py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                Stat<span className="text-primary">xeo</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              High-converting SEO sites with 10DLC-ready messaging and instant lead routing. Built by Statxt.
            </p>
            <p className="text-xs text-muted-foreground mt-auto">
              {"© 2026 Statxt \u00B7 All rights reserved."}
            </p>
          </motion.div>

          {/* Link columns */}
          {footerCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
            >
              <h4 className="text-sm font-semibold text-foreground mb-4">
                {card.title}
              </h4>
              <ul className="space-y-3">
                {card.links.map((link) => (
                  <li key={link.text}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.text}
                      {link.external && <ArrowUpRight className="h-3 w-3" />}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </footer>
  );
}
