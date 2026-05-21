"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import {
  ShinyAccent,
  ShinyBadge,
  ShinyCta,
  ShinyDot,
  ShinyGlassSpan,
} from "@/components/brand/shiny-glass";
import { ShinyXeo } from "@/components/brand/shiny-xeo";
import {
  BOOST_PACKAGES,
  type BoostPackageId,
} from "@/components/onboarding/onboarding-data";
import { cn } from "@/lib/utils";

type CellValue = true | string | false;

type CompareRow = { label: string; values: [CellValue, CellValue, CellValue] };

/** Frosted panels on grain-wave backdrop — stronger blur + opacity for legibility */
const grainTableShell =
  "overflow-hidden rounded-2xl border border-white/15 bg-[#0a1018]/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-3xl backdrop-saturate-150";
const grainSectionShell =
  "overflow-hidden rounded-xl border border-white/12 bg-[#0c1218]/70 backdrop-blur-2xl backdrop-saturate-150";
const grainSectionHeader =
  "bg-[#0c1218]/50 px-4 backdrop-blur-xl sm:px-5";
const grainRowShell =
  "mx-2 mb-2 rounded-lg border border-white/10 bg-[#0e141c]/75 px-4 py-4 backdrop-blur-xl last:mb-3 sm:mx-3 sm:px-5";

const BOOST_COMPARE_SECTIONS: { title: string; rows: CompareRow[] }[] = [
  {
    title: "Automation & SEO",
    rows: [
      {
        label: "Lead funnel automation",
        values: [true, true, true],
      },
      { label: "Indexing", values: [true, true, true] },
      {
        label: "Lead funnel automation email / text",
        values: [false, true, true],
      },
    ],
  },
  {
    title: "Content & social",
    rows: [
      {
        label: "Blog posts per month (onsite)",
        values: ["1 post", "2 posts", "2 posts"],
      },
      {
        label: "Social media posts",
        values: [false, "4 posts · 1 account", "4–8 posts · 3 accounts"],
      },
      {
        label: "YouTube video per month",
        values: [false, false, true],
      },
    ],
  },
  {
    title: "Local growth",
    rows: [
      {
        label: "Directory submissions per month",
        values: [false, false, "10 submissions"],
      },
      { label: "Review chaser link", values: [false, false, true] },
      {
        label: "Titan site with yearly billing",
        values: [false, false, "Included free"],
      },
    ],
  },
];

function CompareCell({ v, onGrain }: { v: CellValue; onGrain?: boolean }) {
  if (v === false) {
    return (
      <span
        className={cn(
          "text-sm",
          onGrain ? "text-white/40" : "text-neutral-300 dark:text-neutral-600",
        )}
      >
        —
      </span>
    );
  }
  if (v === true) {
    return (
      <ShinyDot size="sm" className="shrink-0">
        <Check className="size-3" strokeWidth={3} />
      </ShinyDot>
    );
  }
  return (
    <p
      className={cn(
        "text-sm leading-relaxed",
        onGrain ? "text-[#d8f2e6] font-medium" : "text-neutral-700 dark:text-neutral-300",
      )}
    >
      {v}
    </p>
  );
}

function CompareSection({
  title,
  rows,
  tierNames,
  onGrain,
}: {
  title: string;
  rows: CompareRow[];
  tierNames: string[];
  onGrain?: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={cn(
        onGrain ? grainSectionShell : "border-t border-neutral-200 dark:border-neutral-800",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "grid w-full cursor-pointer grid-cols-1 items-center gap-2 py-5 md:grid-cols-4",
          onGrain && grainSectionHeader,
        )}
      >
        <span
          className={cn(
            "text-left text-lg font-semibold tracking-tight sm:text-xl",
            onGrain ? "text-white" : "text-neutral-900 dark:text-white",
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "flex justify-end pr-2 md:col-span-3",
            onGrain ? "text-white/70" : "text-neutral-500",
          )}
        >
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>
      {open
        ? rows.map((r) => (
            <div
              key={r.label}
              className={cn(
                "grid grid-cols-1 items-start gap-4 md:grid-cols-4 md:gap-6",
                onGrain
                  ? grainRowShell
                  : "border-t border-neutral-200 py-5 dark:border-neutral-800",
              )}
            >
              <p
                className={cn(
                  "text-sm font-medium",
                  onGrain ? "text-white" : "text-neutral-800 dark:text-neutral-200",
                )}
              >
                {r.label}
              </p>
              {r.values.map((v, i) => (
                <div key={tierNames[i]} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-24 shrink-0 text-xs tracking-wider uppercase md:hidden",
                      onGrain ? "text-[#a8d4e8]/90" : "text-neutral-500",
                    )}
                  >
                    {tierNames[i]}
                  </span>
                  <CompareCell v={v} onGrain={onGrain} />
                </div>
              ))}
            </div>
          ))
        : null}
    </div>
  );
}

