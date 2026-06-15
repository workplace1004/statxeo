"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import {
  ArrowRight,
  House,
  Display,
  CreditCard,
  Persons,
  ShieldCheck,
  Sparkles,
  Globe,
  ArrowRightFromSquare,
  CircleCheck,
  Palette,
} from "@gravity-ui/icons"

import Footer7 from "@/components/blocks/footer-7"
import { WhiteLabelerDemoPortalForm } from "@/components/brand/white-labeler-demo-login-form"
import {
  Accordion,
  Chip,
  Button,
  Card,
} from "@heroui/react"
import { StructuredSvgBg } from "@/components/brand/structured-svg-bg"
import { cn } from "@/lib/utils"

const storyChapters = [
  {
    title: "Keep the client-facing surface",
    subtitle: "Chapter 01",
    body: "Present delivery through your brand so the relationship compounds for your agency instead of disappearing into a hidden vendor layer.",
    href: "/onboarding/white-label",
    cta: "Apply to partner",
    icon: House,
  },
  {
    title: "Spin up the operator workspace",
    subtitle: "Chapter 02",
    body: "Approved partners move through branding, billing setup, domain readiness, team setup, and first-client launch without rebuilding the wheel.",
    href: "/onboarding/white-label?mode=sign-in",
    cta: "Open portal",
    icon: Display,
  },
  {
    title: "Control price, margin, and payout logic",
    subtitle: "Chapter 03",
    body: "Pricing overrides, payout tracking, and billing history let you operate like a reseller with real controls instead of a messy back-office handoff.",
    href: "/onboarding/white-label?mode=sign-in",
    cta: "Sign in",
    icon: CreditCard,
  },
] as const

const operatingSystems = [
  {
    title: "Brand profile",
    body: "Manage logos, domains, and surface-level identity so the client experience reflects your company, not a hidden vendor handoff.",
    icon: Palette,
  },
  {
    title: "Pricing controls",
    body: "Override sell price, base cost, and white-label fee so your margin logic is explicit and auditable.",
    icon: CreditCard,
  },
  {
    title: "Team permissions",
    body: "Invite users and constrain owner or admin actions without turning every operational task into a bottleneck.",
    icon: Persons,
  },
  {
    title: "Payout ledger",
    body: "Track monthly payout inputs and connected payout state without relying on a private spreadsheet loop.",
    icon: ShieldCheck,
  },
] as const

const onboardingFlow = [
  {
    title: "Partner signup and approval",
    detail: "Approval protects the system before tenant resources are provisioned.",
  },
  {
    title: "Organization creation and branding",
    detail: "Your brand identity becomes the visible operating layer.",
  },
  {
    title: "Payout ledger and details setup",
    detail: "Payment rails and payout logic land before live selling.",
  },
  {
    title: "Domain verification and workspace readiness",
    detail: "The workspace goes client-facing only after infrastructure checks out.",
  },
  {
    title: "Team invitations and first client launch",
    detail: "Team access and the first reseller client record complete the loop.",
  },
] as const

const clientSurface = [
  "Your logo, your domain, your client-facing surface.",
  "A delivery layer that feels like your agency got faster, not outsourced.",
  "A margin engine with explicit price, cost, fee, and payout visibility.",
] as const

const audienceSegments = [
  "Digital agencies",
  "SEO operators",
  "Local marketing shops",
  "Fractional CMOs",
  "Boutique web studios",
] as const

const bentoBlocks = [
  {
    key: "hero-pillar",
    title: "Brand-first delivery",
    body: "Client touchpoints stay under your identity end to end—not a co-branded handoff.",
    className: "lg:col-span-2 lg:row-span-2",
  },
  {
    key: "economics",
    title: "Transparent economics",
    body: "Sell price, platform fees, and net payout in one lane you can audit.",
    className: "",
  },
  {
    key: "launch",
    title: "Guided partner launch",
    body: "Same sequence: approval → branding → billing → go-live.",
    className: "",
  },
  {
    key: "reporting",
    title: "Payout-ready reporting",
    body: "Monthly inputs roll into drafts—no parallel spreadsheet truth.",
    className: "lg:col-span-2",
  },
] as const

