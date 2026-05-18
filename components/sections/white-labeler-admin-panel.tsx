"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardList, Rocket, ShieldCheck, Sparkles, Users2, Wallet } from "lucide-react"
import { Chip } from "@heroui/react"

import { PortalDataTable } from "@/components/portal/portal-data-table"
import {
  EmbeddedPortalShell,
  PortalActionButton,
  PortalErrorState,
  PortalHero,
  PortalLoadingState,
  PortalStatCard,
  PortalSurfaceCard,
} from "@/components/portal/portal-primitives"
import DepthCard from "@/components/react-bits/depth-card"
import StaggeredText from "@/components/react-bits/staggered-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import {
  WhiteLabelerApiError,
  fetchWhiteLabelerClients,
  fetchWhiteLabelerDemoSeedAccess,
  fetchWhiteLabelerDemoSeedRuns,
  fetchWhiteLabelerOverview,
  fetchWhiteLabelerPayouts,
  fetchWhiteLabelerPricing,
  fetchWhiteLabelerTeam,
  seedDemoWhiteLabeler,
  type WhiteLabelerDemoSeedRun,
  type SeedDemoWhiteLabelerResponse,
  type WhiteLabelerClient,
  type WhiteLabelerDemoSeedAccessResponse,
  type WhiteLabelerOverviewResponse,
  type WhiteLabelerPayoutBatch,
  type WhiteLabelerPlanOverride,
  type WhiteLabelerTeamMember,
} from "@/lib/statxeo/white-labeler-client"
import { cn } from "@/lib/utils"

type WhiteLabelerAdminPanelSectionProps = {
  role: "owner" | "admin"
}

type SeedFormState = {
  displayName: string
  slug: string
  ownerEmail: string
  ownerPassword: string
  planCode: string
  createSampleData: boolean
}

function describeError(error: unknown, fallback: string) {
  if (error instanceof WhiteLabelerApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return "-"
  return new Date(parsed).toLocaleDateString()
}

function formatCents(value: number, currency = "usd") {
  const normalizedCurrency = /^[a-z]{3}$/i.test(currency) ? currency.toUpperCase() : "USD"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
  }).format((Number(value || 0) || 0) / 100)
}

