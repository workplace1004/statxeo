"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { SHINY_GLASS } from "@/components/brand/shiny-glass-tokens";
import { cn } from "@/lib/utils";

const GrainWave = dynamic(
  () => import("@/components/react-bits/grain-wave"),
  { ssr: false },
);

/** Website packages — classic brand green on deep black */
export const WEBSITE_GRAIN_COLORS = {
  startColor: SHINY_GLASS.shineBright,
  endColor: SHINY_GLASS.shine,
  lightBackground: SHINY_GLASS.base,
  darkBackground: SHINY_GLASS.base,
} as const;

/** Boost packages — cooler teal + deeper slate to contrast website band */
export const BOOST_GRAIN_COLORS = {
  startColor: "#6ec4b8",
  endColor: "#2a5c6e",
  lightBackground: "#0c1218",
  darkBackground: "#0c1218",
} as const;

export type PricingGrainVariant = "website" | "boost";

const VARIANT_STYLES: Record<
  PricingGrainVariant,
  { border: string; headingAccent: string }
> = {
  website: {
    border: "border-[#3d6b55]/25",
    headingAccent: "text-[#b8e0c8]/90",
  },
  boost: {
    border: "border-[#4a7c8c]/30",
    headingAccent: "text-[#a8d4e8]/90",
  },
};

export function PricingGrainSection({
  children,
  className,
  innerClassName,
  variant = "website",
  stackPosition = "single",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  variant?: PricingGrainVariant;
  /** Stack website + boost bands with no gap */
  stackPosition?: "top" | "bottom" | "single";
}) {
  const colors =
    variant === "boost" ? BOOST_GRAIN_COLORS : WEBSITE_GRAIN_COLORS;
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden",
        styles.border,
        stackPosition === "top" &&
          "rounded-t-2xl border-x border-t sm:rounded-t-3xl",
        stackPosition === "bottom" &&
          "rounded-b-2xl border-x border-b sm:rounded-b-3xl",
        stackPosition === "single" &&
          "rounded-2xl border sm:rounded-3xl",
        stackPosition === "top" && "border-b-0",
        stackPosition === "bottom" && "border-t-0",
        className,
      )}
    >
      <GrainWave
        className="pointer-events-none absolute inset-0 z-0 h-full min-h-full w-full"
        speed={variant === "boost" ? 0.38 : 0.32}
        waveCount={variant === "boost" ? 20 : 22}
        waveAmplitude={0.75}
        waveFrequency={variant === "boost" ? 3.2 : 3.5}
        lineThickness={0.18}
        grainIntensity={42}
        brightness={variant === "boost" ? 0.95 : 0.9}
        speedVariation={0.005}
        waveWidth={3.2}
        scale={0.65}
        {...colors}
      />
      {stackPosition === "bottom" ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-[#6ec4b8]/40 to-transparent"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function PricingGrainHeading({
  title,
  description,
  className,
  variant = "website",
}: {
  title: string;
  description?: string;
  className?: string;
  variant?: PricingGrainVariant;
}) {
  const accent = VARIANT_STYLES[variant].headingAccent;

  return (
    <div className={cn("mb-10 space-y-3 text-center", className)}>
      <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className={cn("mx-auto max-w-2xl text-base", accent)}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Full-bleed wrapper for stacked website + boost grain bands */
export function PricingGrainStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-screen max-w-none shadow-[0_24px_80px_-24px_rgba(10,18,14,0.5)]",
        "left-1/2 -translate-x-1/2",
        className,
      )}
    >
      {children}
    </div>
  );
}
