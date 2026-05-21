"use client";

import { useState } from "react";
import { Button, Dropdown, Label } from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";

import { ShinyCta } from "@/components/brand/shiny-glass";

type Navigation3Props = {
  /** `home` = marketing anchors; `partners` = partners page sections; `minimal` = logo + auth only */
  variant?: "home" | "partners" | "minimal";
};

const NAV_LINKS = {
  home: [
    { name: "FEATURES", href: "/#features" },
    { name: "HOW IT WORKS", href: "/#how-it-works" },
    { name: "PRICING", href: "/#pricing" },
    { name: "REVIEWS", href: "/#testimonials" },
  ],
  partners: [
    { name: "PATHS", href: "#paths" },
    { name: "HOW IT WORKS", href: "#how-it-works" },
    { name: "FAQ", href: "#faq" },
  ],
  minimal: [],
} as const;

export function Navigation3({ variant = "home" }: Navigation3Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = NAV_LINKS[variant];

  const loginLinks = [
    { label: "Customers", href: "/onboarding/customer" },
    { label: "Partners", href: "/login/partners" },
  ] as const;

  return (
    <nav className="relative w-full px-4 sm:px-6 py-4">
      <motion.div className="mx-auto w-full max-w-[1400px]">
        {/* Desktop Navigation */}
        <motion.div
          className="hidden lg:flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-white no-underline"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17L12 12L2 17Z" />
            </svg>
            <span>StatXEO</span>
          </Link>

          {navLinks.length > 0 ? (
            <div className="flex items-center gap-1 px-3 py-3 rounded-sm bg-neutral-200/80 dark:bg-neutral-900/80">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-[5px] hover:bg-white dark:hover:bg-neutral-800 no-underline"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          ) : null}

          <div
            className={`flex items-center gap-3 ${navLinks.length === 0 ? "ml-auto" : ""}`}
          >
            <Dropdown>
              <Button
                className="inline-flex items-center gap-1 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300"
                variant="ghost"
              >
                LOG IN
                <ChevronDown className="size-4 opacity-70" />
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu>
                  {loginLinks.map((item) => (
                    <Dropdown.Item
                      key={item.href}
                      id={item.href}
                      href={item.href}
                      textValue={item.label}
                    >
                      <Label>{item.label}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
            <ShinyCta
              href="/onboarding/customer"
              size="sm"
              rounded="rounded-sm"
              className="px-5 py-3"
            >
              GET STARTED
            </ShinyCta>
          </div>
        </motion.div>

        {/* Mobile Navigation */}
        <motion.div
          className="lg:hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white no-underline"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17L12 12L2 17Z" />
              </svg>
              <span>StatXEO</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-1">
                  {navLinks.length > 0 ? (
                    <div className="bg-neutral-200/80 dark:bg-neutral-900/80 rounded-2xl p-2 mb-3">
                      {navLinks.map((link, index) => (
                        <motion.div
                          key={link.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: index * 0.03,
                          }}
                        >
                          <Link
                            href={link.href}
                            className="block px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-sm hover:bg-white dark:hover:bg-neutral-800 no-underline"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.name}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  ) : null}

                  <motion.div className="flex flex-col gap-2 pt-2">
                    <p className="px-4 text-xs font-medium tracking-wide text-neutral-500 uppercase">
                      Log in
                    </p>
                    {loginLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white no-underline"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <ShinyCta
                      href="/onboarding/customer"
                      size="sm"
                      rounded="rounded-lg"
                      className="block px-5 py-2.5 text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      GET STARTED
                    </ShinyCta>
                  </motion.div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </nav>
  );
}

export default Navigation3;
