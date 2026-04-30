"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Clock, CreditCard, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { StructuredSvgBg } from "@/components/ui/structured-svg-bg";
import { clientShowcaseSites } from "@/lib/statxeo/client-showcase";
import { cn } from "@/lib/utils";

const heroBadges = [
  { icon: Clock, label: "24h", sub: "Avg. first draft" },
  { icon: CreditCard, label: "1x", sub: "One-time payment" },
  { icon: ShieldCheck, label: "10DLC", sub: "Compliance-ready" },
];

/* ── Fan geometry (5 visible slots) ── */
const FAN = [
  { x: -480, ry: 48, z: -220 },
  { x: -240, ry: 24, z: -70 },
  { x: 0, ry: 0, z: 0 },
  { x: 240, ry: -24, z: -70 },
  { x: 480, ry: -48, z: -220 },
];

const ENTRY = { x: 620, ry: -56, z: -320 };
const EXIT  = { x: -620, ry: 56, z: -320 };

const CARD_W = 250;
const CARD_H = 330;
const ROTATION_INTERVAL_MS = 3800;
const ROTATION_TRANSITION_MS = 750;

const EASE = [0.4, 0, 0.2, 1] as const;

/* ── Tiny browser chrome bar ── */
function BrowserBar({ domain, label }: { domain: string; label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-rose-400/70" />
        <span className="h-2 w-2 rounded-full bg-amber-300/70" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
      </div>
      <div className="flex-1 truncate rounded-full border border-white/8 bg-black/30 px-2.5 py-0.5 font-mono text-[9px] text-white/50">
        {domain}
      </div>
      <span className="text-[8px] font-mono uppercase tracking-widest text-white/30">{label}</span>
    </div>
  );
}

