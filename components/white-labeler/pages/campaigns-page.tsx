"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Megaphone,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Coins,
  ShieldCheck,
  User,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon
} from "lucide-react"
import { Avatar, Button as HeroButton, Card as HeroCard, Chip } from "@heroui/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  PortalActionButton,
  PortalHero,
  PortalStatCard,
  PortalSurfaceCard,
  PortalLoadingState,
  PortalErrorState,
  PortalEmptyState
} from "@/components/portal/portal-primitives"
import { PortalDataTable, type PortalTableColumn } from "@/components/portal/portal-data-table"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"

// Custom currency / number formatters
const formatDollars = (val: number) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0)
}

const formatPercent = (val: number) => {
  return `${((val || 0) * 100).toFixed(2)}%`
}

export function WhiteLabelerCampaignsPage() {
  const { clients, clientsLoading } = useWhiteLabelerPortal()

  const [campaigns, setCampaigns] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // New campaign form state
  const [campaignName, setCampaignName] = useState("")
  const [channel, setChannel] = useState<"meta" | "google">("meta")
  const [clientOrgId, setClientOrgId] = useState("")
  const [dailyBudget, setDailyBudget] = useState("100")
  const [totalAllocated, setTotalAllocated] = useState("1000")
  const [keywordsInput, setKeywordsInput] = useState("")
  
  // Creatives draft list in form
  const [formCreatives, setFormCreatives] = useState<Array<{
    type: "video" | "image"
    url: string
    headline: string
    description: string
  }>>([
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
      headline: "Grow Your Local Business",
      description: "Launch your custom designed website with real automation workflows today.",
    }
  ])

  // Fetch campaigns and audit history
  const fetchCampaigns = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch("/api/marketing/campaigns?audit=true")
      if (!res.ok) {
        throw new Error(`Failed to load campaigns: ${res.statusText}`)
      }
      const json = await res.json()
      setCampaigns(json.data || [])
      setAuditLogs(json.auditLogs || [])
    } catch (err: any) {
      console.error("Fetch campaigns error:", err)
      setError(err.message || "Failed to load marketing campaigns.")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Selected Campaign reference
  const selectedCampaign = useMemo(() => {
    return campaigns.find((c) => c._id === selectedCampaignId) || null
  }, [campaigns, selectedCampaignId])

  // Aggregate KPI metrics
  const kpis = useMemo(() => {
    const totalCount = campaigns.length
    const activeCount = campaigns.filter((c) => c.status === "active").length
    const totalDailyBudget = campaigns.reduce((acc, c) => acc + (c.budget?.dailyLimit || 0), 0)
    const totalSpend = campaigns.reduce((acc, c) => acc + (c.budget?.spendToDate || 0), 0)

    // Calculate average click-through rate across all active creatives
    const activeCreatives = campaigns
      .flatMap((c) => c.creatives || [])
      .filter((cr) => cr.status === "active")
    
    const avgCtr = activeCreatives.length
      ? activeCreatives.reduce((sum, cr) => sum + (cr.ctr || 0), 0) / activeCreatives.length
      : 0

    return {
      totalCount,
      activeCount,
      totalDailyBudget,
      totalSpend,
      avgCtr,
    }
  }, [campaigns])

  // Run AI Optimization cycle
  const handleRunOptimization = async () => {
    setOptimizing(true)
    const tId = toast.loading("Executing AI campaign optimization check...")
    try {
      const res = await fetch("/api/marketing/optimize", { method: "POST" })
      if (!res.ok) {
        throw new Error(`Optimization run failed: ${res.statusText}`)
      }
      const json = await res.json()
      if (json.success) {
        toast.success(`AI check complete! Processed ${json.optimizedCount} active campaigns.`, { id: tId })
        await fetchCampaigns(true)
      } else {
        toast.error("Optimization failed to complete.", { id: tId })
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to run automated budget/creative checks.", { id: tId })
    } finally {
      setOptimizing(false)
    }
  }

  // Create campaign submission
  const handleCreateCampaignDraft = async () => {
    if (!campaignName.trim()) {
      toast.error("Campaign name is required.")
      return
    }
    if (!clientOrgId) {
      toast.error("Please select a target client organization.")
      return
    }

    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: campaignName.trim(),
          channel,
          clientOrgId,
          dailyBudget: parseFloat(dailyBudget) || 0,
          totalAllocated: parseFloat(totalAllocated) || 0,
          keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
          creatives: formCreatives,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to submit campaign draft.")
      }

      toast.success(`Campaign "${campaignName}" drafted successfully (Pending approval).`)
      setDrawerOpen(false)
      
      // Reset form
      setCampaignName("")
      setClientOrgId("")
      setChannel("meta")
      setDailyBudget("100")
      setTotalAllocated("1000")
      setKeywordsInput("")
      setFormCreatives([
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
          headline: "Grow Your Local Business",
          description: "Launch your custom designed website with real automation workflows today.",
        }
      ])

      await fetchCampaigns()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to submit draft.")
    }
  }

  // Creatives helpers in drawer form
  const addFormCreative = () => {
    setFormCreatives([
      ...formCreatives,
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80",
        headline: "Premium Business Services",
        description: "Experience fully automated operations with XEO.",
      }
    ])
  }

  const removeFormCreative = (index: number) => {
    if (formCreatives.length <= 1) return
    setFormCreatives(formCreatives.filter((_, i) => i !== index))
  }

  const updateFormCreative = (index: number, key: string, value: string) => {
    const updated = [...formCreatives]
    updated[index] = { ...updated[index], [key]: value }
    setFormCreatives(updated)
  }

  // Define Columns for the campaigns table
  const campaignColumns = useMemo<PortalTableColumn<any>[]>(() => {
    return [
      {
        key: "campaignName",
        label: "Campaign Details",
        rowHeader: true,
        sortable: true,
        sortValue: (row) => row.campaignName,
        render: (row) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-900 dark:text-white">{row.campaignName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ID: <span className="font-mono">{row._id?.slice(-8) || "N/A"}</span>
            </p>
          </div>
        ),
      },
      {
        key: "channel",
        label: "Platform",
        sortable: true,
        sortValue: (row) => row.channel,
        render: (row) => (
          <Chip
            size="sm"
            variant="soft"
            color={row.channel === "meta" ? "accent" : "default"}
            className="font-semibold uppercase tracking-wider text-[11px]"
          >
            {row.channel === "meta" ? "Meta Ads" : "Google Ads"}
          </Chip>
        ),
      },
      {
        key: "budget",
        label: "Daily / Limit",
        sortable: true,
        sortValue: (row) => row.budget?.dailyLimit,
        render: (row) => (
          <div className="space-y-0.5 tabular-nums">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {formatDollars(row.budget?.dailyLimit)}/day
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Max: {formatDollars(row.budget?.totalAllocated)}
            </p>
          </div>
        ),
      },
      {
        key: "spendToDate",
        label: "Total Spend",
        sortable: true,
        sortValue: (row) => row.budget?.spendToDate,
        render: (row) => (
          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatDollars(row.budget?.spendToDate)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        sortValue: (row) => row.status,
        render: (row) => {
          let color: "default" | "success" | "warning" | "danger" = "default"
          if (row.status === "active") color = "success"
          if (row.status === "paused") color = "warning"
          if (row.status === "pending_approval") color = "default"
          if (row.status === "failed") color = "danger"

          const statusLabels: Record<string, string> = {
            active: "Active",
            paused: "Paused",
            pending_approval: "Pending Approval",
            failed: "Failed",
          }

          return (
            <Chip size="sm" variant="soft" color={color}>
              {statusLabels[row.status] || row.status}
            </Chip>
          )
        },
      },
      {
        key: "actions",
        label: "Asset Review",
        className: "text-right",
        headerClassName: "text-right",
        render: (row) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant={selectedCampaignId === row._id ? "default" : "outline"}
              size="sm"
              className="h-9 px-3 rounded-xl font-semibold shadow-sm"
              onClick={() => setSelectedCampaignId(selectedCampaignId === row._id ? null : row._id)}
            >
              View Assets
            </Button>
          </div>
        ),
      },
    ]
  }, [selectedCampaignId])

  // Render main page
  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Advertising Workspace"
        initials="AD"
        title="Campaigns Dashboard"
        description="Monitor multi-channel digital ad spend and manage creative assets. Automated AI loops analyze performance history hourly to detect ad fatigue and reallocate budgets."
        status={
          <Chip size="sm" variant="soft" color={kpis.activeCount > 0 ? "success" : "warning"}>
            {kpis.activeCount > 0 ? `${kpis.activeCount} Live Campaigns` : "No Active Campaigns"}
          </Chip>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PortalActionButton
              variant="outline"
              className="bg-white/10 dark:bg-white/5 border-slate-200/80 dark:border-white/10 dark:text-white"
              onClick={handleRunOptimization}
              isDisabled={optimizing}
            >
              <RefreshCw className={`size-4 mr-2 ${optimizing ? "animate-spin" : ""}`} />
              Run AI Optimization
            </PortalActionButton>
            <PortalActionButton onPress={() => setDrawerOpen(true)}>
              <Plus className="size-4 mr-2" />
              Draft Campaign
            </PortalActionButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard
          label="Total Ad Budget"
          value={formatDollars(kpis.totalDailyBudget) + " / day"}
          meta="Cumulative budget limit"
        />
        <PortalStatCard
          label="Total Spend to Date"
          value={formatDollars(kpis.totalSpend)}
          meta="Combined Meta & Google spend"
        />
        <PortalStatCard
          label="Avg Active CTR"
          value={formatPercent(kpis.avgCtr)}
          meta="Across all live ad creatives"
        />
        <PortalStatCard
          label="Tracked Campaigns"
          value={String(kpis.totalCount)}
          meta={`${kpis.activeCount} active, ${kpis.totalCount - kpis.activeCount} offline`}
        />
      </div>

      {/* Main campaigns table */}
      {loading ? (
        <PortalLoadingState label="Loading ad campaigns from Atlas..." />
      ) : error ? (
        <PortalErrorState
          title="Campaigns load failure"
          message={error}
          action={
            <Button variant="outline" onClick={() => fetchCampaigns()}>
              Retry
            </Button>
          }
        />
      ) : campaigns.length === 0 ? (
        <PortalEmptyState
          title="No campaigns configured"
          description="Create your first marketing campaign draft with custom copy and creatives to start tracking performance."
          action={
            <PortalActionButton onPress={() => setDrawerOpen(true)}>
              <Plus className="size-4 mr-2" />
              Draft Campaign
            </PortalActionButton>
          }
        />
      ) : (
        <PortalDataTable
          title="Marketing Campaigns"
          description="Live and drafted advertising programs managed through the StatXEO engine."
          rows={campaigns}
          columns={campaignColumns}
          getRowId={(row) => row._id}
          searchPlaceholder="Search campaigns..."
          searchMatcher={(row, query) =>
            row.campaignName.toLowerCase().includes(query) ||
            row.channel.toLowerCase().includes(query)
          }
          emptyTitle="No campaigns matching search"
          emptyDescription="Try adjusting your filter terms."
        />
      )}

      {/* Selected Campaign Creatives Detail Grid */}
      {selectedCampaign ? (
        <PortalSurfaceCard
          title={`Ad Creatives: ${selectedCampaign.campaignName}`}
          description={`Creative performance metrics and AI Fatigue checks for this campaign.`}
        >
          <div className="space-y-6">
            {selectedCampaign.creatives?.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                No creatives registered for this campaign.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {selectedCampaign.creatives.map((creative: any, idx: number) => {
                  const isFatiguePaused =
                    selectedCampaign.status === "active" &&
                    creative.status === "paused" &&
                    creative.ctr < 0.015

                  return (
                    <div
                      key={idx}
                      className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                    >
                      {/* Badge and Media Type */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-1.5">
                          {creative.type === "video" ? (
                            <VideoIcon className="size-4 text-indigo-500" />
                          ) : (
                            <ImageIcon className="size-4 text-sky-500" />
                          )}
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {creative.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isFatiguePaused ? (
                            <Chip size="sm" variant="soft" color="danger" className="animate-pulse">
                              <Flame className="size-3 mr-1 inline" /> AI Paused (Fatigue)
                            </Chip>
                          ) : null}
                          <Chip
                            size="sm"
                            variant="soft"
                            color={creative.status === "active" ? "success" : "default"}
                            className="capitalize"
                          >
                            {creative.status}
                          </Chip>
                        </div>
                      </div>

                      {/* Creative Details */}
                      <div className="space-y-1.5 mb-4">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {creative.headline}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {creative.description}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                          Media URL:{" "}
                          <a
                            href={creative.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline"
                          >
                            {creative.url}
                          </a>
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60 dark:border-white/10 text-center">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Spend
                          </p>
                          <p className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">
                            {formatDollars(creative.spend)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            CTR
                          </p>
                          <p className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">
                            {formatPercent(creative.ctr)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Conv. Rate
                          </p>
                          <p className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">
                            {formatPercent(creative.conversionRate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </PortalSurfaceCard>
      ) : null}

      {/* AI Optimization Audit Logs */}
      {!loading && (
        <PortalSurfaceCard
          title="Optimization History & Audit Logs"
          description="Detailed logs tracking AI recommendations, budget shift calculations, and manual actions."
        >
          {auditLogs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
              No audit logs recorded yet. Run optimization loops to populate history.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/5">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10">
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Timestamp
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Actor
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Action
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                  {auditLogs.flatMap((exec) =>
                    (exec.auditLogs || []).map((log: any, lIdx: number) => {
                      let actorColor: "default" | "success" | "warning" | "accent" = "default"
                      if (log.actor === "ai") actorColor = "warning"
                      if (log.actor === "user") actorColor = "accent"
                      if (log.actor === "system") actorColor = "default"

                      return (
                        <tr key={`${exec._id}-${lIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <Chip size="sm" variant="soft" color={actorColor} className="uppercase text-[10px] font-bold">
                              {log.actor}
                            </Chip>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {log.action}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 max-w-md">
                            {log.description}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </PortalSurfaceCard>
      )}

      {/* Draft Campaign Drawer Sheet */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="pb-4 border-b border-slate-200/80 dark:border-white/10">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Megaphone className="size-5 text-indigo-500" />
              Draft Advertising Campaign
            </SheetTitle>
            <SheetDescription>
              Draft details for a new Meta or Google campaign. Campaigns initialize as `pending_approval` for review.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 px-1">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="c-name" className="text-sm font-semibold">Campaign Name</Label>
                <Input
                  id="c-name"
                  placeholder="e.g. Dallas Roofing Lead Generation"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Channel Platform</Label>
                  <Select
                    value={channel}
                    onValueChange={(v: "meta" | "google") => setChannel(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meta">Meta Ads (Facebook / Instagram)</SelectItem>
                      <SelectItem value="google">Google Ads (Search / Display)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Client Account Organization</Label>
                  <Select
                    value={clientOrgId}
                    onValueChange={setClientOrgId}
                    disabled={clientsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={clientsLoading ? "Loading roster..." : "Select client"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Budget Settings */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-daily" className="text-sm font-semibold">Daily Budget ($)</Label>
                  <Input
                    id="c-daily"
                    type="number"
                    inputMode="decimal"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c-total" className="text-sm font-semibold">Total Allocated ($)</Label>
                  <Input
                    id="c-total"
                    type="number"
                    inputMode="decimal"
                    value={totalAllocated}
                    onChange={(e) => setTotalAllocated(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-keywords" className="text-sm font-semibold">Keywords / Ad Groups</Label>
                <Input
                  id="c-keywords"
                  placeholder="e.g. roofing contractor, roof repair, local builder (comma separated)"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                />
              </div>
            </div>

            {/* Creative List Builder */}
            <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-white/10">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold text-slate-900 dark:text-white">Ad Creative Asset Variants</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFormCreative}
                  className="rounded-xl h-8 text-xs font-semibold gap-1.5"
                >
                  <Plus className="size-3" /> Add Creative
                </Button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {formCreatives.map((cr, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-3 relative bg-slate-50/30 dark:bg-white/2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-indigo-500">Variant #{idx + 1}</span>
                      {formCreatives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFormCreative(idx)}
                          className="text-rose-500 hover:text-rose-600 transition-colors"
                          aria-label="Remove creative variant"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold">Media Type</Label>
                        <Select
                          value={cr.type}
                          onValueChange={(v: "video" | "image") => updateFormCreative(idx, "type", v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image Asset</SelectItem>
                            <SelectItem value="video">Video Asset</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold">Media File URL</Label>
                        <Input
                          value={cr.url}
                          onChange={(e) => updateFormCreative(idx, "url", e.target.value)}
                          placeholder="https://..."
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold">Ad Headline</Label>
                      <Input
                        value={cr.headline}
                        onChange={(e) => updateFormCreative(idx, "headline", e.target.value)}
                        placeholder="Premium service in your area"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold">Ad Description Body</Label>
                      <Input
                        value={cr.description}
                        onChange={(e) => updateFormCreative(idx, "description", e.target.value)}
                        placeholder="Sign up for our limited promotion today..."
                        className="h-9"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateCampaignDraft} className="gap-1.5">
                <Plus className="size-4" /> Save Campaign Draft
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
