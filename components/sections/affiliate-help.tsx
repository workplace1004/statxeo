"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  Crown,
  Flame,
  Home,
  LifeBuoy,
  Link2,
  LogIn,
  MousePointerClick,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BlurHighlight } from "@/components/react-bits/blur-highlight"
import DotShift from "@/components/react-bits/dot-shift"
import NeonReveal from "@/components/react-bits/neon-reveal"
import ShaderCard from "@/components/react-bits/shader-card"
import StaggeredText from "@/components/react-bits/staggered-text"

const quests = [
  {
    icon: Link2,
    title: "Launch your first referral lane",
    xp: "+120 XP",
    description: "Create one evergreen link for your main offer and one time-boxed link for campaigns so you can separate always-on traffic from pushes.",
    reward: "Unlock cleaner attribution and faster experiments.",
  },
  {
    icon: MousePointerClick,
    title: "Tune your destination path",
    xp: "+220 XP",
    description: "Send traffic to the page that matches the promise in the content. Congruence compounds. A sharp path usually beats a generic homepage push.",
    reward: "Higher click-to-lead conversion confidence.",
  },
  {
    icon: BadgeDollarSign,
    title: "Stack commission awareness",
    xp: "+340 XP",
    description: "Check the ledger weekly. Pending means tracked, approved means almost there, paid means it landed. Use the pattern to focus on what really closes.",
    reward: "Better forecasting and less payout confusion.",
  },
]

const levelLadder = [
  {
    level: "Level 01 · Scout",
    icon: Rocket,
    metric: "0–5 referred sales",
    tip: "Focus on one audience, one angle, one destination path.",
  },
  {
    level: "Level 02 · Closer",
    icon: Flame,
    metric: "6–20 referred sales",
    tip: "Duplicate what converts and build campaign-specific links for each channel.",
  },
  {
    level: "Level 03 · Operator",
    icon: Target,
    metric: "21–50 referred sales",
    tip: "Track your best hooks, refresh underperforming assets, and review payouts monthly.",
  },
  {
    level: "Level 04 · Legend",
    icon: Crown,
    metric: "50+ referred sales",
    tip: "Use the portal as a performance cockpit and push toward repeatable campaigns.",
  },
]

const helpTracks = [
  {
    title: "Link Strategy",
    icon: Link2,
    body: "Evergreen links are your home base. One-time links are perfect for launches, stories, and limited promos where you want a clean read on intent.",
  },
  {
    title: "Conversion Reading",
    icon: Trophy,
    body: "Watch which package tiers close after each campaign. Volume matters, but package mix tells you which audience segments actually monetize.",
  },
  {
    title: "Payout Timing",
    icon: Wallet,
    body: "Payout history groups commissions into export-ready batches so you can understand what is pending, what is paid, and what period it belongs to.",
  },
  {
    title: "Trust + Compliance",
    icon: ShieldCheck,
    body: "Always represent the offer clearly. Strong expectations create better close rates and fewer reversals downstream.",
  },
]

const faqs = [
  {
    question: "What should I do first after getting affiliate access?",
    answer:
      "Start by generating an evergreen link, then test a destination path that matches your strongest messaging. From there, review the overview tab so you understand your rates, attribution window, and current earnings state.",
  },
  {
    question: "What is the difference between pending, approved, and paid commissions?",
    answer:
      "Pending means the conversion is tracked but not fully matured. Approved means it is ready for payout processing. Paid means the commission has already been included in a completed payout batch.",
  },
  {
    question: "When should I use a one-time link instead of an evergreen link?",
    answer:
      "Use a one-time link when you want campaign isolation: a limited promo, a single partnership push, or a timed social burst. Evergreen links are better for bios, profiles, and long-lived content.",
  },
  {
    question: "How do I improve results without overcomplicating things?",
    answer:
      "Keep the loop simple: message match, strong call to action, right destination path, then review the ledger and payouts weekly. Small iterative wins outperform random bursts of traffic.",
  },
  {
    question: "Who do I contact if something looks off?",
    answer:
      "If attribution, payout timing, or access looks wrong, contact the Statxt admin or operator who invited you. Bring the link slug, the approximate conversion date, and the issue you noticed so they can trace it quickly.",
  },
]

