"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Copy,
  Download,
  FolderOpen,
  Link2,
  LogOut,
  MousePointerClick,
  RefreshCcw,
  TrendingUp,
  Wallet,
} from "lucide-react"

import {
  AffiliateApiError,
  type AffiliateCommissionStatus,
  type AffiliateLedgerEntry,
  type AffiliateLink,
  type AffiliateOverviewResponse,
  type AffiliatePayoutsResponse,
  createAffiliateLink,
  exportAffiliatePayoutCsv,
  fetchAffiliateAdminAccess,
  fetchAffiliateLedger,
  fetchAffiliateLinks,
  fetchAffiliateOverview,
  fetchAffiliatePayouts,
} from "@/lib/statxeo/affiliate-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
}

function formatCents(value: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((Number(value || 0) || 0) / 100)
}

function formatPercentFromBps(bps: number) {
  return `${(Number(bps || 0) / 100).toFixed(2)}%`
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AffiliateApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function affiliateStatusVariant(status: AffiliateOverviewResponse["affiliate"]["status"]) {
  if (status === "active") return "default"
  if (status === "pending") return "secondary"
  return "destructive"
}

function ledgerStatusVariant(status: AffiliateCommissionStatus) {
  if (status === "paid") return "default"
  if (status === "approved") return "secondary"
  if (status === "pending") return "outline"
  return "destructive"
}

function isLinkActive(link: AffiliateLink) {
  if (!link.is_active) return false

  if (link.expires_at) {
    const expiresAt = new Date(link.expires_at).getTime()
    if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
      return false
    }
  }

  if (typeof link.max_uses === "number" && link.uses_count >= link.max_uses) {
    return false
  }

  return true
}

function buildLedgerSummary(rows: AffiliateLedgerEntry[]) {
  return rows.reduce(
    (acc, row) => {
      const amount = Number(row.amount_cents || 0)
      acc.totalCents += amount

      if (row.status === "pending" || row.status === "approved") {
        acc.pendingCents += amount
      }

      if (row.status === "paid") {
        acc.paidCents += amount
      }

      return acc
    },
    { totalCents: 0, pendingCents: 0, paidCents: 0 },
  )
}

