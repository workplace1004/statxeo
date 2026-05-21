"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "motion/react";

import {
  ShinyAccent,
  ShinyBadge,
  ShinyCta,
  ShinyDot,
  ShinyGlassSpan,
} from "@/components/brand/shiny-glass";
import { ShinyXeo } from "@/components/brand/shiny-xeo";
import type { BOOST_PACKAGES } from "@/components/onboarding/onboarding-data";
import {
  PricingCardGlow,
  type PricingCardGlowVariant,
  PricingCardSurface,
} from "@/components/pricing/pricing-card-glow";
import { cn } from "@/lib/utils";

type BoostPackage = (typeof BOOST_PACKAGES)[number];

function tierFromId(id: BoostPackage["id"]): 1 | 2 | 3 {
  if (id === "mach-2") return 2;
  if (id === "mach-3") return 3;
  return 1;
}

function glowVariant(
  tier: 1 | 2 | 3,
  selected?: boolean,
): PricingCardGlowVariant {
  if (selected) return "selected";
  if (tier === 3) return "featured";
  if (tier === 2) return "accent";
  return "default";
}

function BoostCardContent({
  pkg,
  tier,
  href,
  onSelect,
  selected,
  onGrain,
}: {
  pkg: BoostPackage;
  tier: 1 | 2 | 3;
  href: string;
  onSelect?: () => void;
  selected?: boolean;
  onGrain?: boolean;
}) {
  const isTop = tier === 3;
  const ctaLabel = onSelect ? (selected ? "Selected" : "Add this boost") : "Select website first";

  return (
    <PricingCardSurface
      tier={tier}
      featured={isTop}
      onGrain={onGrain}
      className={cn(
        onSelect ? "p-5" : undefined,
        selected && "ring-2 ring-[#3d6b55]/40 ring-inset",
      )}
    >
      {selected && onSelect ? (
        <ShinyDot size="sm" className="absolute top-5 right-5 z-10">
          <Check className="size-3.5" strokeWidth={3} />
        </ShinyDot>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {isTop ? (
          <ShinyBadge className="w-fit">
            <ShinyXeo variant="accent-on-glass" speed={2} />
          </ShinyBadge>
        ) : (
          <span className="rounded-full border border-[#3d6b55]/25 bg-[#3d6b55]/[0.08] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#2d5a42] uppercase dark:border-[#5a9b75]/30 dark:bg-[#5a9b75]/10 dark:text-[#8fd4a8]">
            {pkg.subtitle}
          </span>
        )}
      </div>

      <h3 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        {pkg.name}
      </h3>

      <div className="mt-3 mb-1 flex items-baseline gap-0.5">
        <ShinyAccent
          className={cn(
            "font-semibold tracking-tight",
            onSelect ? "text-2xl" : "text-4xl",
          )}
        >
          {pkg.price}
        </ShinyAccent>
        <span
          className={cn(
            "text-neutral-500 dark:text-neutral-400",
            onSelect ? "text-base font-normal" : "text-base",
          )}
        >
          {pkg.priceSuffix}
        </span>
      </div>

      <p
        className={cn(
          "text-sm leading-relaxed text-neutral-600 dark:text-neutral-400",
          onSelect ? "mt-2 mb-4" : "mb-6",
        )}
      >
        {pkg.notes}
      </p>

      <ul
        className={cn(
          "flex flex-col",
          onSelect ? "gap-2" : "mb-8 flex-1 gap-3",
        )}
      >
        {pkg.highlights.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-400"
          >
            <ShinyDot size="sm" className="mt-0.5 shrink-0">
              <Check className="size-3" strokeWidth={3} />
            </ShinyDot>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {onSelect ? (
        <span
          className={cn(
            "mt-auto block w-full rounded-xl py-3 text-center text-sm font-medium",
            selected
              ? "border border-[#3d6b55]/30 bg-[#3d6b55]/10 text-[#1e4a32] dark:text-[#8fd4a8]"
              : "border border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white",
          )}
        >
          {ctaLabel}
        </span>
      ) : isTop ? (
        <ShinyCta href={href} className="block w-full py-3.5 text-center text-sm">
          {ctaLabel}
        </ShinyCta>
      ) : (
        <Link href={href} className="mt-auto block w-full no-underline">
          <ShinyGlassSpan
            soft
            speed={3.2}
            className="flex w-full justify-center rounded-xl px-4 py-3.5 text-sm font-medium"
          >
            {ctaLabel}
          </ShinyGlassSpan>
        </Link>
      )}
    </PricingCardSurface>
  );
}

export function BoostPricingCard({
  pkg,
  href = "/onboarding/customer",
  onSelect,
  selected,
  onGrain = false,
  className,
}: {
  pkg: BoostPackage;
  href?: string;
  onSelect?: () => void;
  selected?: boolean;
  onGrain?: boolean;
  className?: string;
}) {
  const tier = tierFromId(pkg.id);
  const isTop = tier === 3;
  const variant = glowVariant(tier, selected);

  const inner = (
    <BoostCardContent
      pkg={pkg}
      tier={tier}
      href={href}
      onSelect={onSelect}
      selected={selected}
      onGrain={onGrain}
    />
  );

  return (
    <motion.div
      className={cn(
        "relative flex h-full flex-col",
        isTop && "lg:z-10 lg:scale-[1.03]",
        className,
      )}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <PricingCardGlow
        variant={variant}
        animated={isTop && !selected}
        onGrain={onGrain}
        className="h-full w-full"
      >
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className="h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left"
          >
            {inner}
          </button>
        ) : (
          inner
        )}
      </PricingCardGlow>
    </motion.div>
  );
}
