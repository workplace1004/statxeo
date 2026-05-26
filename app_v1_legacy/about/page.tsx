import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BadgeCheck, Bot, Globe2, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "About Statxeo | SEO + 10DLC-Ready Website Builds",
  description:
    "Learn how Statxeo combines high-converting websites, local SEO structure, 10DLC-ready messaging, and Statxt lead routing for service businesses.",
}

const pillars = [
  {
    icon: Globe2,
    title: "SEO-first site architecture",
    description: "Pages are structured to rank, load fast, and convert for local service searches.",
  },
  {
    icon: ShieldCheck,
    title: "10DLC-ready messaging",
    description: "We build with compliance-aware language so your lead flow is ready for real operational messaging.",
  },
  {
    icon: Bot,
    title: "AI-readable content",
    description: "Statxeo supports discoverability for modern AI systems with structured content and llms guidance.",
  },
  {
    icon: BadgeCheck,
    title: "Lead routing included",
    description: "Every qualified inquiry can flow directly into Statxt and to your phone for faster follow-up.",
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-mono uppercase tracking-[0.22em] text-primary">About Statxeo</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            SEO websites built to convert and route leads fast.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Statxeo is built for service businesses that need more than a pretty homepage. The product combines search-ready website structure, conversion-focused messaging, 10DLC-aware lead capture, and Statxt routing in one launch workflow.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="neo-surface rounded-3xl p-6">
              <pillar.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
            </div>
          ))}
        </div>

        <div className="neo-surface-soft rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-foreground">What makes the site feel legit</h2>
          <div className="mt-4 grid gap-4 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
            <p>Statxeo includes visible trust signals like legal terms, privacy coverage, structured metadata, sitemap support, robots directives, and AI-readable discovery output.</p>
            <p>That means the sales site is better prepared for search engines, AI agents, and buyers checking whether the offer is operationally credible.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/faq" className="neo-button-shell neo-button-secondary px-5 py-3 text-sm text-foreground">
              Read FAQ
            </Link>
            <Link href="/#pricing" className="neo-button-shell neo-button-primary px-5 py-3 text-sm text-primary-foreground">
              View website plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