export function WhiteLabelerAdminPanelSection({ role }: WhiteLabelerAdminPanelSectionProps) {
  const router = useRouter()

  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState("")

  const [overview, setOverview] = useState<WhiteLabelerOverviewResponse | null>(null)
  const [clients, setClients] = useState<WhiteLabelerClient[]>([])
  const [pricing, setPricing] = useState<WhiteLabelerPlanOverride[]>([])
  const [payouts, setPayouts] = useState<WhiteLabelerPayoutBatch[]>([])
  const [team, setTeam] = useState<WhiteLabelerTeamMember[]>([])

  const [seedAccess, setSeedAccess] = useState<WhiteLabelerDemoSeedAccessResponse | null>(null)
  const [seedAccessLoading, setSeedAccessLoading] = useState(true)
  const [seedAccessError, setSeedAccessError] = useState("")
  const [seedRuns, setSeedRuns] = useState<WhiteLabelerDemoSeedRun[]>([])
  const [seedRunsLoading, setSeedRunsLoading] = useState(true)
  const [seedRunsError, setSeedRunsError] = useState("")

  const [seedForm, setSeedForm] = useState<SeedFormState>({
    displayName: "STATXEO Demo White Labeler",
    slug: "statxeo-demo-white-labeler",
    ownerEmail: "white-labeler-demo-owner@statxt.com",
    // Must match `WHITE_LABELER_DEMO_LOGIN_PASSWORD` in `lib/statxeo/white-labeler-demo-auth.ts` for demo portal sign-in.
    ownerPassword: "StatxeoWlDemoPortal2026!",
    planCode: "statxeo_core",
    createSampleData: true,
  })
  const [seedMutationError, setSeedMutationError] = useState("")
  const [seedMutationSuccess, setSeedMutationSuccess] = useState("")
  const [seedResult, setSeedResult] = useState<SeedDemoWhiteLabelerResponse["seed"] | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSeedingDemo, setIsSeedingDemo] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [pricingSearch, setPricingSearch] = useState("")
  const [seedRunSearch, setSeedRunSearch] = useState("")

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true)
    setDashboardError("")

    try {
      const [overviewData, clientsData, pricingData, payoutsData, teamData] = await Promise.all([
        fetchWhiteLabelerOverview(),
        fetchWhiteLabelerClients({ limit: 8 }),
        fetchWhiteLabelerPricing(),
        fetchWhiteLabelerPayouts({ limit: 8 }),
        fetchWhiteLabelerTeam(),
      ])

      setOverview(overviewData)
      setClients(Array.isArray(clientsData.clients) ? clientsData.clients : [])
      setPricing(Array.isArray(pricingData.plans) ? pricingData.plans : [])
      setPayouts(Array.isArray(payoutsData.payouts) ? payoutsData.payouts : [])
      setTeam(Array.isArray(teamData.members) ? teamData.members : [])
    } catch (error) {
      setOverview(null)
      setClients([])
      setPricing([])
      setPayouts([])
      setTeam([])
      setDashboardError(describeError(error, "Unable to load white-label admin dashboard."))
    } finally {
      setDashboardLoading(false)
    }
  }, [])

  const loadSeedAccess = useCallback(async () => {
    setSeedAccessLoading(true)
    setSeedAccessError("")

    try {
      const access = await fetchWhiteLabelerDemoSeedAccess()
      setSeedAccess(access)
    } catch (error) {
      setSeedAccess(null)
      setSeedAccessError(
        describeError(error, "You are signed in as tenant admin, but platform demo seeding access was denied."),
      )
    } finally {
      setSeedAccessLoading(false)
    }
  }, [])

  const loadSeedRuns = useCallback(async () => {
    setSeedRunsLoading(true)
    setSeedRunsError("")

    try {
      const data = await fetchWhiteLabelerDemoSeedRuns()
      setSeedRuns(Array.isArray(data.runs) ? data.runs : [])
    } catch (error) {
      setSeedRuns([])
      setSeedRunsError(describeError(error, "Unable to load demo seed run history."))
    } finally {
      setSeedRunsLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.all([loadDashboard(), loadSeedAccess(), loadSeedRuns()])
  }, [loadDashboard, loadSeedAccess, loadSeedRuns])

  const accountCurrency = useMemo(() => overview?.account.currency ?? "usd", [overview])

  const activePayoutDrafts = useMemo(() => payouts.filter((row) => row.status === "draft").length, [payouts])
  const activeTeamMembers = useMemo(() => team.filter((row) => row.is_active).length, [team])
  const activePricingOverrides = useMemo(() => pricing.filter((row) => row.is_active).length, [pricing])

  const canSeedDemo = Boolean(seedAccess?.can_seed_demo_white_labeler && seedAccess?.seed_demo_enabled !== false)

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      await Promise.all([loadDashboard(), loadSeedAccess(), loadSeedRuns()])
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSeedDemo = async () => {
    const displayName = seedForm.displayName.trim()
    const ownerEmail = seedForm.ownerEmail.trim()

    if (!displayName) {
      setSeedMutationError("Display name is required.")
      return
    }

    if (!ownerEmail || !ownerEmail.includes("@")) {
      setSeedMutationError("Owner email must be a valid email address.")
      return
    }

    setSeedMutationError("")
    setSeedMutationSuccess("")
    setIsSeedingDemo(true)

    try {
      const response = await seedDemoWhiteLabeler({
        display_name: displayName,
        slug: seedForm.slug.trim() || undefined,
        owner_email: ownerEmail,
        owner_password: seedForm.ownerPassword.trim() || undefined,
        plan_code: seedForm.planCode.trim() || undefined,
        create_sample_data: seedForm.createSampleData,
      })

      setSeedResult(response.seed)
      setSeedMutationSuccess(response.message)
      await Promise.all([loadDashboard(), loadSeedRuns()])
    } catch (error) {
      setSeedMutationError(describeError(error, "Unable to seed demo white-labeler account."))
    } finally {
      setIsSeedingDemo(false)
    }
  }

  return (
    <EmbeddedPortalShell className="relative max-w-6xl overflow-hidden rounded-[20px] border border-white/8 bg-[radial-gradient(circle_at_top_right,_rgba(15,118,110,0.10),_transparent_48%),radial-gradient(circle_at_bottom_left,_rgba(202,138,4,0.08),_transparent_44%)]">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-20 left-8 h-56 w-56 rounded-full bg-teal-300/25 blur-3xl dark:bg-teal-400/20" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-400/20" />
      </div>

      <div className="relative space-y-6">
        <PortalHero
          eyebrow="Admin Workspace"
          initials="WA"
          title={
            <StaggeredText
              text="White-Label Command Console"
              as="span"
              className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white"
              segmentBy="words"
              delay={45}
              duration={0.38}
              direction="top"
            />
          }
          description="Role-safeguarded operations for owner/admin workflows, plus platform-level demo seeding for staging and production-ready preview environments."
          status={<Chip size="sm" variant="soft" color="accent">{role}</Chip>}
          actions={
            <>
              <PortalActionButton variant="outline" onPress={() => router.push("/white-labeler")}>
                Open tenant portal
              </PortalActionButton>
              {seedAccess?.actor_user_id ? (
                <PortalActionButton variant="outline" onPress={() => router.push("/white-labeler/admin/applications")}>
                  <ClipboardList className="size-4" />
                  Partner applications
                </PortalActionButton>
              ) : null}
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PortalStatCard label="Access role" value={role} meta="Tenant admin scope" />
          <PortalStatCard label="Active team members" value={String(activeTeamMembers)} meta="Enabled collaborators" />
          <PortalStatCard label="Active price overrides" value={String(activePricingOverrides)} meta="Monetization rules in force" />
          <PortalStatCard label="Draft payout batches" value={String(activePayoutDrafts)} meta="Unfinalized settlements" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <DepthCard
            width="100%"
            height={220}
            className="w-full"
            disableOnMobile
            respectReducedMotion
            spotlight
            spotlightColor="rgba(45,212,191,0.34)"
            contentClassName="p-5"
          >
            <div className="flex h-full flex-col justify-between rounded-xl border border-white/25 bg-gradient-to-br from-teal-700/85 via-teal-600/75 to-slate-900/80 p-5 text-white">
              <ShieldCheck className="h-7 w-7" />
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-teal-100">Security posture</p>
                <p className="mt-1 text-xl font-semibold">Owner/Admin tenant guard active</p>
              </div>
            </div>
          </DepthCard>
          <DepthCard
            width="100%"
            height={220}
            className="w-full"
            disableOnMobile
            respectReducedMotion
            spotlight
            spotlightColor="rgba(202,138,4,0.33)"
            contentClassName="p-5"
          >
            <div className="flex h-full flex-col justify-between rounded-xl border border-white/25 bg-gradient-to-br from-amber-600/85 via-amber-500/75 to-orange-900/80 p-5 text-white">
              <Wallet className="h-7 w-7" />
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-amber-100">Current month payout</p>
                <p className="mt-1 text-xl font-semibold">
                  {formatCents(overview?.kpis.monthNetPayoutCents ?? 0, accountCurrency)}
                </p>
              </div>
            </div>
          </DepthCard>
          <DepthCard
            width="100%"
            height={220}
            className="w-full"
            disableOnMobile
            respectReducedMotion
            spotlight
            spotlightColor="rgba(251,191,36,0.32)"
            contentClassName="p-5"
          >
            <div className="flex h-full flex-col justify-between rounded-xl border border-white/25 bg-gradient-to-br from-slate-900/85 via-slate-800/75 to-teal-900/80 p-5 text-white">
              <Users2 className="h-7 w-7" />
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-200">Active clients</p>
                <p className="mt-1 text-xl font-semibold">{overview?.kpis.activeClients ?? 0}</p>
              </div>
            </div>
          </DepthCard>
        </div>

        {dashboardLoading ? <PortalLoadingState label="Loading admin dashboard..." /> : null}
        {dashboardError ? <PortalErrorState title="Admin dashboard unavailable" message={dashboardError} /> : null}

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="neo-surface border-white/70 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur lg:col-span-3 dark:border-white/10 dark:bg-slate-950/68">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Rocket className="h-5 w-5 text-teal-500" />
                Demo Seed Command Center
              </CardTitle>
              <CardDescription>
                Safe, idempotent bootstrap for demo white-labelers. Existing entities are reused and only missing records
                are created.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {seedAccessLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner />
                  Verifying platform seeding access...
                </div>
              ) : seedAccessError ? (
                <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  {seedAccessError}
                </p>
              ) : seedAccess?.seed_demo_enabled === false ? (
                <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  {seedAccess.reason ?? "Demo seeding is currently disabled in this environment."}
                </p>
              ) : (
                <Badge className="bg-emerald-600/90 text-white hover:bg-emerald-600">
                  Platform seeding enabled for this account
                </Badge>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="seed-display-name">Display name</Label>
                  <Input
                    id="seed-display-name"
                    value={seedForm.displayName}
                    onChange={(event) => {
                      setSeedForm((current) => ({ ...current, displayName: event.target.value }))
                    }}
                    disabled={!canSeedDemo || isSeedingDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed-slug">Slug</Label>
                  <Input
                    id="seed-slug"
                    value={seedForm.slug}
                    onChange={(event) => {
                      setSeedForm((current) => ({ ...current, slug: event.target.value }))
                    }}
                    placeholder="statxeo-demo-partner"
                    disabled={!canSeedDemo || isSeedingDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed-owner-email">Owner email</Label>
                  <Input
                    id="seed-owner-email"
                    type="email"
                    value={seedForm.ownerEmail}
                    onChange={(event) => {
                      setSeedForm((current) => ({ ...current, ownerEmail: event.target.value }))
                    }}
                    disabled={!canSeedDemo || isSeedingDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed-owner-password">Owner password (optional if user exists)</Label>
                  <Input
                    id="seed-owner-password"
                    type="password"
                    value={seedForm.ownerPassword}
                    onChange={(event) => {
                      setSeedForm((current) => ({ ...current, ownerPassword: event.target.value }))
                    }}
                    placeholder="Minimum 10 chars for new user creation"
                    disabled={!canSeedDemo || isSeedingDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed-plan-code">Plan code</Label>
                  <Input
                    id="seed-plan-code"
                    value={seedForm.planCode}
                    onChange={(event) => {
                      setSeedForm((current) => ({ ...current, planCode: event.target.value }))
                    }}
                    disabled={!canSeedDemo || isSeedingDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed-sample-toggle">Sample data</Label>
                  <Button
                    id="seed-sample-toggle"
                    type="button"
                    variant={seedForm.createSampleData ? "default" : "outline"}
                    className="w-full"
                    disabled={!canSeedDemo || isSeedingDemo}
                    onClick={() => {
                      setSeedForm((current) => ({ ...current, createSampleData: !current.createSampleData }))
                    }}
                  >
                    {seedForm.createSampleData ? "Create clients + charges" : "Account only"}
                  </Button>
                </div>
              </div>

              {seedMutationError ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {seedMutationError}
                </p>
              ) : null}

              {seedMutationSuccess ? (
                <p className="rounded-md border border-emerald-300/50 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {seedMutationSuccess}
                </p>
              ) : null}

              {seedResult ? (
                <div className="grid gap-3 rounded-md border border-border/60 bg-card/65 p-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">White-labeler ID</p>
                    <p className="font-mono text-xs">{seedResult.whiteLabelerId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Owner user ID</p>
                    <p className="font-mono text-xs">{seedResult.ownerUserId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created account</p>
                    <p>{seedResult.createdWhiteLabeler ? "Yes" : "No (reused)"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created owner user</p>
                    <p>{seedResult.createdOwnerUser ? "Yes" : "No (reused)"}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Idempotent and production-safe</p>
                <Button onClick={handleSeedDemo} disabled={!canSeedDemo || isSeedingDemo} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {isSeedingDemo ? "Seeding demo account..." : "Run demo seed"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <PortalSurfaceCard title="Live Snapshot" description="Recent payout batches and team roles from this tenant." className="lg:col-span-2 border-white/70 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-950/68">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recent payouts</p>
                {payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payout batches yet.</p>
                ) : (
                  <div className="space-y-2">
                    {payouts.slice(0, 4).map((row) => (
                      <div key={row.id} className="rounded-md border border-border/60 bg-card/60 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{row.settlement_month}</p>
                          <Badge variant="outline" className="capitalize">
                            {row.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground">{formatCents(row.net_amount_cents, row.currency)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Team</p>
                {team.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {team.slice(0, 5).map((member) => (
                      <div
                        key={`${member.user_id}-${member.created_at}`}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-card/60 px-3 py-2 text-sm"
                      >
                        <span className="font-mono text-xs">{member.user_id.slice(0, 8)}...</span>
                        <span className="capitalize text-muted-foreground">{member.role}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PortalSurfaceCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PortalDataTable
            title="Pricing Overrides"
            description="Current plan pricing and net payout profiles."
            rows={pricing.slice(0, 12)}
            getRowId={(row) => row.id}
            columns={[
              { key: "plan", label: "Plan", sortable: true, sortValue: (row) => row.plan_code, render: (row) => row.plan_code },
              { key: "sold", label: "Sold", sortable: true, sortValue: (row) => row.amount_sold_cents, render: (row) => formatCents(row.amount_sold_cents, row.currency) },
              { key: "net", label: "Net", sortable: true, sortValue: (row) => row.net_payout_cents, render: (row) => formatCents(row.net_payout_cents, row.currency) },
              { key: "status", label: "Status", sortable: true, sortValue: (row) => row.is_active ? 1 : 0, render: (row) => row.is_active ? "Active" : "Inactive" },
            ]}
            searchPlaceholder="Search plans"
            searchValue={pricingSearch}
            onSearchValueChange={setPricingSearch}
            searchMatcher={(row, query) => [row.plan_code, row.currency].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))}
            emptyTitle="No pricing overrides configured"
            emptyDescription="Plan pricing overrides will appear here once configured."
          />

          <PortalDataTable
            title="Client Roster"
            description="Recently created client accounts for this tenant."
            rows={clients.slice(0, 16)}
            getRowId={(row) => row.id}
            columns={[
              { key: "client", label: "Client", sortable: true, sortValue: (row) => row.client_name, render: (row) => row.client_name },
              { key: "status", label: "Status", sortable: true, sortValue: (row) => row.status, render: (row) => <span className="capitalize">{row.status}</span> },
              { key: "sites", label: "Sites", sortable: true, sortValue: (row) => row.active_site_count, render: (row) => row.active_site_count },
              { key: "created", label: "Created", sortable: true, sortValue: (row) => row.created_at, render: (row) => formatDate(row.created_at) },
            ]}
            searchPlaceholder="Search clients"
            searchValue={clientSearch}
            onSearchValueChange={setClientSearch}
            searchMatcher={(row, query) => [row.client_name, row.status].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))}
            emptyTitle="No clients found"
            emptyDescription="Client accounts will appear here after they are provisioned."
          />
        </div>

        <PortalDataTable
          title="Demo Seed Run History"
          description="Audit-backed history of recent demo seed operations."
          rows={seedRuns}
          getRowId={(row) => row.id}
          columns={[
            { key: "timestamp", label: "Timestamp", sortable: true, sortValue: (row) => row.created_at, render: (row) => formatDate(row.created_at) },
            { key: "slug", label: "Slug", sortable: true, sortValue: (row) => row.slug, render: (row) => row.slug || "-" },
            { key: "account", label: "Created account", sortable: true, sortValue: (row) => row.created_white_labeler ? 1 : 0, render: (row) => row.created_white_labeler ? "Yes" : "Reused" },
            { key: "clients", label: "Clients", sortable: true, sortValue: (row) => row.inserted_sample_clients, render: (row) => row.inserted_sample_clients },
            { key: "charges", label: "Charges", sortable: true, sortValue: (row) => row.inserted_sample_charges, render: (row) => row.inserted_sample_charges },
            { key: "payout", label: "Payout batch", sortable: true, sortValue: (row) => row.created_payout_batch ? 1 : 0, render: (row) => row.created_payout_batch ? "Created" : "Reused" },
          ]}
          loading={seedRunsLoading}
          loadingLabel="Loading seed run history..."
          error={seedRunsError}
          searchPlaceholder="Search seed runs"
          searchValue={seedRunSearch}
          onSearchValueChange={setSeedRunSearch}
          searchMatcher={(row, query) => [row.slug, row.id].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))}
          emptyTitle="No seed runs recorded yet"
          emptyDescription="Demo seed activity will appear here once the first run completes."
        />
      </div>
    </EmbeddedPortalShell>
  )
}