export function AffiliatePortalSection() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  const [overview, setOverview] = useState<AffiliateOverviewResponse | null>(null)
  const [isOverviewLoading, setIsOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [isLinksLoading, setIsLinksLoading] = useState(true)
  const [linksError, setLinksError] = useState<string | null>(null)
  const [linkActionMessage, setLinkActionMessage] = useState<string | null>(null)

  const [createKind, setCreateKind] = useState<"evergreen" | "one_time">("evergreen")
  const [createPath, setCreatePath] = useState("/")
  const [createMaxUses, setCreateMaxUses] = useState("")
  const [createExpiresAt, setCreateExpiresAt] = useState("")
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [createLinkError, setCreateLinkError] = useState<string | null>(null)

  const [ledgerRows, setLedgerRows] = useState<AffiliateLedgerEntry[]>([])
  const [isLedgerLoading, setIsLedgerLoading] = useState(true)
  const [isLedgerLoadingMore, setIsLedgerLoadingMore] = useState(false)
  const [ledgerError, setLedgerError] = useState<string | null>(null)
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<"all" | AffiliateCommissionStatus>("all")
  const [ledgerNextCursor, setLedgerNextCursor] = useState<string | null>(null)
  const [ledgerHasMore, setLedgerHasMore] = useState(false)

  const [payouts, setPayouts] = useState<AffiliatePayoutsResponse["payouts"]>([])
  const [isPayoutsLoading, setIsPayoutsLoading] = useState(true)
  const [isPayoutsLoadingMore, setIsPayoutsLoadingMore] = useState(false)
  const [payoutsError, setPayoutsError] = useState<string | null>(null)
  const [payoutsNextCursor, setPayoutsNextCursor] = useState<string | null>(null)
  const [payoutsHasMore, setPayoutsHasMore] = useState(false)

  const [canAccessAdminExport, setCanAccessAdminExport] = useState(false)
  const [isAdminAccessLoading, setIsAdminAccessLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [sessionActionError, setSessionActionError] = useState<string | null>(null)

  const [payoutMonth, setPayoutMonth] = useState(getCurrentMonthKey())
  const [isExporting, setIsExporting] = useState(false)
  const [adminExportError, setAdminExportError] = useState<string | null>(null)
  const [adminExportSuccess, setAdminExportSuccess] = useState<string | null>(null)

  const ledgerSummary = useMemo(() => buildLedgerSummary(ledgerRows), [ledgerRows])

  const loadOverview = useCallback(async () => {
    setIsOverviewLoading(true)
    setOverviewError(null)

    try {
      const data = await fetchAffiliateOverview()
      setOverview(data)
    } catch (error) {
      setOverviewError(getApiErrorMessage(error, "Unable to load affiliate overview."))
    } finally {
      setIsOverviewLoading(false)
    }
  }, [])

  const loadLinks = useCallback(async () => {
    setIsLinksLoading(true)
    setLinksError(null)

    try {
      const data = await fetchAffiliateLinks()
      setLinks(data.links || [])
    } catch (error) {
      setLinksError(getApiErrorMessage(error, "Unable to load affiliate links."))
    } finally {
      setIsLinksLoading(false)
    }
  }, [])

  const loadLedger = useCallback(
    async ({ append = false, cursor }: { append?: boolean; cursor?: string | null } = {}) => {
      if (append) {
        setIsLedgerLoadingMore(true)
      } else {
        setIsLedgerLoading(true)
        setLedgerError(null)
      }

      try {
        const data = await fetchAffiliateLedger({
          status: ledgerStatusFilter === "all" ? undefined : ledgerStatusFilter,
          limit: 25,
          cursor,
        })

        if (append) {
          setLedgerRows((current) => [...current, ...data.ledger])
        } else {
          setLedgerRows(data.ledger)
        }

        setLedgerHasMore(Boolean(data.pageInfo?.hasMore))
        setLedgerNextCursor(data.pageInfo?.nextCursor ?? null)
      } catch (error) {
        setLedgerError(getApiErrorMessage(error, "Unable to load affiliate ledger."))
      } finally {
        setIsLedgerLoading(false)
        setIsLedgerLoadingMore(false)
      }
    },
    [ledgerStatusFilter],
  )

  const loadPayouts = useCallback(async ({ append = false, cursor }: { append?: boolean; cursor?: string | null } = {}) => {
    if (append) {
      setIsPayoutsLoadingMore(true)
    } else {
      setIsPayoutsLoading(true)
      setPayoutsError(null)
    }

    try {
      const data = await fetchAffiliatePayouts({
        limit: 20,
        cursor,
      })

      const nextRows = data.payouts || []

      if (append) {
        setPayouts((current) => [...current, ...nextRows])
      } else {
        setPayouts(nextRows)
      }

      setPayoutsHasMore(Boolean(data.pageInfo?.hasMore))
      setPayoutsNextCursor(data.pageInfo?.nextCursor ?? null)
    } catch (error) {
      if (!append) {
        setPayoutsError(getApiErrorMessage(error, "Payout history is not available yet."))
        setPayouts([])
      }
      setPayoutsHasMore(false)
      setPayoutsNextCursor(null)
    } finally {
      setIsPayoutsLoading(false)
      setIsPayoutsLoadingMore(false)
    }
  }, [])

  const loadAdminAccess = useCallback(async () => {
    setIsAdminAccessLoading(true)

    try {
      const data = await fetchAffiliateAdminAccess()
      setCanAccessAdminExport(Boolean(data.canAccess))
    } catch {
      setCanAccessAdminExport(false)
    } finally {
      setIsAdminAccessLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.all([loadOverview(), loadLinks(), loadPayouts(), loadAdminAccess()])
  }, [loadAdminAccess, loadLinks, loadOverview, loadPayouts])

  useEffect(() => {
    void loadLedger()
  }, [loadLedger])

  useEffect(() => {
    if (!isAdminAccessLoading && !canAccessAdminExport && activeTab === "admin") {
      setActiveTab("overview")
    }
  }, [activeTab, canAccessAdminExport, isAdminAccessLoading])

  const handleCopyShareUrl = useCallback(async (value: string) => {
    try {
      if (!navigator.clipboard) {
        setLinkActionMessage("Clipboard access is unavailable in this browser.")
        return
      }

      await navigator.clipboard.writeText(value)
      setLinkActionMessage("Share URL copied.")
    } catch {
      setLinkActionMessage("Unable to copy URL right now.")
    }
  }, [])

  const handleCreateLink = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setCreateLinkError(null)
      setLinkActionMessage(null)

      const destinationPath = createPath.trim() || "/"
      const maxUsesValue = createMaxUses.trim()
      let maxUses: number | null = null

      if (maxUsesValue) {
        const parsedMaxUses = Number(maxUsesValue)

        if (!Number.isFinite(parsedMaxUses) || parsedMaxUses <= 0) {
          setCreateLinkError("Max uses must be a positive number.")
          return
        }

        maxUses = parsedMaxUses
      }

      let expiresAtIso: string | null = null
      if (createExpiresAt.trim()) {
        const parsed = new Date(createExpiresAt)
        if (Number.isNaN(parsed.getTime())) {
          setCreateLinkError("Expires at must be a valid date/time.")
          return
        }
        expiresAtIso = parsed.toISOString()
      }

      setIsCreatingLink(true)

      try {
        const created = await createAffiliateLink({
          kind: createKind,
          destinationPath,
          maxUses,
          expiresAt: expiresAtIso,
        })

        setLinks((current) => [created.link, ...current])
        setCreatePath("/")
        setCreateMaxUses(createKind === "one_time" ? "1" : "")
        setCreateExpiresAt("")
        setLinkActionMessage("Affiliate link created.")
      } catch (error) {
        setCreateLinkError(getApiErrorMessage(error, "Unable to create affiliate link."))
      } finally {
        setIsCreatingLink(false)
      }
    },
    [createExpiresAt, createKind, createMaxUses, createPath],
  )

  const handleLoadMoreLedger = useCallback(async () => {
    if (!ledgerHasMore || !ledgerNextCursor || isLedgerLoadingMore) return
    await loadLedger({ append: true, cursor: ledgerNextCursor })
  }, [isLedgerLoadingMore, ledgerHasMore, ledgerNextCursor, loadLedger])

  const handleLoadMorePayouts = useCallback(async () => {
    if (!payoutsHasMore || !payoutsNextCursor || isPayoutsLoadingMore) return
    await loadPayouts({ append: true, cursor: payoutsNextCursor })
  }, [isPayoutsLoadingMore, payoutsHasMore, payoutsNextCursor, loadPayouts])

  const handleExportPayoutCsv = useCallback(async () => {
    setAdminExportError(null)
    setAdminExportSuccess(null)

    if (!payoutMonth) {
      setAdminExportError("Select a month before exporting.")
      return
    }

    setIsExporting(true)

    try {
      const result = await exportAffiliatePayoutCsv(payoutMonth)
      const url = URL.createObjectURL(result.blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = result.filename || `statxeo-affiliate-payouts-${payoutMonth}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setAdminExportSuccess("Payout CSV export started.")
    } catch (error) {
      setAdminExportError(getApiErrorMessage(error, "Unable to export payout CSV."))
    } finally {
      setIsExporting(false)
    }
  }, [payoutMonth])

  const handleSignOut = useCallback(async () => {
    setSessionActionError(null)
    setIsSigningOut(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      router.replace("/affiliate/login")
      router.refresh()
    } catch (error) {
      setSessionActionError(getApiErrorMessage(error, "Unable to sign out right now."))
    } finally {
      setIsSigningOut(false)
    }
  }, [router])

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {sessionActionError ? (
          <Card className="border-destructive/40 bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-destructive">Session action failed</CardTitle>
              <CardDescription>{sessionActionError}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Affiliate Portal</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {overview?.affiliate.displayName ? `Welcome back, ${overview.affiliate.displayName}` : "Grow with Statxeo"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
                Manage referral links, track conversions, and monitor commissions from one production dashboard.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/affiliate/help">Help center</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void Promise.all([loadOverview(), loadLinks(), loadLedger(), loadPayouts(), loadAdminAccess()])
                }}
              >
                <RefreshCcw data-icon="inline-start" />
                Refresh all
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleSignOut()} disabled={isSigningOut}>
                <LogOut data-icon="inline-start" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
          <Separator />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList
            className={cn(
              "grid h-auto w-full grid-cols-2 gap-2 p-2",
              canAccessAdminExport ? "md:grid-cols-5" : "md:grid-cols-4",
            )}
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            {canAccessAdminExport ? <TabsTrigger value="admin">Admin Export</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {isOverviewLoading ? (
              <div className="space-y-6">
                <Card className="border-border/60">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-lg border border-border/60 p-4">
                        <Skeleton className="mb-2 h-3 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="border-border/60">
                      <CardHeader className="pb-2">
                        <Skeleton className="mb-2 h-3 w-28" />
                        <Skeleton className="h-7 w-20" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ) : overviewError ? (
              <Card className="border-destructive/40 bg-card/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-destructive">Unable to load overview</CardTitle>
                  <CardDescription>{overviewError}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => void loadOverview()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : overview ? (
              <>
                <Card className="border-border/80 bg-card/70 backdrop-blur">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle>{overview.affiliate.displayName}</CardTitle>
                        <CardDescription>
                          Code: <span className="font-mono">{overview.affiliate.code}</span>
                        </CardDescription>
                      </div>
                      <Badge variant={affiliateStatusVariant(overview.affiliate.status)}>{overview.affiliate.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md border border-border/70 bg-background/40 p-3">
                      <p className="text-xs uppercase tracking-wide">Attribution Window</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {overview.affiliate.attributionWindowDays} days
                      </p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-background/40 p-3">
                      <p className="text-xs uppercase tracking-wide">Lander Rate</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {formatPercentFromBps(overview.affiliate.commissionBps.statxeo_lander)}
                      </p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-background/40 p-3">
                      <p className="text-xs uppercase tracking-wide">Core / Titan</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {formatPercentFromBps(overview.affiliate.commissionBps.statxeo_core)} / {" "}
                        {formatPercentFromBps(overview.affiliate.commissionBps.statxeo_titan)}
                      </p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-background/40 p-3">
                      <p className="text-xs uppercase tracking-wide">Boost Rate</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {formatPercentFromBps(overview.affiliate.commissionBps.boost)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription>Total links</CardDescription>
                      <Link2 className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{overview.stats.links.total}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription>Active links</CardDescription>
                      <Activity className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{overview.stats.links.active}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription>Paid conversions</CardDescription>
                      <CheckCircle2 className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{overview.stats.conversions.totalPaid}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription>Commission total</CardDescription>
                      <BarChart3 className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatCents(overview.stats.commissions.totalCents, "usd")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription>Commission pending</CardDescription>
                      <TrendingUp className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatCents(overview.stats.commissions.pendingCents, "usd")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription>Commission paid</CardDescription>
                      <Wallet className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatCents(overview.stats.commissions.paidCents, "usd")}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/80 bg-card/70 backdrop-blur lg:col-span-2">
                <CardHeader>
                  <CardTitle>Create affiliate link</CardTitle>
                  <CardDescription>Create evergreen or one-time links for campaigns.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleCreateLink}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="link-kind">Kind</Label>
                        <Select value={createKind} onValueChange={(value: "evergreen" | "one_time") => setCreateKind(value)}>
                          <SelectTrigger id="link-kind" className="w-full">
                            <SelectValue placeholder="Select kind" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="evergreen">Evergreen</SelectItem>
                            <SelectItem value="one_time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-path">Destination path</Label>
                        <Input
                          id="link-path"
                          value={createPath}
                          onChange={(event) => setCreatePath(event.target.value)}
                          placeholder="/"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-max-uses">Max uses (optional)</Label>
                        <Input
                          id="link-max-uses"
                          type="number"
                          min={1}
                          value={createMaxUses}
                          onChange={(event) => setCreateMaxUses(event.target.value)}
                          placeholder={createKind === "one_time" ? "1" : "Unlimited"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-expires">Expires at (optional)</Label>
                        <Input
                          id="link-expires"
                          type="datetime-local"
                          value={createExpiresAt}
                          onChange={(event) => setCreateExpiresAt(event.target.value)}
                        />
                      </div>
                    </div>

                    {createLinkError ? <p className="text-sm text-destructive">{createLinkError}</p> : null}
                    {linkActionMessage ? <p className="text-sm text-muted-foreground">{linkActionMessage}</p> : null}

                    <Button type="submit" disabled={isCreatingLink}>
                      {isCreatingLink ? <Spinner className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                      Create link
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border/80 bg-card/70 backdrop-blur">
                <CardHeader>
                  <CardTitle>Links health</CardTitle>
                  <CardDescription>Quick status snapshot from current link inventory.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-md border border-border/70 bg-background/40 p-3">
                    <span className="text-muted-foreground">Total links</span>
                    <span className="font-semibold">{links.length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/70 bg-background/40 p-3">
                    <span className="text-muted-foreground">Active links</span>
                    <span className="font-semibold">{links.filter(isLinkActive).length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/70 bg-background/40 p-3">
                    <span className="text-muted-foreground">One-time links</span>
                    <span className="font-semibold">{links.filter((row) => row.kind === "one_time").length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Affiliate links</CardTitle>
                    <CardDescription>Share URLs include your affiliate code and reference slug.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => void loadLinks()}>
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLinksLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="ml-auto h-8 w-16 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : linksError ? (
                  <p className="text-sm text-destructive">{linksError}</p>
                ) : links.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Link2 /></EmptyMedia>
                      <EmptyTitle>No affiliate links yet</EmptyTitle>
                      <EmptyDescription>Create your first affiliate link above to start tracking referrals.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Slug</TableHead>
                        <TableHead>Kind</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Share URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links.map((link) => {
                        const active = isLinkActive(link)
                        return (
                          <TableRow key={link.id}>
                            <TableCell className="font-mono text-xs">{link.slug}</TableCell>
                            <TableCell>{link.kind === "one_time" ? "One-time" : "Evergreen"}</TableCell>
                            <TableCell className="max-w-[220px] truncate">{link.destination_path || "/"}</TableCell>
                            <TableCell>
                              {typeof link.max_uses === "number" ? `${link.uses_count} / ${link.max_uses}` : `${link.uses_count} / ∞`}
                            </TableCell>
                            <TableCell>
                              <Badge variant={active ? "default" : "secondary"}>{active ? "active" : "inactive"}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(link.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void handleCopyShareUrl(link.shareUrl)}
                                  >
                                    <Copy data-icon="inline-start" />
                                    Copy
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs truncate font-mono text-xs">{link.shareUrl}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Commission ledger</CardTitle>
                    <CardDescription>Filter by status and paginate through commission records.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={ledgerStatusFilter}
                      onValueChange={(value: "all" | AffiliateCommissionStatus) => setLedgerStatusFilter(value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="reversed">Reversed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => void loadLedger()}>
                      <RefreshCcw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-border/70 bg-background/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                    <p className="mt-1 text-lg font-semibold">{formatCents(ledgerSummary.totalCents, "usd")}</p>
                  </div>
                  <div className="rounded-md border border-border/70 bg-background/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
                    <p className="mt-1 text-lg font-semibold">{formatCents(ledgerSummary.pendingCents, "usd")}</p>
                  </div>
                  <div className="rounded-md border border-border/70 bg-background/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid</p>
                    <p className="mt-1 text-lg font-semibold">{formatCents(ledgerSummary.paidCents, "usd")}</p>
                  </div>
                </div>

                {isLedgerLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="ml-auto h-5 w-14 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : ledgerError ? (
                  <p className="text-sm text-destructive">{ledgerError}</p>
                ) : ledgerRows.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><MousePointerClick /></EmptyMedia>
                      <EmptyTitle>No ledger entries</EmptyTitle>
                      <EmptyDescription>Commission records will appear here as conversions happen through your referral links.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Occurred</TableHead>
                          <TableHead>Package</TableHead>
                          <TableHead>Basis</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Paid At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledgerRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{formatDateTime(row.occurred_at)}</TableCell>
                            <TableCell>{row.package_tier || "—"}</TableCell>
                            <TableCell>{formatCents(row.commission_basis_cents, row.currency || "usd")}</TableCell>
                            <TableCell>{formatPercentFromBps(row.commission_bps)}</TableCell>
                            <TableCell className="font-medium">
                              {formatCents(row.amount_cents, row.currency || "usd")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={ledgerStatusVariant(row.status)}>{row.status}</Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(row.paid_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {ledgerHasMore ? (
                      <div className="flex justify-center pt-2">
                        <Button variant="outline" onClick={() => void handleLoadMoreLedger()} disabled={isLedgerLoadingMore}>
                          {isLedgerLoadingMore ? <Spinner className="h-4 w-4" /> : null}
                          Load more
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Payout history</CardTitle>
                    <CardDescription>Recent payout batches and export status.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => void loadPayouts()}>
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isPayoutsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="ml-auto h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : payoutsError ? (
                  <p className="text-sm text-muted-foreground">{payoutsError}</p>
                ) : payouts.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Wallet /></EmptyMedia>
                      <EmptyTitle>No payout batches yet</EmptyTitle>
                      <EmptyDescription>Payout batches will appear here once commissions are approved and batched for payment.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Your Total</TableHead>
                          <TableHead>Commissions</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Exported</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono text-xs">{row.id}</TableCell>
                            <TableCell>
                              {formatDate(row.period_start ?? null)} → {formatDate(row.period_end ?? null)}
                            </TableCell>
                            <TableCell>
                              {formatCents(
                                typeof row.affiliate_total_cents === "number" ? row.affiliate_total_cents : (row.total_cents ?? 0),
                                row.currency || "usd",
                              )}
                            </TableCell>
                            <TableCell>{row.affiliate_commission_count ?? "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{row.status}</Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(row.exported_at ?? row.created_at ?? null)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {payoutsHasMore ? (
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="outline"
                          onClick={() => void handleLoadMorePayouts()}
                          disabled={isPayoutsLoadingMore}
                        >
                          {isPayoutsLoadingMore ? <Spinner className="h-4 w-4" /> : null}
                          Load more
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {canAccessAdminExport ? (
          <TabsContent value="admin" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Admin payout export</CardTitle>
                <CardDescription>
                  Export monthly payout CSV through protected admin APIs. Requires admin permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:max-w-sm">
                  <Label htmlFor="payout-month">Payout month</Label>
                  <Input
                    id="payout-month"
                    type="month"
                    value={payoutMonth}
                    onChange={(event) => setPayoutMonth(event.target.value)}
                  />
                </div>

                {adminExportError ? <p className="text-sm text-destructive">{adminExportError}</p> : null}
                {adminExportSuccess ? <p className="text-sm text-muted-foreground">{adminExportSuccess}</p> : null}

                <Button onClick={() => void handleExportPayoutCsv()} disabled={isExporting}>
                  {isExporting ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4" />
                  Admin visibility
                </CardTitle>
                <CardDescription>
                  If you receive a permission error, your user is authenticated but not authorized for admin payout exports.
                </CardDescription>
              </CardHeader>
            </Card>
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </main>
  )
}
