"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Overview</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{heroLine}</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          This is your command center—setup, revenue, and payouts stay separated so you always know what to do next.
        </p>
      </div>

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
        <Card className="border-amber-500/25 bg-amber-500/5">
          <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">Finish setup</CardTitle>
                <CardDescription>
                  {completedSteps}/{totalSteps} checklist items done. Complete the blockers below to sell with live checkout
                  links.
                </CardDescription>
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
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-3 border-t border-border/60 pt-4">
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
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Active clients</CardDescription>
            <Users className="text-muted-foreground size-4" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{overview.kpis.activeClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Month revenue</CardDescription>
            <CreditCard className="text-muted-foreground size-4" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{formatCents(overview.kpis.monthRevenueCents, accountCurrency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Outstanding drafts</CardDescription>
            <Wallet className="text-muted-foreground size-4" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {formatCents(overview.kpis.outstandingDraftPayoutCents, accountCurrency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Net payout (month)</CardDescription>
            <Sparkles className="text-muted-foreground size-4" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {formatCents(overview.kpis.monthNetPayoutCents, accountCurrency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/white-labeler/clients">
            <Plus className="size-4" />
            Add client
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/white-labeler/clients">Create checkout link</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/white-labeler/payouts">View payouts</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent activity</CardTitle>
          <CardDescription>Latest charges, clients, and payout updates.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