export function AffiliateHelpSection() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(16,185,129,0.14) 0%, transparent 65%), radial-gradient(ellipse 70% 45% at 80% 30%, rgba(59,130,246,0.10) 0%, transparent 60%)",
          }}
        />
        <div className="absolute right-[-10%] top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/40 px-4 py-3 backdrop-blur-md">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              Statxeo home
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/affiliate/login"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
              >
                <LogIn className="h-4 w-4" />
                Affiliate login
              </Link>
              <Link
                href="/affiliate/portal"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mb-6 flex flex-wrap gap-3"
              >
                <Badge className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-primary">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Affiliate Help HQ
                </Badge>
                <Badge variant="secondary" className="rounded-full px-4 py-1.5">
                  Gamified playbook
                </Badge>
                <Badge variant="outline" className="rounded-full px-4 py-1.5">
                  Built for faster wins
                </Badge>
              </motion.div>

              <StaggeredText
                text="Affiliate help, but built like a performance dashboard"
                as="h1"
                segmentBy="words"
                delay={55}
                duration={0.5}
                direction="bottom"
                blur
                className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              />

              <BlurHighlight
                highlightedBits={["create sharper links", "understand commission states", "level up faster"]}
                highlightColor="rgba(16,185,129,0.28)"
                blurAmount={7}
                className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                This page shows you how to create sharper links, understand commission states, and level up faster without guessing what the portal is trying to tell you.
              </BlurHighlight>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Starter quests", value: "03" },
                  { label: "XP lanes", value: "04" },
                  { label: "Fast answers", value: "05" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-5 lg:items-end">
              <ShaderCard
                width={320}
                height={300}
                color="#10b981"
                speed={0.75}
                scale={2.7}
                effectRadius={0.85}
                effectBoost={0.8}
                className="max-w-full border-border/70 bg-black/50"
              >
                <div className="flex h-full flex-col justify-between p-6 text-white">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-white/65">Combo meter</p>
                    <h2 className="mt-3 text-2xl font-semibold">Win the simple loop</h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/75">
                      Link clarity → message match → tracked conversion → payout confidence.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      ["Message match", "92%"],
                      ["Destination fit", "88%"],
                      ["Payout readiness", "74%"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-white"
                            style={{ width: value }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ShaderCard>

              <div className="relative h-20 w-full max-w-[320px] overflow-hidden rounded-2xl border border-white/15 bg-black/70">
                <NeonReveal
                  className="absolute inset-0"
                  animateOnScroll
                  scrollThreshold={0.1}
                  revealDuration={2600}
                  revealDelay={40}
                  verticalOffset={0.5}
                  barWidth={0.92}
                  mirrored
                  color={150}
                  glowSpread={0.58}
                  intensity={2.6}
                />
                <div className="relative z-10 flex h-full items-center justify-center text-xs font-mono uppercase tracking-[0.22em] text-white/85">
                  Support signal online
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-card/35 p-6 backdrop-blur-md sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Badge variant="secondary" className="rounded-full px-4 py-1.5">
              Quest board
            </Badge>
            <p className="text-sm text-muted-foreground">Do these in order if you want the cleanest ramp.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {quests.map((quest, index) => (
              <motion.div
                key={quest.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <Card className="relative h-full overflow-hidden border-border/70 bg-background/60">
                  <div className="absolute inset-0 opacity-60">
                    <DotShift className="h-full w-full" color={index === 0 ? "#10b981" : index === 1 ? "#60a5fa" : "#c084fc"} speed={0.35} scale={0.55} size={0.5} blur={0.6} />
                  </div>
                  <div className="absolute inset-0 bg-background/75" />
                  <CardHeader className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-card/80">
                        <quest.icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
                        {quest.xp}
                      </Badge>
                    </div>
                    <CardTitle className="pt-3 text-xl">{quest.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {quest.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-foreground">
                      <span className="font-medium text-primary">Reward:</span> {quest.reward}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden border-border/70 bg-card/40">
            <CardHeader>
              <Badge variant="outline" className="w-fit rounded-full px-4 py-1.5">
                Level ladder
              </Badge>
              <CardTitle className="text-2xl">A playful way to think about progression</CardTitle>
              <CardDescription>
                This is not a literal payout tier system. It is a practical framework for how strong affiliates usually mature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {levelLadder.map((item, index) => (
                <div key={item.level} className="flex gap-4 rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{item.level}</p>
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stage {index + 1}</span>
                    </div>
                    <p className="mt-1 text-sm text-primary">{item.metric}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.tip}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="relative overflow-hidden border-border/70 bg-card/40">
              <div className="absolute inset-x-0 top-0 h-24 opacity-80">
                <NeonReveal
                  className="h-full w-full"
                  animateOnScroll
                  revealDuration={2200}
                  revealDelay={50}
                  verticalOffset={0.4}
                  barWidth={0.8}
                  mirrored={false}
                  color={195}
                  glowSpread={0.6}
                  intensity={2.2}
                />
              </div>
              <CardHeader className="relative z-10">
                <Badge variant="secondary" className="w-fit rounded-full px-4 py-1.5">
                  Payout arena
                </Badge>
                <CardTitle>How to read your payout history</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="font-medium text-foreground">Pending</p>
                  <p className="mt-1">Tracked and waiting to fully mature or clear the approval process.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="font-medium text-foreground">Approved</p>
                  <p className="mt-1">Ready for payout processing and usually the cleanest signal for near-term earnings.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="font-medium text-foreground">Paid</p>
                  <p className="mt-1">Already included in a payout batch. Use this for historical performance tracking.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/40">
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full px-4 py-1.5">
                  Field guide
                </Badge>
                <CardTitle>Portal areas that matter most</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {helpTracks.map((track) => (
                  <div key={track.title} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <track.icon className="h-4 w-4" />
                    </div>
                    <p className="font-medium text-foreground">{track.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{track.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-card/40 p-6 backdrop-blur-md sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-primary">
                <Zap className="mr-2 h-3.5 w-3.5" />
                Fast answers
              </Badge>
              <h2 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">Affiliate FAQ, minus the boring part</h2>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              Skim this like a playbook. Most of the questions affiliates ask repeatedly are really about link intent, commission state, and payout timing.
            </p>
          </div>

          <Accordion type="single" collapsible className="rounded-2xl border border-border/70 bg-background/50 px-5">
            {faqs.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger className="py-5 text-base text-foreground hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 bg-black/60 backdrop-blur-sm">
          <div className="relative grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="absolute inset-0 opacity-60">
              <DotShift className="h-full w-full" color="#10b981" speed={0.45} scale={0.62} size={0.62} blur={0.6} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/65" />

            <div className="relative z-10 p-8 sm:p-10 lg:p-12">
              <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-white">
                <LifeBuoy className="mr-2 h-3.5 w-3.5" />
                Need a quick reset?
              </Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Go back into the portal with a clean plan.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                Create one strong evergreen link, align it to one offer promise, check the ledger weekly, and let the payouts screen show you what is maturing. That loop beats chaos.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/affiliate/portal"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white/90"
                >
                  Open affiliate portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/affiliate/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div className="relative z-10 flex items-center p-8 sm:p-10 lg:p-12">
              <div className="grid w-full gap-4">
                {[
                  { icon: CheckCircle2, title: "Build one evergreen link", text: "Make it the default asset you can trust across bios, profiles, and long-form content." },
                  { icon: BookOpen, title: "Review help when campaigns change", text: "New offer, new audience, new channel? Revisit the link strategy and payout sections first." },
                  { icon: Trophy, title: "Treat the portal like a scorecard", text: "Use overview for direction, links for setup, ledger for truth, and payouts for closure." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-white">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-white/70">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}