export function BoostPricing8({
  href = "/onboarding/customer",
  onSelectTier,
  selectedTierId,
  onGrain = true,
  className,
}: {
  href?: string;
  onSelectTier?: (id: BoostPackageId) => void;
  selectedTierId?: BoostPackageId | null;
  onGrain?: boolean;
  className?: string;
}) {
  const tierNames = BOOST_PACKAGES.map((p) => p.name);
  const selectable = Boolean(onSelectTier);

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="md:col-span-1"
        >
          <h3
            className={cn(
              "text-3xl leading-[1.05] font-medium tracking-tight sm:text-4xl",
              onGrain ? "text-white" : "text-neutral-900 dark:text-white",
            )}
          >
            Compare
            <br />
            boost tiers
          </h3>
          <p
            className={cn(
              "mt-3 text-sm leading-relaxed",
              onGrain ? "text-[#a8d4e8]/80" : "text-neutral-500 dark:text-neutral-400",
            )}
          >
            Monthly add-ons stack on your website package. Pick one tier or skip at
            checkout.
          </p>
        </motion.div>

        {BOOST_PACKAGES.map((pkg, i) => {
          const selected = selectedTierId === pkg.id;
          const isTop = pkg.featured;

          const ctaLabel = selectable
            ? selected
              ? "Selected"
              : "Add this boost"
            : "Select website first";

          const ctaClass = cn(
            "flex w-full justify-center rounded-xl py-3 text-center text-sm font-medium",
            selected && "ring-2 ring-[#6ec4b8]/50",
          );

          const cta = selectable ? (
            <button
              type="button"
              onClick={() => onSelectTier?.(pkg.id)}
              className="w-full border-0 bg-transparent p-0"
            >
              <ShinyGlassSpan
                soft={!isTop || !selected}
                speed={3.2}
                className={ctaClass}
              >
                {ctaLabel}
              </ShinyGlassSpan>
            </button>
          ) : isTop ? (
            <ShinyCta href={href} className={cn("block w-full", ctaClass)}>
              {ctaLabel}
            </ShinyCta>
          ) : (
            <Link href={href} className="block w-full no-underline">
              <ShinyGlassSpan soft speed={3.2} className={ctaClass}>
                {ctaLabel}
              </ShinyGlassSpan>
            </Link>
          );

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border p-4 sm:p-5",
                onGrain
                  ? "border-white/15 bg-[#0c1218]/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl backdrop-saturate-150"
                  : "border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/50",
                isTop &&
                  onGrain &&
                  "border-[#6ec4b8]/35 bg-[#0c1218]/78",
                selected && "ring-2 ring-[#6ec4b8]/40",
              )}
            >
              {isTop ? (
                <ShinyBadge className="w-fit">
                  <ShinyXeo variant="accent-on-glass" speed={2} />
                </ShinyBadge>
              ) : (
                <span className="w-fit rounded-full border border-[#6ec4b8]/30 bg-[#6ec4b8]/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#a8d4e8] uppercase">
                  {pkg.subtitle}
                </span>
              )}
              <p
                className={cn(
                  "text-xl font-semibold",
                  onGrain ? "text-white" : "text-neutral-900 dark:text-white",
                )}
              >
                {pkg.name}
              </p>
              <div className="flex items-baseline gap-0.5">
                <ShinyAccent
                  className={cn(
                    "text-3xl font-semibold tracking-tight",
                    onGrain && "text-[#8fd4a8]",
                  )}
                >
                  {pkg.price}
                </ShinyAccent>
                <span
                  className={cn(
                    "text-base",
                    onGrain ? "text-white/50" : "text-neutral-500",
                  )}
                >
                  {pkg.priceSuffix}
                </span>
              </div>
              <p
                className={cn(
                  "min-h-[2.5rem] text-sm leading-snug",
                  onGrain ? "text-white/60" : "text-neutral-500 dark:text-neutral-400",
                )}
              >
                {pkg.notes}
              </p>
              {cta}
            </motion.div>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-8",
          onGrain && cn(grainTableShell, "space-y-3 p-3 sm:p-4"),
        )}
      >
        {BOOST_COMPARE_SECTIONS.map((section) => (
          <CompareSection
            key={section.title}
            title={section.title}
            rows={section.rows}
            tierNames={tierNames}
            onGrain={onGrain}
          />
        ))}
      </div>
    </div>
  );
}

export default BoostPricing8;
