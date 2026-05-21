"use client";

import { useEffect, useState, type ReactNode } from "react";

import ShinyText from "@/components/react-bits/shiny-text";

const VARIANTS = {
  "on-dark": { color: "#a3a3a3", shineColor: "#ffffff" },
  accent: { color: "#6bbf8a", shineColor: "#e8fff4" },
  "accent-on-glass": { color: "#b8e0c8", shineColor: "#ffffff" },
  brand: { color: "#171717", shineColor: "#ffffff" },
  "brand-on-dark": { color: "#e5e5e5", shineColor: "#ffffff" },
} as const;

export type ShinyXeoVariant = keyof typeof VARIANTS;

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

export function ShinyXeo({
  variant = "on-dark",
  className,
  speed = 2.5,
}: {
  /** Use `brand-responsive` in footers/headers to avoid duplicate light+dark instances. */
  variant?: ShinyXeoVariant | "brand-responsive";
  className?: string;
  speed?: number;
}) {
  const prefersDark = usePrefersDark();
  const resolvedVariant: ShinyXeoVariant =
    variant === "brand-responsive"
      ? prefersDark
        ? "brand-on-dark"
        : "brand"
      : variant;

  const { color, shineColor } = VARIANTS[resolvedVariant];

  return (
    <ShinyText
      text="XEO"
      color={color}
      shineColor={shineColor}
      speed={speed}
      spread={120}
      direction="left"
      className={className}
    />
  );
}

/** Splits copy on "XEO" and wraps each occurrence with ShinyXeo. */
export function textWithShinyXeo(
  text: string,
  variant: ShinyXeoVariant = "on-dark",
) {
  if (!text.includes("XEO")) {
    return text;
  }

  const parts = text.split("XEO");

  return parts.flatMap((part, index) => {
    const nodes: ReactNode[] = [];
    if (part) nodes.push(part);
    if (index < parts.length - 1) {
      nodes.push(
        <ShinyXeo key={`xeo-${index}`} variant={variant} />,
      );
    }
    return nodes;
  });
}
