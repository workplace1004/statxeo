"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  Home,
  LayoutDashboard,
  Link2,
  LogIn,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react"

import Footer1 from "@/components/blocks/footer-1"
import { BlurHighlight } from "@/components/react-bits/blur-highlight"
import DepthCard from "@/components/react-bits/depth-card"
import DotShift from "@/components/react-bits/dot-shift"
import NeonReveal from "@/components/react-bits/neon-reveal"
import ShaderCard from "@/components/react-bits/shader-card"
import StaggeredText from "@/components/react-bits/staggered-text"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const commissionLanes = [
  {
    tier: "Lander",
    rate: "10%",
    note: "Starter website lane for traffic that needs trust before price comparison.",
  },
  {
    tier: "Core",
    rate: "15%",
    note: "Mid-tier offer for leads that already know they need a better site now.",
  },
  {
    tier: "Titan",
    rate: "20%",
    note: "Premium lane for the operator who wants speed, positioning, and margin in one move.",
  },
  {
    tier: "Boost",
    rate: "10%",
    note: "Growth-service lane when the client wants traffic and conversion help beyond the build.",
  },
]

const funnelSteps = [
  {
    title: "Match the promise before the click",
    body: "If the post sells speed, the landing page should sell speed. Tight message match beats broad reach every time.",
    cta: "Review the playbook",
    href: "/affiliate/help",
    icon: MousePointerClick,
    glow: "from-sky-500/70 via-cyan-400/35 to-transparent",
  },
  {
    title: "Route traffic through one clean referral lane",
    body: "Use evergreen links for always-on assets and one-time links when you want campaign signal without noise.",
    cta: "Open the portal",
    href: "/affiliate/portal",
    icon: Link2,
    glow: "from-emerald-500/70 via-cyan-300/35 to-transparent",
  },
  {
    title: "Read the ledger like a closer",
    body: "Pending is signal, approved is near-cash, paid is closed history. Read the board like an operator, not a spectator.",
    cta: "Sign in",
    href: "/affiliate/login",
    icon: Wallet,
    glow: "from-orange-500/75 via-amber-300/30 to-transparent",
  },
]

const portalTracks = [
  {
    title: "Overview",
    body: "See your current rates, attribution window, totals, and which traffic patterns are actually closing.",
    icon: LayoutDashboard,
  },
  {
    title: "Links",
    body: "Create evergreen or one-time links so each content push has a deliberate path and a traceable outcome.",
    icon: Link2,
  },
  {
    title: "Ledger",
    body: "Audit commission state changes without guessing whether the sale is maturing, approved, or already paid.",
    icon: BadgeDollarSign,
  },
  {
    title: "Payouts",
    body: "Track payout batches by period so finance questions stay anchored to an export-ready history.",
    icon: ShieldCheck,
  },
]

const trustPoints = [
  "10% to 20% default website commission lanes",
  "30-day attribution window by default",
  "Portal built for links, ledger, and payout clarity",
]

const campaignBoard = [
  {
    label: "Traffic promise",
    value: "SEO websites that close before you call back",
    note: "A specific hook beats generic web-design language.",
  },
  {
    label: "Referral lane",
    value: "Evergreen link for always-on posts",
    note: "One clean lane compounds faster than six random URLs.",
  },
  {
    label: "Decision signal",
    value: "Ledger review every week",
    note: "Optimization happens where state changes get noticed.",
  },
]

const hookAngles = [
  "Speed: get a live SEO site without a long agency timeline.",
  "Clarity: show operators a site that sells, routes, and texts instantly.",
  "Control: send each audience to the exact page that matches the promise.",
]

