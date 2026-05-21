"use client";

import Link from "next/link";
import {ArrowRight, Building2, Handshake} from "lucide-react";

import {Navigation3} from "@/components/blocks/navigation-3";

const PARTNER_PATHS = [
  {
    title: "White-label",
    description:
      "Sign in to your agency workspace — manage customers, branding, and fulfillment under your brand.",
    href: "/onboarding/white-label?mode=sign-in",
    icon: Building2,
  },
  {
    title: "Affiliate",
    description:
      "Sign in to track referrals, commissions, marketing assets, and payouts.",
    href: "/onboarding/affiliate?mode=sign-in",
    icon: Handshake,
  },
] as const;

export function PartnersSignInPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation3 variant="minimal" />
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-12 sm:py-16">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            Partner sign in
          </h1>
          <p className="text-muted text-sm sm:text-base">
            Choose how you partner with StatXEO. New here?{" "}
            <Link className="text-orange-600 no-underline hover:underline" href="/partners">
              Become a partner
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PARTNER_PATHS.map((path) => (
            <Link
              key={path.href}
              href={path.href}
              className="group flex flex-col gap-3 rounded-2xl border border-neutral-200 p-6 no-underline transition-all hover:border-orange-500/50 hover:shadow-md dark:border-neutral-800"
            >
              <path.icon className="size-8 text-orange-600" />
              <h2 className="text-foreground text-lg font-semibold">{path.title}</h2>
              <p className="text-muted flex-1 text-sm leading-relaxed">{path.description}</p>
              <span className="text-orange-600 inline-flex items-center gap-1 text-sm font-medium">
                Sign in
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
