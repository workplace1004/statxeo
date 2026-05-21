"use client";

import { useEffect, useState, type ReactNode } from "react";

import BorderGlow from "@/components/react-bits/border-glow";
import { cn } from "@/lib/utils";

const GLASS_GRADIENT = ["#2d5a42", "#3d6b55", "#5a9b75"];
const NEUTRAL_GRADIENT = ["#d4d4d4", "#a3a3a3", "#737373"];
const SELECTED_GRADIENT = ["#3d6b55", "#5a9b75", "#8fd4a8"];

export type PricingCardGlowVariant =
  | "default"
  | "accent"
  | "featured"
  | "selected";

function usePrefersDark() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const onChange = () => setDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return dark;
}

export function PricingCardGlow({
  children,
  className,
  variant = "default",
  animated = false,
  borderRadius = 20,
  onGrain = false,
}: {
  children: ReactNode;
  className?: string;
  variant?: PricingCardGlowVariant;
  animated?: boolean;
  borderRadius?: number;
  onGrain?: boolean;
}) {
  const prefersDark = usePrefersDark();
  const isFeatured = variant === "featured";
  const isAccent = variant === "accent";
  const isSelected = variant === "selected";
  const isGreen = isSelected || isFeatured || isAccent;

  const colors = isSelected
    ? SELECTED_GRADIENT
    : isFeatured || isAccent
      ? GLASS_GRADIENT
      : NEUTRAL_GRADIENT;

  const glowColor = isGreen ? "145 35 42" : "0 0 50";
  const glowIntensity = isSelected
    ? 1.35
    : isFeatured
      ? 1.15
      : isAccent
        ? 1.02
        : 0.9;
  const glowRadius = isFeatured || isSelected ? 40 : isAccent ? 36 : 32;
  const fillOpacity = isSelected
    ? 0.45
    : isFeatured
      ? 0.45
      : isAccent
        ? 0.36
        : 0.28;

  return (
    <BorderGlow
      className={cn("h-full w-full", className)}
      lightSurface
      backgroundColor={
        onGrain
          ? prefersDark
            ? "rgba(10, 18, 14, 0.92)"
            : "rgba(255, 255, 255, 0.95)"
          : prefersDark
            ? "#171717"
            : "#ffffff"
      }
      borderRadius={borderRadius}
      colors={colors}
      glowColor={glowColor}
      glowIntensity={glowIntensity}
      glowRadius={glowRadius}
      edgeSensitivity={30}
      coneSpread={25}
      fillOpacity={fillOpacity}
      animated={animated && (isFeatured || isSelected)}
    >
      {children}
    </BorderGlow>
  );
}

/** Inner surface for pricing cards — pairs with PricingCardGlow. */
export function PricingCardSurface({
  children,
  className,
  featured,
  tier,
  onGrain,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
  /** Boost tier 1–3 — adds watermark, accent bar, corner glow */
  tier?: 1 | 2 | 3;
  /** Frosted card on dark grain-wave backdrop */
  onGrain?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-full w-full flex-col overflow-hidden rounded-[inherit] p-6",
        onGrain
          ? "border border-white/10 bg-white/95 shadow-lg shadow-black/20 backdrop-blur-xl dark:bg-neutral-950/92"
          : "bg-white dark:bg-neutral-900",
        featured && "lg:py-8 lg:shadow-xl",
        className,
      )}
    >
      {tier ? (
        <>
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1",
              tier === 3 &&
                "bg-gradient-to-r from-[#2d5a42] via-[#5a9b75] to-[#2d5a42]",
              tier === 2 &&
                "bg-gradient-to-r from-transparent via-[#3d6b55]/70 to-transparent",
              tier === 1 &&
                "bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-600",
            )}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute -top-1 -right-1 select-none font-bold leading-none text-neutral-200/90 dark:text-white/[0.05]"
            style={{ fontSize: "5.5rem" }}
            aria-hidden
          >
            {tier}
          </span>
          {tier >= 2 ? (
            <div
              className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-[#3d6b55]/[0.07] blur-3xl dark:bg-[#5a9b75]/10"
              aria-hidden
            />
          ) : null}
        </>
      ) : null}
      <div className="relative z-[1] flex min-h-full flex-col">{children}</div>
    </div>
  );
}
