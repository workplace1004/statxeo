"use client"

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
import { Chip, SearchField, Tabs } from "@heroui/react"

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
import {
  PortalActionButton,
  PortalEmptyState,
  PortalErrorState,
  PortalHero,
  PortalShell,
  PortalStatCard,
} from "@/components/portal/portal-primitives"
import { PortalDataTable } from "@/components/portal/portal-data-table"
import { PortalModal } from "@/components/portal/portal-modal"
import StaggeredText from "@/components/react-bits/staggered-text"
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
  const [linkSearch, setLinkSearch] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

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
        setIsCreateModalOpen(false)
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
      setIsExportModalOpen(false)
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
    <PortalShell>
      {sessionActionError ? <PortalErrorState title="Session action failed" message={sessionActionError} /> : null}

      <PortalHero
        eyebrow="Affiliate Portal"
        initials="AF"
        title={
          <StaggeredText
            as="span"
            text={overview?.affiliate.displayName ? `Welcome back, ${overview.affiliate.displayName}` : "Grow with Statxeo"}
            className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white"
            segmentBy="words"
            delay={36}
            duration={0.42}
            staggerDirection="forward"
            direction="bottom"
          />
        }
        description="Manage referral links, conversion flow, and payouts from the same revenue workspace. React Bits is used only as a headline accent here; commission and export behavior are unchanged."
        status={
          overview ? (
            <Chip size="sm" variant="soft" color={overview.affiliate.status === "active" ? "success" : overview.affiliate.status === "pending" ? "warning" : "danger"}>
              {overview.affiliate.status}
            </Chip>
          ) : null
        }
        actions={(
          <>
            <PortalActionButton variant="outline" onPress={() => router.push("/affiliate/help")}>
              Help center
            </PortalActionButton>
            <PortalActionButton
              variant="outline"
              onPress={() => {
                void Promise.all([loadOverview(), loadLinks(), loadLedger(), loadPayouts(), loadAdminAccess()])
              }}
            >
              <RefreshCcw className="size-4" />
              Refresh all
            </PortalActionButton>
            <PortalActionButton variant="danger-soft" onPress={() => void handleSignOut()} isDisabled={isSigningOut}>
              <LogOut className="size-4" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </PortalActionButton>
          </>
        )}
      />

      {overview ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PortalStatCard label="Active links" value={String(overview.stats.links.active)} meta={`${overview.stats.links.total} total links`} />
          <PortalStatCard label="Paid conversions" value={String(overview.stats.conversions.totalPaid)} meta="Attributed and completed" />
          <PortalStatCard label="Pending commission" value={formatCents(overview.stats.commissions.pendingCents, "usd")} meta="Awaiting payout batch" />
          <PortalStatCard label="Paid commission" value={formatCents(overview.stats.commissions.paidCents, "usd")} meta="Settled earnings" />
        </div>
      ) : null}

      <div className="space-y-4">
        <Tabs.Root selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))}>
          <Tabs.List
            className={cn(
              "grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-slate-100/90 p-2 dark:bg-white/5",
              canAccessAdminExport ? "md:grid-cols-5" : "md:grid-cols-4",
            )}
          >
            <Tabs.Tab id="overview">Overview</Tabs.Tab>
            <Tabs.Tab id="links">Links</Tabs.Tab>
            <Tabs.Tab id="ledger">Ledger</Tabs.Tab>
            <Tabs.Tab id="payouts">Payouts</Tabs.Tab>
            {canAccessAdminExport ? <Tabs.Tab id="admin">Admin Export</Tabs.Tab> : null}
          </Tabs.List>

          <div className="mt-6">
          <Tabs.Panel id="overview" className="space-y-6">
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
          </Tabs.Panel>

          <Tabs.Panel id="links" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/80 bg-card/70 backdrop-blur lg:col-span-2">
                <CardHeader>
                  <CardTitle>Create affiliate link</CardTitle>
                  <CardDescription>Create evergreen or one-time links for campaigns using the shared command flow.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Open the shared command modal to create evergreen or one-time links without leaving the revenue workspace.
                    </p>
                    {createLinkError ? <p className="text-sm text-destructive">{createLinkError}</p> : null}
                    {linkActionMessage ? <p className="text-sm text-muted-foreground">{linkActionMessage}</p> : null}
                    <PortalActionButton variant="primary" onPress={() => setIsCreateModalOpen(true)}>
                      <Link2 className="size-4" />
                      New affiliate link
                    </PortalActionButton>
                  </div>
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

            <PortalDataTable
              title="Affiliate links"
              description="Share URLs include your affiliate code and reference slug."
              rows={links}
              getRowId={(row) => row.id}
              columns={[
                {
                  key: "slug",
                  label: "Slug",
                  sortable: true,
                  sortValue: (row) => row.slug,
                  render: (row) => <span className="font-mono text-xs">{row.slug}</span>,
                },
                {
                  key: "kind",
                  label: "Kind",
                  sortable: true,
                  sortValue: (row) => row.kind,
                  render: (row) => (row.kind === "one_time" ? "One-time" : "Evergreen"),
                },
                {
                  key: "destination",
                  label: "Destination",
                  sortable: true,
                  sortValue: (row) => row.destination_path,
                  render: (row) => <span className="max-w-[220px] truncate">{row.destination_path || "/"}</span>,
                },
                {
                  key: "usage",
                  label: "Usage",
                  sortable: true,
                  sortValue: (row) => row.uses_count,
                  render: (row) => (typeof row.max_uses === "number" ? `${row.uses_count} / ${row.max_uses}` : `${row.uses_count} / ∞`),
                },
                {
                  key: "status",
                  label: "Status",
                  sortable: true,
                  sortValue: (row) => (isLinkActive(row) ? "active" : "inactive"),
                  render: (row) => {
                    const active = isLinkActive(row)
                    return <Badge variant={active ? "default" : "secondary"}>{active ? "active" : "inactive"}</Badge>
                  },
                },
                {
                  key: "created",
                  label: "Created",
                  sortable: true,
                  sortValue: (row) => row.created_at,
                  render: (row) => formatDate(row.created_at),
                },
                {
                  key: "share",
                  label: "Share URL",
                  render: (row) => (
                    <div className="flex justify-end">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyShareUrl(row.shareUrl)}>
                            <Copy data-icon="inline-start" />
                            Copy
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs truncate font-mono text-xs">{row.shareUrl}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ),
                },
              ]}
              loading={isLinksLoading}
              loadingLabel="Loading affiliate links..."
              error={linksError}
              searchPlaceholder="Search links by slug or destination"
              searchValue={linkSearch}
              onSearchValueChange={setLinkSearch}
              searchMatcher={(row, query) => [row.slug, row.kind, row.destination_path, row.shareUrl].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))}
              actions={<Button variant="outline" onClick={() => void loadLinks()}><RefreshCcw className="h-4 w-4" />Refresh</Button>}
              emptyTitle="No affiliate links yet"
              emptyDescription="Create your first affiliate link above to start tracking referrals."
              filteredEmptyTitle="No matching affiliate links"
              filteredEmptyDescription="Try a different link search term."
            />
          </Tabs.Panel>

          <Tabs.Panel id="ledger" className="space-y-6">
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

                <PortalDataTable
                  title="Commission ledger"
                  description="Filter by status and paginate through commission records."
                  rows={ledgerRows}
                  getRowId={(row) => row.id}
                  columns={[
                    { key: "occurred", label: "Occurred", sortable: true, sortValue: (row) => row.occurred_at, render: (row) => formatDateTime(row.occurred_at) },
                    { key: "package", label: "Package", sortable: true, sortValue: (row) => row.package_tier, render: (row) => row.package_tier || "—" },
                    { key: "basis", label: "Basis", sortable: true, sortValue: (row) => row.commission_basis_cents, render: (row) => formatCents(row.commission_basis_cents, row.currency || "usd") },
                    { key: "rate", label: "Rate", sortable: true, sortValue: (row) => row.commission_bps, render: (row) => formatPercentFromBps(row.commission_bps) },
                    { key: "commission", label: "Commission", sortable: true, sortValue: (row) => row.amount_cents, render: (row) => <span className="font-medium">{formatCents(row.amount_cents, row.currency || "usd")}</span> },
                    { key: "status", label: "Status", sortable: true, sortValue: (row) => row.status, render: (row) => <Badge variant={ledgerStatusVariant(row.status)}>{row.status}</Badge> },
                    { key: "paid", label: "Paid At", sortable: true, sortValue: (row) => row.paid_at, render: (row) => formatDateTime(row.paid_at) },
                  ]}
                  loading={isLedgerLoading}
                  loadingLabel="Loading affiliate ledger..."
                  error={ledgerError}
                  actions={ledgerHasMore ? (
                    <Button variant="outline" onClick={() => void handleLoadMoreLedger()} disabled={isLedgerLoadingMore}>
                      {isLedgerLoadingMore ? <Spinner className="h-4 w-4" /> : null}
                      Load more
                    </Button>
                  ) : undefined}
                  emptyTitle="No ledger entries"
                  emptyDescription="Commission records will appear here as conversions happen through your referral links."
                />
              </CardContent>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel id="payouts" className="space-y-6">
            <PortalDataTable
              title="Payout history"
              description="Recent payout batches and export status."
              rows={payouts}
              getRowId={(row) => row.id}
              columns={[
                { key: "batch", label: "Batch", sortable: true, sortValue: (row) => row.id, render: (row) => <span className="font-mono text-xs">{row.id}</span> },
                { key: "period", label: "Period", sortable: true, sortValue: (row) => row.period_start ?? row.created_at, render: (row) => `${formatDate(row.period_start ?? null)} → ${formatDate(row.period_end ?? null)}` },
                { key: "total", label: "Your Total", sortable: true, sortValue: (row) => typeof row.affiliate_total_cents === "number" ? row.affiliate_total_cents : (row.total_cents ?? 0), render: (row) => formatCents(typeof row.affiliate_total_cents === "number" ? row.affiliate_total_cents : (row.total_cents ?? 0), row.currency || "usd") },
                { key: "commissions", label: "Commissions", sortable: true, sortValue: (row) => row.affiliate_commission_count ?? 0, render: (row) => row.affiliate_commission_count ?? "—" },
                { key: "status", label: "Status", sortable: true, sortValue: (row) => row.status, render: (row) => <Badge variant="secondary">{row.status}</Badge> },
                { key: "exported", label: "Exported", sortable: true, sortValue: (row) => row.exported_at ?? row.created_at, render: (row) => formatDateTime(row.exported_at ?? row.created_at ?? null) },
              ]}
              loading={isPayoutsLoading}
              loadingLabel="Loading payout history..."
              error={payoutsError}
              actions={
                <>
                  <Button variant="outline" onClick={() => void loadPayouts()}>
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                  </Button>
                  {canAccessAdminExport ? (
                    <PortalActionButton variant="outline" onPress={() => setIsExportModalOpen(true)}>
                      <Download className="size-4" />
                      Export CSV
                    </PortalActionButton>
                  ) : null}
                  {payoutsHasMore ? (
                    <Button variant="outline" onClick={() => void handleLoadMorePayouts()} disabled={isPayoutsLoadingMore}>
                      {isPayoutsLoadingMore ? <Spinner className="h-4 w-4" /> : null}
                      Load more
                    </Button>
                  ) : null}
                </>
              }
              emptyTitle="No payout batches yet"
              emptyDescription="Payout batches will appear here once commissions are approved and batched for payment."
            />
          </Tabs.Panel>

          {canAccessAdminExport ? (
          <Tabs.Panel id="admin" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Admin payout export</CardTitle>
                <CardDescription>
                  Export monthly payout CSV through protected admin APIs. Requires admin permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {adminExportError ? <p className="text-sm text-destructive">{adminExportError}</p> : null}
                {adminExportSuccess ? <p className="text-sm text-muted-foreground">{adminExportSuccess}</p> : null}
                <PortalActionButton variant="primary" onPress={() => setIsExportModalOpen(true)}>
                  <Download className="size-4" />
                  Open export command
                </PortalActionButton>
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
            </Tabs.Panel>
          ) : null}
          </div>
        </Tabs.Root>
      </div>

      <PortalModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Create affiliate link"
        description="Use the shared command modal to create evergreen or one-time referral links."
        footer={
          <>
            <PortalActionButton variant="outline" onPress={() => setIsCreateModalOpen(false)}>
              Cancel
            </PortalActionButton>
            <Button type="submit" form="affiliate-link-form" disabled={isCreatingLink}>
              {isCreatingLink ? <Spinner className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              Create link
            </Button>
          </>
        }
      >
        <form id="affiliate-link-form" className="space-y-4" onSubmit={handleCreateLink}>
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
              <Input id="link-path" value={createPath} onChange={(event) => setCreatePath(event.target.value)} placeholder="/" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-max-uses">Max uses (optional)</Label>
              <Input id="link-max-uses" type="number" min={1} value={createMaxUses} onChange={(event) => setCreateMaxUses(event.target.value)} placeholder={createKind === "one_time" ? "1" : "Unlimited"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-expires">Expires at (optional)</Label>
              <Input id="link-expires" type="datetime-local" value={createExpiresAt} onChange={(event) => setCreateExpiresAt(event.target.value)} />
            </div>
          </div>
          {createLinkError ? <p className="text-sm text-destructive">{createLinkError}</p> : null}
        </form>
      </PortalModal>

      <PortalModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        title="Export payout CSV"
        description="Launch a protected monthly export through the shared command modal."
        footer={
          <>
            <PortalActionButton variant="outline" onPress={() => setIsExportModalOpen(false)}>
              Cancel
            </PortalActionButton>
            <Button onClick={() => void handleExportPayoutCsv()} disabled={isExporting}>
              {isExporting ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              Export CSV
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:max-w-sm">
            <Label htmlFor="payout-month">Payout month</Label>
            <Input id="payout-month" type="month" value={payoutMonth} onChange={(event) => setPayoutMonth(event.target.value)} />
          </div>
          {adminExportError ? <p className="text-sm text-destructive">{adminExportError}</p> : null}
          {adminExportSuccess ? <p className="text-sm text-muted-foreground">{adminExportSuccess}</p> : null}
        </div>
      </PortalModal>
    </PortalShell>
  )
}