export function Hero7() {
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPaused(mq.matches);
    const handler = () => setPaused(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIsRotating(true);
      setOffset((prev) => (prev + 1) % clientShowcaseSites.length);
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (!isRotating) return;
    const id = window.setTimeout(() => setIsRotating(false), ROTATION_TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [isRotating]);

  const cards = Array.from({ length: 5 }, (_, i) =>
    clientShowcaseSites[(offset + i) % clientShowcaseSites.length],
  );

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
      <StructuredSvgBg className="opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_82%_16%,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_50%_68%,rgba(245,158,11,0.1),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.32),rgba(2,6,23,0.06)_26%,rgba(2,6,23,0.42)_100%)]" />

      <div className="relative mx-auto max-w-[1460px]">
        {/* ── Text block ── */}
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {heroBadges.map((b) => (
              <div key={b.label} className="neo-surface-soft flex items-center gap-2 rounded-full px-4 py-2">
                <b.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{b.label}</span>
                <span className="hidden text-sm text-muted-foreground sm:inline">{b.sub}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-8 space-y-5"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-white/55">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Before-and-after website launches
            </div>

            <h1 className="text-4xl font-semibold leading-[0.98] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.7rem]">
              Turn the old site people ignore
              <span className="block text-white/72">into the version that closes</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-6 max-w-3xl text-lg leading-relaxed text-white/72 sm:text-xl"
          >
            We rebuild outdated service-business websites into premium SEO launches with 10DLC-ready messaging,
            faster lead routing through Statxt, and real before-and-after proof from public client sites.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a href="#pricing" className="neo-button-shell neo-button-primary w-full px-8 py-4 text-base sm:w-auto">
              See website packages
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
            <a href="#intake" className="neo-button-shell neo-button-secondary w-full px-8 py-4 text-base sm:w-auto">
              Start intake form
            </a>
            <Link href="/gallery" className="neo-button-shell neo-button-secondary w-full px-8 py-4 text-base sm:w-auto">
              View live gallery
            </Link>
          </motion.div>
        </div>

        {/* ── Desktop: perspective-fan carousel ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.22 }}
          className="relative mx-auto mt-20 hidden h-[380px] lg:block"
          style={{ perspective: "1200px" }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {cards.map((site, slot) => {
              const pos = FAN[slot];
              const isBefore = slot <= 1;
              const isCenter = slot === 2;

              return (
                <motion.figure
                  key={site.slug}
                  className="absolute left-1/2 top-1/2 flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07090f] shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
                  initial={{ x: ENTRY.x, rotateY: ENTRY.ry, z: ENTRY.z, opacity: 0 }}
                  animate={{
                    x: pos.x,
                    rotateY: pos.ry,
                    z: pos.z,
                    opacity: 1,
                    filter: isBefore ? "grayscale(1) brightness(0.6)" : "none",
                  }}
                  exit={{ x: EXIT.x, rotateY: EXIT.ry, z: EXIT.z, opacity: 0 }}
                  transition={{ duration: 0.75, ease: EASE }}
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    marginLeft: -(CARD_W / 2),
                    marginTop: -(CARD_H / 2),
                    transformStyle: "preserve-3d",
                  }}
                >
                  <BrowserBar domain={site.domain} label={isBefore ? "Before" : "After"} />

                  <div className="relative flex-1 overflow-hidden">
                    {/* Old-site screenshot — always present as base layer */}
                    <Image
                      src={site.oldSiteImageSrc}
                      alt={`${site.name} — ${isBefore ? "before" : "after"}`}
                      fill
                      sizes="250px"
                      className="object-cover object-top"
                      priority={isCenter}
                    />

                    {/* Center card: live iframe overlay */}
                    {isCenter && (
                      site.previewMode === "external-only" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2),transparent_34%),linear-gradient(180deg,rgba(4,8,15,0.74),rgba(3,6,12,0.92))] p-5 text-center">
                          <div className="rounded-[1.35rem] border border-white/12 bg-black/40 p-4 backdrop-blur-md">
                            <p className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/45">External preview</p>
                            <p className="mt-3 text-sm font-semibold text-white/92">{site.name}</p>
                            <p className="mt-2 text-[11px] leading-5 text-white/62">
                              {site.previewFallbackLabel ?? "This live site blocks embedded previews."}
                            </p>
                            <a
                              href={site.href}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white/[0.12]"
                            >
                              Open live site
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <iframe
                          src={site.href}
                          title={`${site.name} live preview`}
                          loading="eager"
                          referrerPolicy="strict-origin-when-cross-origin"
                          className="pointer-events-none absolute left-0 top-0 border-0"
                          style={{
                            width: `${100 / 0.19}%`,
                            height: `${100 / 0.19}%`,
                            transform: "scale(0.19)",
                            transformOrigin: "top left",
                          }}
                        />
                      )
                    )}

                    {/* Right-side non-center: accent glow + live badge */}
                    {!isBefore && !isCenter && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div
                          className={cn(
                            "pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent opacity-50",
                            site.accentGlowClass,
                          )}
                        />
                        <div className="relative z-10 text-center">
                          <p className="text-sm font-semibold text-white/90">{site.name}</p>
                          <p className="mt-1 font-mono text-[10px] text-white/45">{site.domain}</p>
                          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-medium text-white/60">
                            <ExternalLink className="h-3 w-3" />
                            Live
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                </motion.figure>
              );
            })}
          </AnimatePresence>

          {/* Glowing neon divider — sits between slots 1 and 2 */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 z-10"
            style={{ left: `calc(50% - ${120}px)` }}
            animate={{ opacity: isRotating ? 0.18 : 1, scaleY: isRotating ? 0.92 : 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="h-full w-px bg-gradient-to-b from-transparent via-fuchsia-400 to-transparent" />
            <div className="absolute inset-y-0 -left-2 w-4 bg-gradient-to-b from-transparent via-fuchsia-500/40 to-transparent blur-lg" />
          </motion.div>
        </motion.div>

        {/* ── Mobile: horizontal scroll ── */}
        <div className="relative mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:hidden">
          {clientShowcaseSites.map((site, i) => (
            <figure
              key={site.slug}
              className="relative w-[220px] flex-shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10 bg-[#07090f]"
            >
              <BrowserBar domain={site.domain} label={i < 3 ? "Before" : "After"} />
              <div className="relative aspect-[3/4]">
                <Image
                  src={site.oldSiteImageSrc}
                  alt={site.name}
                  fill
                  sizes="220px"
                  className="object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
                  <p className="text-sm font-medium text-white">{site.name}</p>
                  <p className="text-xs text-white/60">{site.domain}</p>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