export function AffiliateProgramSection() {
  return (
    <>
      <main className="min-h-screen bg-[#f7fbff] text-slate-950">
        <section className="relative overflow-hidden px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 10% 12%, rgba(14,165,233,0.20), transparent 26%), radial-gradient(circle at 88% 18%, rgba(249,115,22,0.15), transparent 24%), radial-gradient(circle at 76% 70%, rgba(16,185,129,0.10), transparent 24%), linear-gradient(180deg, #f7fbff 0%, #eff8ff 42%, #ffffff 100%)",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-72 opacity-45">
            <DotShift className="h-full w-full" color="#0ea5e9" speed={0.42} scale={0.64} size={0.54} blur={0.45} />
          </div>

          <div className="relative mx-auto max-w-6xl">
            <div className="pointer-events-none absolute -left-20 top-24 hidden h-44 w-44 rounded-full bg-sky-300/20 blur-3xl lg:block" />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-8 top-40 hidden h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl lg:block"
              animate={{ y: [0, -18, 0], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-sky-200/80 bg-white/80 px-4 py-3 shadow-[0_20px_60px_rgba(14,165,233,0.08)] backdrop-blur-md">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
              >
                <Home className="h-4 w-4" />
                Statxeo home
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/affiliate/help"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-sky-300 hover:text-slate-950"
                >
                  <BookOpen className="h-4 w-4" />
                  Playbook
                </Link>
                <Link
                  href="/affiliate/login"
                  className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 transition-colors hover:bg-sky-100"
                >
                  <LogIn className="h-4 w-4" />
                  Partner login
                </Link>
                <Link
                  href="/affiliate/portal"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Open portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-10 pb-8 pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                <div className="mb-6 flex flex-wrap gap-3">
                  <Badge className="rounded-full border border-sky-300/70 bg-white/85 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-sky-900 shadow-sm">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    Affiliate closer funnel
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-orange-200 bg-orange-50/80 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-orange-700">
                    Click-funnel logic with operator math
                  </Badge>
                </div>

                <StaggeredText
                  text="Turn attention into tracked deals without sounding like a weak affiliate pitch"
                  as="h1"
                  segmentBy="words"
                  delay={48}
                  duration={0.52}
                  direction="bottom"
                  blur
                  className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl"
                />

                <BlurHighlight
                  highlightedBits={[
                    "message match",
                    "clean referral lanes",
                    "predictable commission states",
                  ]}
                  highlightColor="rgba(14,165,233,0.22)"
                  blurAmount={7}
                  className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg"
                >
                  Good affiliates do not spray links and hope. They control message match, clean referral lanes, and predictable commission states so each piece of traffic has a job and every payout trend has context.
                </BlurHighlight>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {trustPoints.map((point, index) => (
                    <motion.div
                      key={point}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.35, delay: index * 0.06 }}
                      whileHover={{ y: -4, scale: 1.015 }}
                      className="rounded-3xl border border-white/80 bg-white/82 p-4 shadow-[0_18px_50px_rgba(12,74,110,0.06)] backdrop-blur-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <p className="text-sm leading-6 text-slate-700">{point}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-5 lg:items-end">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                >
                  <ShaderCard
                    width={360}
                    height={420}
                    color="#38bdf8"
                    color1="#22d3ee"
                    color2="#6366f1"
                    speed={0.85}
                    scale={2.5}
                    effectRadius={0.88}
                    effectBoost={0.9}
                    branchIntensity={0.9}
                    className="w-full max-w-full overflow-hidden rounded-[30px] border border-slate-900/10 bg-slate-950/90"
                  >
                  <div className="flex h-full flex-col justify-between p-7 text-white">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/60">Default commission lanes</p>
                      <h2 className="mt-4 max-w-xs text-3xl font-semibold tracking-tight">
                        Clicks are cheap. Clean intent is not.
                      </h2>
                    </div>

                    <div className="space-y-3">
                      {commissionLanes.map((lane) => (
                        <div key={lane.tier} className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-md">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{lane.tier}</p>
                            <p className="text-lg font-semibold text-sky-200">{lane.rate}</p>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/68">{lane.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  </ShaderCard>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative w-full max-w-[360px] overflow-hidden rounded-[28px] border border-slate-900/10 bg-white/80 p-5 shadow-[0_18px_50px_rgba(12,74,110,0.06)] backdrop-blur-md"
                >
                  <div className="absolute inset-x-0 top-0 h-20 opacity-90">
                    <NeonReveal
                      className="h-full w-full"
                      animateOnScroll
                      revealDuration={2200}
                      revealDelay={50}
                      verticalOffset={0.3}
                      barWidth={0.86}
                      mirrored={false}
                      color={196}
                      glowSpread={0.56}
                      intensity={2.1}
                    />
                  </div>
                  <div className="relative z-10 pt-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-sky-700">Why this lane works</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      The fastest affiliate growth usually comes from one promise, one destination path, and one weekly review rhythm inside the portal.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof numbers banner */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-px overflow-hidden rounded-[28px] border border-sky-200/70 bg-sky-200/30 sm:grid-cols-4">
              {[
                { value: "10–20%", label: "Commission range" },
                { value: "30 days", label: "Attribution window" },
                { value: "4 tabs", label: "Full portal visibility" },
                { value: "Weekly", label: "Recommended review cadence" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35 }}
                  className="bg-white/90 px-6 py-8 text-center backdrop-blur-sm"
                >
                  <p className="text-3xl font-bold tracking-tight text-slate-950">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />
        </div>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <Card className="overflow-hidden rounded-[32px] border-slate-200 bg-slate-950 text-white shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
              <CardHeader className="relative pb-5">
                <div className="absolute inset-x-0 top-0 h-20 opacity-70">
                  <NeonReveal
                    className="h-full w-full"
                    animateOnScroll
                    revealDuration={2300}
                    revealDelay={60}
                    verticalOffset={0.34}
                    barWidth={0.84}
                    mirrored
                    color={190}
                    glowSpread={0.58}
                    intensity={2.2}
                  />
                </div>
                <Badge className="relative z-10 w-fit rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white">
                  Live mockup
                </Badge>
                <CardTitle className="relative z-10 pt-3 text-3xl font-semibold tracking-tight">
                  What a winning affiliate campaign actually looks like
                </CardTitle>
                <CardDescription className="relative z-10 max-w-xl text-base leading-7 text-white/70">
                  Not more links. Not more noise. Just a specific promise, one reliable lane, and weekly ledger checks that tell you what deserves more traffic.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4 pb-8">
                {campaignBoard.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/12 bg-white/7 p-5 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/45">{item.label}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                        <p className="mt-2 text-sm leading-7 text-white/68">{item.note}</p>
                      </div>
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                        <Target className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Promise match", "91%"],
                    ["Link discipline", "03 lanes"],
                    ["Review cadence", "Weekly"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/12 bg-white/6 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-orange-100 bg-white/92 shadow-[0_24px_80px_rgba(249,115,22,0.08)]">
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full border-orange-200 bg-orange-50 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-orange-800">
                  Hook lab
                </Badge>
                <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                  Three angles that usually beat bland affiliate copy
                </CardTitle>
                <CardDescription className="max-w-xl text-base leading-7 text-slate-600">
                  The goal is not to sound clever. The goal is to make the destination feel inevitable before the click happens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hookAngles.map((angle, index) => (
                  <motion.div
                    key={angle}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="rounded-3xl border border-slate-200 bg-slate-50/85 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                        <span className="text-sm font-semibold">0{index + 1}</span>
                      </div>
                      <p className="text-sm leading-7 text-slate-700">{angle}</p>
                    </div>
                  </motion.div>
                ))}

                <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-sky-800">Simple rule</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    If the content promise and destination page do not feel like the same conversation, fix that before you ask for more traffic.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />
        </div>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-sky-100 bg-white/88 p-6 shadow-[0_24px_80px_rgba(12,74,110,0.06)] backdrop-blur-md sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-sky-800">
                  Tutorial sequence
                </Badge>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  The three-stage funnel every serious affiliate eventually learns
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-7 text-slate-600">
                Think in order. A weak promise burns the click. A messy lane muddies attribution. An ignored ledger delays every useful optimization decision.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {funnelSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  <DepthCard
                    href={step.href}
                    width="100%"
                    height={360}
                    borderRadius="28px"
                    disableOnMobile
                    spotlightColor="rgba(255,255,255,0.35)"
                    className="shadow-[0_22px_70px_rgba(12,74,110,0.10)]"
                    backgroundContent={
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.glow}`}>
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(240,249,255,0.80)_100%)]" />
                      </div>
                    }
                    contentClassName="flex h-full flex-col justify-between p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-sky-300/20">
                          <step.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Step 0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-6 max-w-xs text-2xl font-semibold tracking-tight text-slate-950">
                        {step.title}
                      </h3>
                      <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">{step.body}</p>
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950">
                      <span>{step.cta}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </DepthCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <Card className="overflow-hidden rounded-[32px] border-slate-200 bg-slate-950 text-white shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
              <CardHeader className="relative pb-5">
                <div className="absolute inset-x-0 top-0 h-20 opacity-70">
                  <NeonReveal
                    className="h-full w-full"
                    animateOnScroll
                    revealDuration={2400}
                    revealDelay={70}
                    verticalOffset={0.36}
                    barWidth={0.8}
                    mirrored
                    color={195}
                    glowSpread={0.6}
                    intensity={2.4}
                  />
                </div>
                <Badge className="relative z-10 w-fit rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white">
                  Portal anatomy
                </Badge>
                <CardTitle className="relative z-10 pt-3 text-3xl font-semibold tracking-tight">
                  Learn the four surfaces that actually change partner behavior
                </CardTitle>
                <CardDescription className="relative z-10 max-w-xl text-base leading-7 text-white/70">
                  The portal is there to answer four questions fast: what is closing, which link caused it, what matured, and what already hit a payout batch.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4 pb-8">
                {portalTracks.map((track) => (
                  <div key={track.title} className="rounded-3xl border border-white/12 bg-white/7 p-5 backdrop-blur-md">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                        <track.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{track.title}</p>
                        <p className="mt-2 text-sm leading-7 text-white/68">{track.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-[32px] border-slate-200 bg-white/88 shadow-[0_20px_70px_rgba(12,74,110,0.06)]">
                <CardHeader>
                  <Badge variant="outline" className="w-fit rounded-full border-sky-200 bg-sky-50 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-sky-800">
                    Clean rules
                  </Badge>
                  <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                    The trust rules that keep affiliate lanes healthy
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {[
                    "Represent the offer clearly before you ask for the click.",
                    "Send traffic to the page that best matches the message.",
                    "Review the ledger weekly instead of reacting only when payouts arrive.",
                  ].map((rule) => (
                    <div key={rule} className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm leading-7 text-slate-700">
                      {rule}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-slate-200 bg-white/88 shadow-[0_20px_70px_rgba(12,74,110,0.06)]">
                <CardHeader>
                  <Badge variant="outline" className="w-fit rounded-full border-orange-200 bg-orange-50 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-orange-800">
                    Next move
                  </Badge>
                  <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                    Start with one lane you can defend, then scale what proves itself
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm leading-7 text-slate-600">
                    One evergreen link, one strong hook, one weekly review rhythm. That is enough to get clean signal before you earn the right to add complexity.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/affiliate/help"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                    >
                      Read the playbook
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/affiliate/login"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-sky-300 hover:text-slate-950"
                    >
                      Sign in to affiliate portal
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer1 />
    </>
  )
}