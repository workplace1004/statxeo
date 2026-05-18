"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Plus,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react"
import { Avatar, Button as HeroButton, Card as HeroCard, Chip as HeroChip } from "@heroui/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { formatCents, formatDateTime } from "@/components/white-labeler/portal-utils"
import type { WhiteLabelerOverviewResponse } from "@/lib/statxeo/white-labeler-client"
import { cn } from "@/lib/utils"

const SETUP_BANNER_KEY = "statxeo_wl_setup_banner_dismissed"

function firstSetupHref(overview: WhiteLabelerOverviewResponse | null): string {
  if (!overview) return "/white-labeler/account"
  const code = overview.launchReadiness?.blockers?.[0]?.code?.toLowerCase() ?? ""
  if (code.includes("brand") || code.includes("domain")) return "/white-labeler/branding"
  if (code.includes("team")) return "/white-labeler/team"
  if (code.includes("client")) return "/white-labeler/clients"
  return "/white-labeler/account"
}

type FeedItem = {
  id: string
  at: string
  label: string
  sub: string
  href: string
}

export function WhiteLabelerHomePage() {
  const router = useRouter()
  const {
    overview,
    overviewLoading,
    overviewError,
    loadOverview,
    billing,
    clients,
    payouts,
    accountCurrency,
    stripeReturnQuery,
  } = useWhiteLabelerPortal()

  const [setupOpen, setSetupOpen] = useState(true)
  const [setupDismissed, setSetupDismissed] = useState(false)

  useEffect(() => {
    try {
      setSetupDismissed(localStorage.getItem(SETUP_BANNER_KEY) === "1")
    } catch {
      setSetupDismissed(false)
    }
  }, [])

  const canSell = overview?.launchReadiness?.canSell ?? false
  const showSetupBanner = !canSell && overview && !setupDismissed

  const completedSteps = overview?.onboarding.completedSteps ?? 0
  const totalSteps = overview?.onboarding.totalSteps ?? 1

  const heroLine = useMemo(() => {
    if (!overview) return "Loading your workspace…"
    if (canSell) {
      const n = overview.kpis.activeClients
      return `You're live. ${n} active ${n === 1 ? "client" : "clients"}.`
    }
    const remaining = Math.max(0, totalSteps - completedSteps)
    return remaining <= 1 ? "One step left before checkout links work everywhere." : `${remaining} steps left to go live.`
  }, [overview, canSell, totalSteps, completedSteps])

  const activityFeed = useMemo(() => {
    const items: FeedItem[] = []
    for (const c of billing) {
      items.push({
        id: `charge-${c.id}`,
        at: c.charged_at,
        label: `Charge · ${c.plan_code}`,
        sub: `${formatCents(c.amount_sold_cents, c.currency)} · ${c.charge_status}`,
        href: "/white-labeler/billing",
      })
    }
    for (const cl of clients) {
      items.push({
        id: `client-${cl.id}`,
        at: cl.created_at,
        label: `Client · ${cl.client_name}`,
        sub: `${cl.status} · ${cl.active_site_count} sites`,
        href: "/white-labeler/clients",
      })
    }
    for (const p of payouts) {
      items.push({
        id: `payout-${p.id}`,
        at: p.finalized_at ?? p.generated_at,
        label: `Payout · ${p.settlement_month}`,
        sub: `${p.status} · ${formatCents(p.net_amount_cents, p.currency)}`,
        href: "/white-labeler/payouts",
      })
    }
    return items
      .filter((i) => Date.parse(i.at))
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 10)
  }, [billing, clients, payouts])

  if (overviewLoading && !overview) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-lg" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (overviewError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load dashboard</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {overviewError}
          <Button type="button" size="sm" variant="outline" onClick={() => void loadOverview()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!overview) return null

  const displayName = overview.account.displayName?.trim() || "White-label partner"
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("") || "WL"

  return (
    <div className="space-y-8">
      <HeroCard variant="secondary" className="overflow-hidden border border-white/8 bg-white/4 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <HeroCard.Content className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar size="lg" variant="soft">
                <Avatar.Fallback>{initials}</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <HeroChip size="sm" variant="soft" color="accent">
                    Overview
                  </HeroChip>
                  <HeroChip size="sm" variant="soft" color={canSell ? "success" : "warning"}>
                    {canSell ? "Live" : "Setup in progress"}
                  </HeroChip>
                </div>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{displayName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{heroLine}</h2>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                This is your command center. Setup, revenue, payouts, and operational actions are separated so the next step is always obvious.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <HeroButton size="sm" variant="primary" onPress={() => router.push("/white-labeler/clients")}>
                <Plus className="size-4" />
                Add client
              </HeroButton>
              <HeroButton size="sm" variant="secondary" onPress={() => router.push("/white-labeler/clients")}>
                Create checkout link
              </HeroButton>
              <HeroButton size="sm" variant="outline" onPress={() => router.push("/white-labeler/payouts")}>
                View payouts
              </HeroButton>
            </div>
          </div>

          <div className="grid gap-3 sm:min-w-72 sm:grid-cols-2 lg:grid-cols-1">
            <HeroCard variant="tertiary" className="border border-white/8 bg-black/20">
              <HeroCard.Header>
                <HeroCard.Description>Launch readiness</HeroCard.Description>
                <HeroCard.Title>{overview.onboarding.percentComplete}% complete</HeroCard.Title>
              </HeroCard.Header>
              <HeroCard.Content className="space-y-3">
                <Progress value={overview.onboarding.percentComplete} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {completedSteps}/{totalSteps} checklist items completed.
                </p>
              </HeroCard.Content>
            </HeroCard>
            <HeroCard variant="tertiary" className="border border-white/8 bg-black/20">
              <HeroCard.Header>
                <HeroCard.Description>Monthly net payout</HeroCard.Description>
                <HeroCard.Title>{formatCents(overview.kpis.monthNetPayoutCents, accountCurrency)}</HeroCard.Title>
              </HeroCard.Header>
              <HeroCard.Content>
                <p className="text-sm text-muted-foreground">
                  Net after plan costs and white-label fees for the current cycle.
                </p>
              </HeroCard.Content>
            </HeroCard>
          </div>
        </HeroCard.Content>
      </HeroCard>

      {stripeReturnQuery === "active" ? (
        <Alert className="border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle2 className="text-emerald-500" />
          <AlertTitle>Stripe Connect is active</AlertTitle>
          <AlertDescription>Your payout account is ready. Review details on Account if needed.</AlertDescription>
        </Alert>
      ) : stripeReturnQuery === "pending" ? (
        <Alert>
          <AlertTitle>Stripe onboarding saved</AlertTitle>
          <AlertDescription>Finish any remaining requirements under Account to enable payouts.</AlertDescription>
        </Alert>
      ) : stripeReturnQuery === "restricted" ? (
        <Alert>
          <AlertCircle className="text-amber-500" />
          <AlertTitle>Stripe needs attention</AlertTitle>
          <AlertDescription>Open Account to resolve outstanding requirements.</AlertDescription>
        </Alert>
      ) : stripeReturnQuery === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>Stripe sync failed</AlertTitle>
          <AlertDescription>Refresh the page or open Account to reconnect.</AlertDescription>
        </Alert>
      ) : null}

      {showSetupBanner ? (
        <HeroCard variant="secondary" className="border border-amber-500/25 bg-amber-500/8">
          <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
            <HeroCard.Header className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
              <div className="space-y-1">
                <HeroCard.Title className="text-lg">Finish setup</HeroCard.Title>
                <HeroCard.Description>
                  {completedSteps}/{totalSteps} checklist items done. Complete the blockers below to sell with live checkout
                  links.
                </HeroCard.Description>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm">
                  <Link href={firstSetupHref(overview)}>
                    Continue setup
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    try {
                      localStorage.setItem(SETUP_BANNER_KEY, "1")
                    } catch {
                      /* ignore */
                    }
                    setSetupDismissed(true)
                  }}
                >
                  Dismiss
                </Button>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-9" aria-label="Expand setup details">
                    <ChevronDown className={cn("size-4 transition-transform", setupOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </HeroCard.Header>
            <CollapsibleContent>
              <HeroCard.Content className="space-y-3 border-t border-border/60 pt-4">
                <div className="flex items-center gap-3">
                  <Progress value={overview.onboarding.percentComplete} className="h-2 flex-1" />
                  <span className="text-muted-foreground text-xs tabular-nums">{overview.onboarding.percentComplete}%</span>
                </div>
                {overview.launchReadiness?.blockers?.length ? (
                  <ul className="text-sm space-y-1.5">
                    {overview.launchReadiness.blockers.map((b) => (
                      <li key={b.code} className="flex gap-2">
                        <AlertCircle className="text-amber-500 mt-0.5 size-4 shrink-0" aria-hidden />
                        <span>{b.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </HeroCard.Content>
            </CollapsibleContent>
          </Collapsible>
        </HeroCard>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HeroCard variant="secondary" className="border border-white/8 bg-white/4">
          <HeroCard.Header className="flex flex-row items-center justify-between pb-2">
            <HeroCard.Description>Active clients</HeroCard.Description>
            <Users className="text-muted-foreground size-4" aria-hidden />
          </HeroCard.Header>
          <HeroCard.Content>
            <p className="text-3xl font-bold tabular-nums">{overview.kpis.activeClients}</p>
          </HeroCard.Content>
        </HeroCard>
        <HeroCard variant="secondary" className="border border-white/8 bg-white/4">
          <HeroCard.Header className="flex flex-row items-center justify-between pb-2">
            <HeroCard.Description>Month revenue</HeroCard.Description>
            <CreditCard className="text-muted-foreground size-4" aria-hidden />
          </HeroCard.Header>
          <HeroCard.Content>
            <p className="text-3xl font-bold tabular-nums">{formatCents(overview.kpis.monthRevenueCents, accountCurrency)}</p>
          </HeroCard.Content>
        </HeroCard>
        <HeroCard variant="secondary" className="border border-white/8 bg-white/4">
          <HeroCard.Header className="flex flex-row items-center justify-between pb-2">
            <HeroCard.Description>Outstanding drafts</HeroCard.Description>
            <Wallet className="text-muted-foreground size-4" aria-hidden />
          </HeroCard.Header>
          <HeroCard.Content>
            <p className="text-3xl font-bold tabular-nums">
              {formatCents(overview.kpis.outstandingDraftPayoutCents, accountCurrency)}
            </p>
          </HeroCard.Content>
        </HeroCard>
        <HeroCard variant="secondary" className="border border-white/8 bg-white/4">
          <HeroCard.Header className="flex flex-row items-center justify-between pb-2">
            <HeroCard.Description>Net payout (month)</HeroCard.Description>
            <Sparkles className="text-muted-foreground size-4" aria-hidden />
          </HeroCard.Header>
          <HeroCard.Content>
            <p className="text-3xl font-bold tabular-nums">
              {formatCents(overview.kpis.monthNetPayoutCents, accountCurrency)}
            </p>
          </HeroCard.Content>
        </HeroCard>
      </div>

      <HeroCard variant="secondary" className="border border-white/8 bg-white/4">
        <HeroCard.Header>
          <HeroCard.Title className="text-lg">Recent activity</HeroCard.Title>
          <HeroCard.Description>Latest charges, clients, and payout updates.</HeroCard.Description>
        </HeroCard.Header>
        <HeroCard.Content>
          {activityFeed.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet—create a client or connect Stripe to get started.</p>
          ) : (
            <ul className="divide-y divide-border/60 rounded-md border border-border/60">
              {activityFeed.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="hover:bg-muted/50 flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-muted-foreground truncate text-xs">{item.sub}</p>
                    </div>
                    <time className="text-muted-foreground shrink-0 text-xs tabular-nums">{formatDateTime(item.at)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </HeroCard.Content>
      </HeroCard>
    </div>
  )
}
