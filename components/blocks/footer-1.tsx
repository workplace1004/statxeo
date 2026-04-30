"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

export default function Footer1() {
  const footerCards = [
    {
      title: "Platform",
      links: [
        { text: "What’s Included", href: "#features" },
        { text: "How It Works", href: "#how-it-works" },
        { text: "Website Plans", href: "#pricing" },
        { text: "Boost Packages", href: "#boost-packages" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "About Statxeo", href: "/about" },
        { text: "Client Gallery", href: "/gallery" },
        { text: "Affiliate Program", href: "/affiliate" },
        { text: "White-Label Partners", href: "/wl" },
      ],
    },
    {
      title: "Support",
      links: [
        { text: "Contact", href: "#intake" },
        { text: "Platform Login", href: "https://statxt.com", external: true },
        { text: "FAQ", href: "/faq" },
        { text: "Hosted Site Terms", href: "/statxeo/terms" },
        { text: "Product Terms", href: "/statxeo/product-terms" },
        { text: "Privacy Policy", href: "/privacy-policy" },
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <footer className="relative w-full overflow-hidden bg-white dark:bg-neutral-950 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-6"
        >
          {/* Top Section - 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            {/* First Column - Branding */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col justify-between space-y-6 mb-6 lg:mb-0"
            >
              {/* Logo */}
              <div className="flex items-center gap-1">
                <Image src="/whiteNBG.png" alt="Statxeo" width={400} height={112} className="h-28 w-auto" />
              </div>

              {/* Motto */}
              <div>
                <h3 className="text-lg font-medium tracking-tight text-neutral-900 dark:text-white sm:text-xl">
                  Close deals before
                  <br />
                  you even reply
                </h3>
              </div>

              {/* Small Text */}
              <div className="mt-auto">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  SEO + automation websites for service businesses
                </p>
              </div>
            </motion.div>

            {/* Cards - Dynamically Rendered with negative margins approach */}
            {footerCards.map((card, index) => {
              let marginClass = "";

              if (index > 0) {
                marginClass = "-mt-px";
              }

              if (index === 0) {
                marginClass += " md:mt-0";
              } else if (index === 1) {
                marginClass += " md:-mt-px md:ml-0";
              } else if (index === 2) {
                marginClass += " md:-mt-px md:-ml-px";
              }

              marginClass += " lg:mt-0";
              if (index > 0) {
                marginClass += " lg:-ml-px";
              }

              return (
                <motion.div
                  key={card.title}
                  variants={itemVariants}
                  className={`group relative min-h-[300px] overflow-hidden border border-neutral-300 p-6 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900 sm:p-8 ${marginClass}`}
                >
                  <h4 className="mb-6 text-sm font-medium tracking-tight text-neutral-900 dark:text-white sm:text-base">
                    {card.title}
                  </h4>
                  <ul className="space-y-3">
                    {card.links.map((link) => (
                      <li key={link.text}>
                        <a
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noopener noreferrer" : undefined}
                          className="inline-flex font-light items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white sm:text-base"
                        >
                          {link.text}
                          {link.external && (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Section - Large Background Logo */}
          <motion.div
            variants={itemVariants}
            className="relative flex items-center justify-center overflow-hidden py-8 sm:py-12 md:py-16"
          >
            <div className="w-full px-4 text-center" aria-hidden="true">
              <Image src="/whiteNBG.png" alt="" width={800} height={800} className="mx-auto opacity-10 dark:opacity-8 max-w-[800px] w-full" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
