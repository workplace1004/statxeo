"use client";

import { motion } from "motion/react";
import { Aperture, Link, Mail } from "lucide-react";

import { ShinyXeo } from "@/components/brand/shiny-xeo";

export default function Footer7() {
  return (
    <footer className="relative w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white dark:bg-black">
      <div className="relative max-w-[1400px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10 lg:gap-8"
        >
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-[72px] h-[72px] rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
              <Aperture className="w-9 h-9 text-white dark:text-black" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white leading-[1.05] tracking-tight uppercase">
              Stat
              <br />
              <ShinyXeo variant="brand-responsive" />
              <br />
              Platform
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs tracking-[0.2em] uppercase text-neutral-500 dark:text-white/60">
              Navigation
            </h4>
            <ul className="flex flex-col gap-2 text-xl sm:text-2xl text-neutral-900 dark:text-white">
              {[
                { label: "Features", href: "/#features" },
                { label: "Pricing", href: "/#pricing" },
                { label: "Become a partner", href: "/partners" },
                { label: "Customer", href: "/onboarding/customer" },
                { label: "Get started", href: "/onboarding/customer" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="hover:text-neutral-500 dark:hover:text-white/60 transition-colors cursor-pointer"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs tracking-[0.2em] uppercase text-neutral-500 dark:text-white/60">
              Who We Are
            </h4>
            <p className="text-xl sm:text-2xl text-neutral-900 dark:text-white leading-tight">
              AI-powered SEO
              <br />
              for local businesses
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs tracking-[0.2em] uppercase text-neutral-500 dark:text-white/60">
              Socials
            </h4>
            <div className="flex items-center gap-4">
              {[Link, Mail, Aperture].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-neutral-900 dark:text-white hover:text-neutral-500 dark:hover:text-white/60 transition-colors"
                >
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
          <div className="flex flex-col gap-2 text-neutral-500 dark:text-white/60 text-xs sm:text-sm">
            <p>© 2026 • StatXEO • Build websites, rank on Google, automate growth.</p>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Privacy Policy
              </a>
              <span className="text-neutral-400 dark:text-white/30">•</span>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-neutral-500 dark:text-white/60 mb-3">
              Get Updates
            </h4>
            <form className="flex items-center rounded-full border border-neutral-300 dark:border-white/20 bg-white dark:bg-black p-1.5">
              <input
                type="email"
                placeholder="E-MAIL"
                className="flex-1 min-w-0 bg-transparent rounded-full px-5 py-2 text-neutral-900 dark:text-white text-sm tracking-[0.15em] uppercase placeholder:text-neutral-400 dark:placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black px-5 py-2.5 text-xs tracking-[0.15em] uppercase font-medium hover:bg-neutral-700 dark:hover:bg-white/90 transition-colors cursor-pointer whitespace-nowrap"
              >
                Get Updates
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
}