const faqItems = [
  {
    q: "Who is the white-label program for?",
    a: "Agencies and operators who want to resell Statxeo-style SEO sites and lead routing under their own brand, with tenant-level controls for pricing and payouts.",
  },
  {
    q: "Do clients ever see Statxeo branding?",
    a: "The program is built so your client-facing surface—domain, positioning, and delivery narrative—stays yours. Operator tooling lives in your branded workspace.",
  },
  {
    q: "How does pricing and margin work?",
    a: "You set sell price against base cost and platform fees in the tenant. Net payout is explicit from those inputs so finance questions have a single source of truth.",
  },
  {
    q: "What happens after I apply?",
    a: "Applications are reviewed before provisioning. Once approved, you move through organization setup, billing configuration, domain checks, and team access—then first client launch.",
  },
  {
    q: "Where do I sign in after I am approved?",
    a: "Use the partner portal sign-in for day-to-day operations, or open the full tenant portal when you need admin-level controls.",
  },
] as const

function MotionSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{
        duration: reduceMotion ? 0 : 0.38,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

function OnboardingTimeline() {
  return (
    <ol className="relative m-0 list-none space-y-0 border-l border-neutral-700 pl-6">
      {onboardingFlow.map((step, i) => (
        <li key={step.title} className="relative pb-10 last:pb-0">
          <span className="absolute -left-6 top-0 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-primary/40 bg-background font-mono text-xs font-semibold text-primary">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="font-semibold text-foreground">{step.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
        </li>
      ))}
    </ol>
  )
}

export function WhiteLabelProgramSection() {
  return (
    <>
      <a
        href="#wl-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      <main
        id="wl-main"
        className="relative min-h-dvh bg-background pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-foreground md:pb-0"
        tabIndex={-1}
      >
        {/* Hero atmosphere */}
        <section className="relative overflow-hidden border-b border-neutral-800">
          <StructuredSvgBg className="opacity-80" />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(34,211,238,0.10),transparent_26%),linear-gradient(180deg,rgba(9,9,11,0.72)_0%,rgba(9,9,11,0.35)_40%,rgba(9,9,11,0.88)_100%)]"
            aria-hidden
          />

          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8 lg:pb-28 lg:pt-12">
            <header className="flex flex-col gap-4 rounded-2xl border border-neutral-800 bg-card/75 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <House className="h-4 w-4 shrink-0" aria-hidden />
                Statxeo home
              </Link>
              <nav className="flex flex-wrap items-center gap-2" aria-label="White-label partner actions">
                <Link href="/onboarding/white-label">
                  <Button variant="outline" className="min-h-11 rounded-full border-neutral-800 text-foreground">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Apply
                  </Button>
                </Link>
                <Link href="/onboarding/white-label?mode=sign-in">
                  <Button variant="secondary" className="min-h-11 rounded-full bg-neutral-800 text-foreground">
                    <ArrowRightFromSquare className="h-4 w-4" aria-hidden />
                    Sign in
                  </Button>
                </Link>
                <Link href="/white-label">
                  <Button variant="primary" className="min-h-11 rounded-full">
                    Tenant portal
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
              </nav>
            </header>

            <div className="mx-auto mt-14 max-w-4xl text-center lg:mt-20">
              <Chip
                variant="soft"
                color="accent"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-primary h-auto"
              >
                White-label partner program
              </Chip>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.06]">
                Your brand on the marquee.{" "}
                <span className="bg-gradient-to-r from-primary via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                  Statxeo under the hood.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Sell high-converting SEO sites and lead routing as your own product—with a tenant workspace built for
                explicit margin math, not vague “partner perks.”
              </p>
              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                <Link href="/onboarding/white-label">
                  <Button variant="primary" className="min-h-12 rounded-full px-8 text-base font-semibold">
                    Start with an application
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
                <Link href="/white-label">
                  <Button variant="outline" className="min-h-12 rounded-full border-neutral-800 text-foreground px-8 text-base font-semibold">
                    Explore the tenant portal
                  </Button>
                </Link>
              </div>
            </div>

            <p className="mx-auto mt-12 max-w-2xl text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Built for teams like
            </p>
            <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:gap-3">
              {audienceSegments.map((label) => (
                <li key={label}>
                  <span className="inline-flex min-h-9 items-center rounded-full border border-neutral-800 bg-card/60 px-4 py-2 text-sm text-muted-foreground">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Proof row */}
        <section className="border-b border-neutral-800 bg-neutral-900/20 px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="wl-commitments-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="wl-commitments-heading" className="sr-only">
              What you get in the program
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {clientSurface.map((point) => (
                <div
                  key={point}
                  className="flex gap-4 rounded-2xl border border-neutral-850 bg-card/80 p-5 shadow-sm transition-colors hover:border-primary/30"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <CircleCheck className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bento */}
        <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="wl-bento-heading">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <Chip variant="soft" color="accent" className="rounded-full text-muted-foreground">
                Operating principles
              </Chip>
              <h2 id="wl-bento-heading" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Why this lane feels different from a generic reseller PDF
              </h2>
            </div>
            <div className="grid auto-rows-fr gap-4 lg:grid-cols-4">
              {bentoBlocks.map((block) => (
                <MotionSection
                  key={block.key}
                  className={cn(
                    "flex flex-col justify-between rounded-3xl border border-neutral-800 bg-card/90 p-6 shadow-sm transition-shadow hover:shadow-md",
                    block.className,
                  )}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{block.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{block.body}</p>
                  </div>
                </MotionSection>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
        </div>

        {/* Dual reality */}
        <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="wl-dual-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="wl-dual-heading" className="sr-only">
              Client experience and operator controls
            </h2>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <Chip variant="soft" color="accent" className="rounded-full text-muted-foreground">
                Two lenses, one product
              </Chip>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Calm for the client. Surgical for your ops team.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="overflow-hidden border-neutral-800 bg-card shadow-lg rounded-3xl">
                <Card.Header className="border-b border-neutral-800 bg-neutral-900/40 pb-5 flex flex-col items-start gap-2">
                  <Chip variant="soft" color="accent" className="rounded-full text-muted-foreground">
                    Client-facing view
                  </Chip>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    What your client should feel
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    Your brand stays in front. Delivery feels like your agency leveled up—not like a silent subcontract.
                  </p>
                </Card.Header>
                <Card.Content className="space-y-4 pt-6">
                  <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/30">
                    <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900/50 px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-red-400/80" aria-hidden />
                      <span className="h-2 w-2 rounded-full bg-amber-400/80" aria-hidden />
                      <span className="h-2 w-2 rounded-full bg-primary/80" aria-hidden />
                      <span className="ml-2 truncate rounded-md border border-neutral-850 bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        launch.agencynorth.com
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Branded surface</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">Agency North Digital</p>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                          <Globe className="h-5 w-5" aria-hidden />
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-neutral-800 bg-background/60 p-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Domain</p>
                          <p className="mt-2 text-sm font-medium text-foreground">launch.agencynorth.com</p>
                        </div>
                        <div className="rounded-xl border border-neutral-800 bg-background/60 p-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Promise</p>
                          <p className="mt-2 text-sm font-medium text-foreground">Faster SEO sites, same relationship</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Brand", "Owned"],
                      ["Delivery", "Systemized"],
                      ["Feel", "Native"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-neutral-800 bg-neutral-900/20 p-4 text-center sm:text-left">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>

              <Card className="border-neutral-800 bg-card shadow-lg rounded-3xl">
                <Card.Header className="border-b border-neutral-800 bg-primary/8 pb-5 flex flex-col items-start gap-2">
                  <Chip color="accent" variant="soft" className="rounded-full text-primary border-primary/35">
                    Margin model (example)
                  </Chip>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    What your ops team should control
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    Illustrative numbers—your lane uses the same structure with your chosen sell price and fees.
                  </p>
                </Card.Header>
                <Card.Content className="space-y-3 pt-6">
                  {[
                    ["Amount sold", "$999", "What your agency charges the client"],
                    ["Base cost", "$399", "Underlying delivery cost"],
                    ["White-label fee", "$100", "Platform fee for the reseller lane"],
                    ["Net payout", "$500", "Sold minus cost and fee"],
                  ].map(([label, value, note]) => (
                    <div key={label} className="rounded-2xl border border-neutral-800 bg-neutral-900/20 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-foreground">{value}</p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                          <CreditCard className="h-5 w-5" aria-hidden />
                        </div>
                      </div>
                    </div>
                  ))}
                </Card.Content>
              </Card>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
        </div>

        {/* Journey cards */}
        <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="wl-journey-heading">
          <div className="mx-auto max-w-6xl rounded-3xl border border-neutral-800 bg-card/50 p-6 shadow-sm backdrop-blur-sm sm:p-10">
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Chip variant="soft" color="accent" className="rounded-full border-neutral-800 text-muted-foreground">
                  Partner journey
                </Chip>
                <h2 id="wl-journey-heading" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Three chapters—from relationship to economics
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground lg:text-right">
                Each card is a deep link: surface first, workspace second, sign-in when you are ready for payout math.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {storyChapters.map((chapter, i) => (
                <MotionSection key={chapter.title} delay={i * 0.06}>
                  <Link
                    href={chapter.href}
                    className={cn(
                      "group flex h-full min-h-[260px] flex-col justify-between rounded-2xl border border-neutral-800 bg-card p-6 shadow-sm transition-all duration-200",
                      "hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg motion-reduce:hover:translate-y-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                          <chapter.icon className="h-5 w-5" aria-hidden />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{chapter.subtitle}</span>
                      </div>
                      <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">{chapter.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{chapter.body}</p>
                    </div>
                    <span className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary transition-[gap] duration-200 group-hover:gap-3">
                      {chapter.cta}
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </span>
                  </Link>
                </MotionSection>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
        </div>

        {/* Timeline + controls + FAQ */}
        <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="wl-onboard-heading">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
            <div>
              <Chip variant="soft" color="accent" className="rounded-full border-neutral-800 text-muted-foreground">
                Onboarding sequence
              </Chip>
              <h2 id="wl-onboard-heading" className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                One operating story from approval to first client
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Same path for every approved partner—so setup, billing, and delivery stay boring in the best way.
              </p>
              <div className="mt-8 rounded-3xl border border-neutral-800 bg-card/80 p-6 shadow-sm">
                <OnboardingTimeline />
                <div className="mt-8 border-t border-neutral-800 pt-6">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Each phase maps to the journey cards above—same sequence whether you are on mobile or desktop.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <Card className="border-neutral-800 bg-card shadow-lg rounded-3xl">
                <Card.Header className="border-b border-neutral-800 bg-primary/8 flex flex-col items-start gap-2">
                  <Chip color="accent" variant="soft" className="rounded-full text-primary border-primary/35">
                    Tenant controls
                  </Chip>
                  <h3 className="text-xl font-semibold tracking-tight sm:text-2xl text-foreground">
                    The four panels operators live in
                  </h3>
                </Card.Header>
                <Card.Content className="grid gap-3 pt-6 sm:grid-cols-2">
                  {operatingSystems.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-neutral-800 bg-neutral-900/20 p-5 transition-colors hover:border-primary/25"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <item.icon className="h-5 w-5" aria-hidden />
                      </div>
                      <p className="mt-4 font-semibold text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  ))}
                </Card.Content>
              </Card>

              <div className="rounded-3xl border border-neutral-800 bg-card/80 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground">Questions partners ask first</h3>
                <p className="mt-1 text-sm text-muted-foreground">Straight answers—expand any row.</p>
                <Accordion className="mt-4 w-full px-0">
                  {faqItems.map((item, i) => (
                    <Accordion.Item key={`faq-${i}`} id={`faq-${i}`}>
                      <Accordion.Heading>
                        <Accordion.Trigger>
                          {item.q}
                          <Accordion.Indicator />
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="text-muted text-sm">{item.a}</Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-neutral-800 px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="wl-cta-heading">
          <div className="mx-auto max-w-4xl text-center">
            <h2 id="wl-cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to own the surface and the spreadsheet?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Apply once. If it is a fit, we provision your lane and you graduate into full tenant controls with pricing
              and payout visibility baked in.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <Link href="/onboarding/white-label">
                <Button variant="primary" className="min-h-12 rounded-full px-8 text-base font-semibold">
                  Apply as a partner
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <WhiteLabelerDemoPortalForm
                variant="outline"
                className="flex w-full justify-center sm:inline-flex sm:w-auto"
                buttonClassName="rounded-full border-neutral-800"
              />
              <Link href="/onboarding/white-label?mode=sign-in">
                <Button variant="outline" className="min-h-12 rounded-full border-neutral-800 text-foreground px-8 text-base font-semibold">
                  Sign in to portal
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Mobile sticky CTA */}
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
          role="region"
          aria-label="Quick apply"
        >
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <Link href="/onboarding/white-label" className="flex-1">
              <Button variant="primary" className="min-h-12 w-full rounded-full">
                Apply
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
            </Link>
            <WhiteLabelerDemoPortalForm
              variant="secondary"
              compactLabel
              className="flex shrink-0 justify-center"
              buttonClassName="min-h-12 shrink-0 rounded-full px-4"
            />
            <Link href="/onboarding/white-label?mode=sign-in" className="shrink-0">
              <Button variant="outline" className="min-h-12 rounded-full px-4 border-neutral-800 text-foreground">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer7 />
    </>
  )
}
