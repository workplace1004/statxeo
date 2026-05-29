"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import ParallaxCards from "@/components/react-bits/parallax-cards";
import { BrowserPreviewFrame } from "@/components/brand/browser-preview-frame";
import { StructuredSvgBg } from "@/components/brand/structured-svg-bg";
import { cn } from "@/lib/utils";
import { clientShowcaseSites } from "@/lib/statxeo/client-showcase";

export function ClientsGalleryShowcase() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background pb-20 text-foreground sm:pb-24">
      <StructuredSvgBg className="opacity-90" primaryColor="16, 185, 129" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_82%_24%,rgba(56,189,248,0.12),transparent_24%),radial-gradient(circle_at_58%_72%,rgba(245,158,11,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/35 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-[1480px] flex-col px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <header className="neo-surface-soft flex flex-col gap-4 rounded-[1.75rem] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-white/55">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Public launch work
            </span>
            <Link href="/#intake" className="neo-button-shell neo-button-primary px-5 py-3 text-sm text-primary-foreground">
              Start intake
            </Link>
          </div>
        </header>

        <div className="mt-10 space-y-10 lg:space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="space-y-5"
          >
            <p className="text-sm font-mono uppercase tracking-[0.24em] text-primary">Client gallery</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.02]">
              Clients that allow us to share our work
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              A live gallery of public-facing client websites built by Statxeo. Quality sites that produce real results with leads straight to your Statxt or Phone.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.12, ease: "easeOut" }}
            className="hidden lg:block"
          >
            <div className="neo-inset relative overflow-hidden rounded-[2rem] p-4 xl:p-5">
              <div className="pointer-events-none absolute inset-x-10 top-6 h-28 rounded-full bg-primary/15 blur-[72px]" />
              <div className="relative h-[780px] overflow-hidden rounded-[1.6rem] border border-white/6 bg-black/20">
                <ParallaxCards
                  images={clientShowcaseSites.map((site) => site.href)}
                  renderCard={(index) => <BrowserPreviewFrame site={clientShowcaseSites[index]} className="h-full w-full" />}
                  getCardAriaLabel={(index) => `Focus preview for ${clientShowcaseSites[index].name}`}
                  cardClassName="border border-white/8 bg-transparent shadow-[0_35px_90px_rgba(0,0,0,0.42)]"
                  cardWidth={410}
                  cardHeight={560}
                  perspective={3200}
                  mouseSensitivity={3.4}
                  animationDuration={1.1}
                  enableDepthFog
                  fogIntensity={0.95}
                  enableMagneticAttraction
                  magneticStrength={42}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-mono uppercase tracking-[0.22em] text-white/42">Outbound links</p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/62 sm:text-base">
                  Open any client site directly in a new tab when you want the live experience without relying on iframe support.
                </p>
              </div>
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-white/38">
                {clientShowcaseSites.length} live public sites
              </span>
            </div>

            <div className="space-y-3">
              {clientShowcaseSites.map((client, index) => (
                <motion.a
                  key={client.domain}
                  href={client.href}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 * index, ease: "easeOut" }}
                  className={cn(
                    "group neo-surface-soft block rounded-[1.5rem] border px-5 py-5 transition-transform duration-200 hover:-translate-y-1",
                    client.accentBorderClass,
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]", client.accentChipClass)}>
                          {client.category}
                        </span>
                        <span className="text-xs font-mono uppercase tracking-[0.18em] text-white/40">0{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-white">{client.name}</p>
                        <p className="mt-1 text-sm font-mono text-white/45">{client.domain}</p>
                      </div>
                      <p className="max-w-xl text-sm leading-relaxed text-white/68">{client.summary}</p>
                    </div>
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-white/55 backdrop-blur-sm">
              Live iframe previews can depend on the target site allowing embedding in the browser. If a client site sends restrictive frame headers, the direct link still works.
            </div>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-5 lg:hidden">
          {clientShowcaseSites.map((client, index) => (
            <motion.article
              key={client.domain}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 * index, ease: "easeOut" }}
              className="neo-surface overflow-hidden rounded-[1.8rem]"
            >
              <BrowserPreviewFrame site={client} className="rounded-none border-0 shadow-none" />
              <div className="border-t border-white/10 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{client.name}</p>
                    <p className="mt-1 text-xs font-mono uppercase tracking-[0.18em] text-white/45">{client.domain}</p>
                  </div>
                  <a
                    href={client.href}
                    target="_blank"
                    rel="noreferrer"
                    className="neo-button-shell neo-button-secondary px-4 py-2 text-sm"
                  >
                    Open site
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
