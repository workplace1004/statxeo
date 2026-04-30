"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Banknote,
  CheckCircle2,
  Circle,
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Palette,
  RefreshCcw,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import {
  WhiteLabelerApiError,
  addWhiteLabelerDomain,
  addWhiteLabelerTeamMember,
  createWhiteLabelerCheckoutSession,
  createWhiteLabelerClient,
  createWhiteLabelerStripeAccountLink,
  createWhiteLabelerStripeDashboardLink,
  createWhiteLabelerPricingOverride,
  fetchWhiteLabelerBillingHistory,
  fetchWhiteLabelerBranding,
  fetchWhiteLabelerClients,
  fetchWhiteLabelerOverview,
  fetchWhiteLabelerPayouts,
  fetchWhiteLabelerPricing,
  fetchWhiteLabelerTeam,
  removeWhiteLabelerDomain,
  updateWhiteLabelerBranding,
  updateWhiteLabelerPayoutStatus,
  updateWhiteLabelerPricingOverride,
  updateWhiteLabelerTeamMember,
  type WhiteLabelerBrandingResponse,
  type WhiteLabelerCharge,
  type WhiteLabelerClient,
  type WhiteLabelerOverviewResponse,
  type WhiteLabelerPayoutBatch,
  type WhiteLabelerPlanOverride,
  type WhiteLabelerTeamMember,
} from "@/lib/statxeo/white-labeler-client"
import { cn } from "@/lib/utils"

type TabValue = "overview" | "clients" | "pricing" | "billing" | "payouts" | "branding" | "team"

function isErrorPayloadRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function describeError(error: unknown, fallback: string) {
  if (error instanceof WhiteLabelerApiError) {
    const payload = error.payload
    if (isErrorPayloadRecord(payload) && payload.code === "LAUNCH_BLOCKED" && Array.isArray(payload.blockers)) {
      return (payload.blockers as { message?: string }[])
        .map((row) => (typeof row?.message === "string" ? row.message : ""))
        .filter(Boolean)
        .join(" ")
    }

    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function formatCents(value: number, currency = "usd") {
  const normalizedCurrency = /^[a-z]{3}$/i.test(currency) ? currency.toUpperCase() : "USD"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
  }).format((Number(value || 0) || 0) / 100)
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return "-"
  return new Date(parsed).toLocaleDateString()
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-"
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return "-"
  return new Date(parsed).toLocaleString()
}

function parseDollarsInputToCents(value: string) {
  const parsed = Number(value.trim())
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

function formatCentsForInput(value: number) {
  return ((Number.isFinite(value) ? value : 0) / 100).toFixed(2)
}

export function WhiteLabelerPortalSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabValue>("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [overview, setOverview] = useState<WhiteLabelerOverviewResponse | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState("")

  const [clients, setClients] = useState<WhiteLabelerClient[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientsError, setClientsError] = useState("")
  const [clientsMutationError, setClientsMutationError] = useState("")
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [clientForm, setClientForm] = useState({
    clientName: "",
    billingEmail: "",
    externalCustomerId: "",
    activeSiteCount: "1",
  })
  const [checkoutMutationError, setCheckoutMutationError] = useState("")
  const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    clientId: "",
    planOverrideId: "",
  })
  const [lastCheckoutSession, setLastCheckoutSession] = useState<{
    sessionId: string
    url: string
    clientName: string
    planCode: string
    currency: string
    amountSoldCents: number
    applicationFeeAmountCents: number
    netPayoutCents: number
  } | null>(null)

  const [pricing, setPricing] = useState<WhiteLabelerPlanOverride[]>([])
  const [pricingLoading, setPricingLoading] = useState(true)
  const [pricingError, setPricingError] = useState("")
  const [pricingMutationError, setPricingMutationError] = useState("")
  const [isCreatingPricingOverride, setIsCreatingPricingOverride] = useState(false)
  const [updatingPricingId, setUpdatingPricingId] = useState<string | null>(null)
  const [pricingForm, setPricingForm] = useState({
    planCode: "",
    currency: "usd",
    amountSold: "0.00",
    baseCost: "0.00",
    whiteLabelFee: "0.00",
    isActive: true,
  })

  const [billing, setBilling] = useState<WhiteLabelerCharge[]>([])
  const [billingLoading, setBillingLoading] = useState(true)
  const [billingError, setBillingError] = useState("")

  const [payouts, setPayouts] = useState<WhiteLabelerPayoutBatch[]>([])
  const [payoutsLoading, setPayoutsLoading] = useState(true)
  const [payoutsError, setPayoutsError] = useState("")

  const [branding, setBranding] = useState<WhiteLabelerBrandingResponse | null>(null)
  const [brandingLoading, setBrandingLoading] = useState(true)
  const [brandingError, setBrandingError] = useState("")
  const [brandingMutationError, setBrandingMutationError] = useState("")
  const [isSavingBranding, setIsSavingBranding] = useState(false)
  const [newDomainInput, setNewDomainInput] = useState("")
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [removingDomainId, setRemovingDomainId] = useState<string | null>(null)
  const [brandingForm, setBrandingForm] = useState({
    brandName: "",
    primaryColor: "",
    secondaryColor: "",
    logoUrl: "",
    supportEmail: "",
    supportPhone: "",
  })

  const [team, setTeam] = useState<WhiteLabelerTeamMember[]>([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [teamError, setTeamError] = useState("")
  const [teamMutationError, setTeamMutationError] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)
  const [teamForm, setTeamForm] = useState({
    userId: "",
    role: "member" as "owner" | "admin" | "member",
  })

  const [payoutMutationError, setPayoutMutationError] = useState("")
  const [updatingPayoutId, setUpdatingPayoutId] = useState<string | null>(null)

  const [isSigningOut, setIsSigningOut] = useState(false)
  const [stripeMutationError, setStripeMutationError] = useState("")
  const [isOpeningStripeOnboarding, setIsOpeningStripeOnboarding] = useState(false)

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true)
    setOverviewError("")

    try {
      const data = await fetchWhiteLabelerOverview()
      setOverview(data)
    } catch (error) {
      setOverviewError(describeError(error, "Unable to load overview."))
      setOverview(null)
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  const loadClients = useCallback(async () => {
    setClientsLoading(true)
    setClientsError("")

    try {
      const data = await fetchWhiteLabelerClients({ limit: 200 })
      setClients(Array.isArray(data.clients) ? data.clients : [])
    } catch (error) {
      setClientsError(describeError(error, "Unable to load clients."))
      setClients([])
    } finally {
      setClientsLoading(false)
    }
  }, [])

  const loadPricing = useCallback(async () => {
    setPricingLoading(true)
    setPricingError("")

    try {
      const data = await fetchWhiteLabelerPricing()
      setPricing(Array.isArray(data.plans) ? data.plans : [])
    } catch (error) {
      setPricingError(describeError(error, "Unable to load pricing overrides."))
      setPricing([])
    } finally {
      setPricingLoading(false)
    }
  }, [])

  const loadBilling = useCallback(async () => {
    setBillingLoading(true)
    setBillingError("")

    try {
      const data = await fetchWhiteLabelerBillingHistory({ limit: 250 })
      setBilling(Array.isArray(data.charges) ? data.charges : [])
    } catch (error) {
      setBillingError(describeError(error, "Unable to load billing history."))
      setBilling([])
    } finally {
      setBillingLoading(false)
    }
  }, [])

  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true)
    setPayoutsError("")

    try {
      const data = await fetchWhiteLabelerPayouts({ limit: 100 })
      setPayouts(Array.isArray(data.payouts) ? data.payouts : [])
    } catch (error) {
      setPayoutsError(describeError(error, "Unable to load payouts."))
      setPayouts([])
    } finally {
      setPayoutsLoading(false)
    }
  }, [])

  const loadBranding = useCallback(async () => {
    setBrandingLoading(true)
    setBrandingError("")

    try {
      const data = await fetchWhiteLabelerBranding()
      setBranding(data)
      setBrandingForm({
        brandName: data.brand_name ?? "",
        primaryColor: data.primary_color ?? "",
        secondaryColor: data.secondary_color ?? "",
        logoUrl: data.logo_url ?? "",
        supportEmail: data.support_email ?? "",
        supportPhone: data.support_phone ?? "",
      })
    } catch (error) {
      setBrandingError(describeError(error, "Unable to load branding settings."))
      setBranding(null)
    } finally {
      setBrandingLoading(false)
    }
  }, [])

  const loadTeam = useCallback(async () => {
    setTeamLoading(true)
    setTeamError("")

    try {
      const data = await fetchWhiteLabelerTeam()
      setTeam(Array.isArray(data.members) ? data.members : [])
    } catch (error) {
      setTeamError(describeError(error, "Unable to load team settings."))
      setTeam([])
    } finally {
      setTeamLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.all([
      loadOverview(),
      loadClients(),
      loadPricing(),
      loadBilling(),
      loadPayouts(),
      loadBranding(),
      loadTeam(),
    ])
  }, [loadOverview, loadClients, loadPricing, loadBilling, loadPayouts, loadBranding, loadTeam])

  const accountCurrency = useMemo(() => overview?.account.currency ?? "usd", [overview])
  const canManagePricing = useMemo(() => {
    return overview?.account.role === "owner" || overview?.account.role === "admin"
  }, [overview])

  const canManageClients = useMemo(() => {
    return overview?.account.role === "owner" || overview?.account.role === "admin"
  }, [overview])

  const canSellFromLaunch = useMemo(() => {
    return overview?.launchReadiness?.canSell ?? false
  }, [overview])

  const activePricingPlans = useMemo(() => {
    return pricing.filter((row) => row.is_active && !row.effective_to)
  }, [pricing])

  const stripeReturnState = searchParams.get("stripe")

  const pricingPreviewNetPayoutCents = useMemo(() => {
    const amountSoldCents = parseDollarsInputToCents(pricingForm.amountSold)
    const baseCostCents = parseDollarsInputToCents(pricingForm.baseCost)
    const whiteLabelFeeCents = parseDollarsInputToCents(pricingForm.whiteLabelFee)

    if (amountSoldCents === null || baseCostCents === null || whiteLabelFeeCents === null) {
      return null
    }

    return Math.max(0, amountSoldCents - (baseCostCents + whiteLabelFeeCents))
  }, [pricingForm.amountSold, pricingForm.baseCost, pricingForm.whiteLabelFee])

  useEffect(() => {
    setCheckoutForm((current) => ({
      clientId: current.clientId || clients[0]?.id || "",
      planOverrideId: current.planOverrideId || activePricingPlans[0]?.id || "",
    }))
  }, [clients, activePricingPlans])

  useEffect(() => {
    if (!stripeReturnState) return
    void loadOverview()
  }, [stripeReturnState, loadOverview])

  const handleRefreshActiveTab = async () => {
    setIsRefreshing(true)

    try {
      if (activeTab === "overview") {
        await loadOverview()
      } else if (activeTab === "clients") {
        await loadClients()
      } else if (activeTab === "pricing") {
        await loadPricing()
      } else if (activeTab === "billing") {
        await loadBilling()
      } else if (activeTab === "payouts") {
        await loadPayouts()
      } else if (activeTab === "branding") {
        await loadBranding()
      } else if (activeTab === "team") {
        await loadTeam()
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      router.replace("/white-labeler/login")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleCreatePricingOverride = async () => {
    if (!canManagePricing) {
      setPricingMutationError("Only owners and admins can manage pricing overrides.")
      return
    }

    setPricingMutationError("")

    const planCode = pricingForm.planCode.trim().toLowerCase()
    const currency = pricingForm.currency.trim().toLowerCase()
    const amountSoldCents = parseDollarsInputToCents(pricingForm.amountSold)
    const baseCostCents = parseDollarsInputToCents(pricingForm.baseCost)
    const whiteLabelFeeCents = parseDollarsInputToCents(pricingForm.whiteLabelFee)

    if (!planCode) {
      setPricingMutationError("Plan code is required.")
      return
    }

    if (amountSoldCents === null || baseCostCents === null || whiteLabelFeeCents === null) {
      setPricingMutationError("Amounts must be valid positive numbers.")
      return
    }

    setIsCreatingPricingOverride(true)

    try {
      const createdPlan = await createWhiteLabelerPricingOverride({
        plan_code: planCode,
        currency: currency || "usd",
        amount_sold_cents: amountSoldCents,
        base_cost_cents: baseCostCents,
        white_label_fee_cents: whiteLabelFeeCents,
        is_active: pricingForm.isActive,
      })

      setPricingForm({
        planCode: createdPlan.plan_code,
        currency: createdPlan.currency,
        amountSold: formatCentsForInput(createdPlan.amount_sold_cents),
        baseCost: formatCentsForInput(createdPlan.base_cost_cents),
        whiteLabelFee: formatCentsForInput(createdPlan.white_label_fee_cents),
        isActive: true,
      })

      await loadPricing()
    } catch (error) {
      setPricingMutationError(describeError(error, "Unable to create pricing override."))
    } finally {
      setIsCreatingPricingOverride(false)
    }
  }

  const handleCreateClient = async () => {
    if (!canManageClients) {
      setClientsMutationError("Only owners and admins can create clients.")
      return
    }

    const clientName = clientForm.clientName.trim()
    const billingEmail = clientForm.billingEmail.trim()
    const externalCustomerId = clientForm.externalCustomerId.trim()
    const activeSiteCount = Number(clientForm.activeSiteCount)

    if (!clientName) {
      setClientsMutationError("Client name is required.")
      return
    }

    if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
      setClientsMutationError("Billing email must be valid.")
      return
    }

    if (!Number.isFinite(activeSiteCount) || activeSiteCount < 0) {
      setClientsMutationError("Active sites must be zero or greater.")
      return
    }

    setClientsMutationError("")
    setIsCreatingClient(true)

    try {
      await createWhiteLabelerClient({
        client_name: clientName,
        billing_email: billingEmail || undefined,
        external_customer_id: externalCustomerId || undefined,
        active_site_count: Math.floor(activeSiteCount),
      })

      setClientForm({
        clientName: "",
        billingEmail: "",
        externalCustomerId: "",
        activeSiteCount: "1",
      })

      await Promise.all([loadClients(), loadOverview()])
    } catch (error) {
      setClientsMutationError(describeError(error, "Unable to create client."))
    } finally {
      setIsCreatingClient(false)
    }
  }

  const handleCreateCheckoutSession = async () => {
    if (!canManageClients) {
      setCheckoutMutationError("Only owners and admins can create checkout links.")
      return
    }

    if (!checkoutForm.clientId || !checkoutForm.planOverrideId) {
      setCheckoutMutationError("Select both a client and a pricing override.")
      return
    }

    setCheckoutMutationError("")
    setIsCreatingCheckoutSession(true)

    try {
      const response = await createWhiteLabelerCheckoutSession({
        client_id: checkoutForm.clientId,
        plan_override_id: checkoutForm.planOverrideId,
      })

      setLastCheckoutSession({
        sessionId: response.session.sessionId,
        url: response.session.url,
        clientName: response.session.clientName,
        planCode: response.session.planCode,
        currency: response.session.currency,
        amountSoldCents: response.session.amountSoldCents,
        applicationFeeAmountCents: response.session.applicationFeeAmountCents,
        netPayoutCents: response.session.netPayoutCents,
      })
      await loadOverview()
    } catch (error) {
      setCheckoutMutationError(describeError(error, "Unable to create checkout session."))
    } finally {
      setIsCreatingCheckoutSession(false)
    }
  }

  const handleOpenStripeOnboarding = async () => {
    if (!canManageClients) {
      setStripeMutationError("Only owners and admins can manage Stripe Connect.")
      return
    }

    setStripeMutationError("")
    setIsOpeningStripeOnboarding(true)

    try {
      const response = await createWhiteLabelerStripeAccountLink()
      window.location.assign(response.url)
    } catch (error) {
      setStripeMutationError(describeError(error, "Unable to open Stripe onboarding."))
    } finally {
      setIsOpeningStripeOnboarding(false)
    }
  }

  const handleOpenStripeDashboard = async () => {
    if (!canManageClients) {
      setStripeMutationError("Only owners and admins can manage Stripe Connect.")
      return
    }

    setStripeMutationError("")
    setIsOpeningStripeOnboarding(true)

    try {
      const response = await createWhiteLabelerStripeDashboardLink()
      window.location.assign(response.url)
    } catch (error) {
      setStripeMutationError(describeError(error, "Unable to open the Stripe Express dashboard."))
    } finally {
      setIsOpeningStripeOnboarding(false)
    }
  }

  const handleTogglePricingOverrideStatus = async (row: WhiteLabelerPlanOverride) => {
    if (!canManagePricing) {
      setPricingMutationError("Only owners and admins can manage pricing overrides.")
      return
    }

    setPricingMutationError("")
    setUpdatingPricingId(row.id)

    try {
      await updateWhiteLabelerPricingOverride({
        id: row.id,
        is_active: !row.is_active,
      })

      await loadPricing()
    } catch (error) {
      setPricingMutationError(describeError(error, "Unable to update pricing override."))
      await loadPricing()
    } finally {
      setUpdatingPricingId(null)
    }
  }

  const canManageBranding = useMemo(() => {
    return overview?.account.role === "owner" || overview?.account.role === "admin"
  }, [overview])

  const handleSaveBranding = async () => {
    if (!canManageBranding) {
      setBrandingMutationError("Only owners and admins can update branding settings.")
      return
    }

    setBrandingMutationError("")
    setIsSavingBranding(true)

    try {
      await updateWhiteLabelerBranding({
        brand_name: brandingForm.brandName || null,
        primary_color: brandingForm.primaryColor || null,
        secondary_color: brandingForm.secondaryColor || null,
        logo_url: brandingForm.logoUrl || null,
        support_email: brandingForm.supportEmail || null,
        support_phone: brandingForm.supportPhone || null,
      })

      await loadBranding()
    } catch (error) {
      setBrandingMutationError(describeError(error, "Unable to save branding settings."))
      await loadBranding()
    } finally {
      setIsSavingBranding(false)
    }
  }

  const handleAddDomain = async () => {
    if (!canManageBranding) {
      setBrandingMutationError("Only owners and admins can manage domains.")
      return
    }

    const domain = newDomainInput.trim().toLowerCase()
    if (!domain) {
      setBrandingMutationError("Please enter a domain name.")
      return
    }

    setBrandingMutationError("")
    setIsAddingDomain(true)

    try {
      await addWhiteLabelerDomain(domain)
      setNewDomainInput("")
      await loadBranding()
    } catch (error) {
      setBrandingMutationError(describeError(error, "Unable to add domain."))
    } finally {
      setIsAddingDomain(false)
    }
  }

  const handleRemoveDomain = async (domainId: string) => {
    if (!canManageBranding) {
      setBrandingMutationError("Only owners and admins can manage domains.")
      return
    }

    setBrandingMutationError("")
    setRemovingDomainId(domainId)

    try {
      await removeWhiteLabelerDomain(domainId)
      await loadBranding()
    } catch (error) {
      setBrandingMutationError(describeError(error, "Unable to remove domain."))
    } finally {
      setRemovingDomainId(null)
    }
  }

  const canManageTeam = useMemo(() => {
    return overview?.account.role === "owner" || overview?.account.role === "admin"
  }, [overview])

  const handleAddTeamMember = async () => {
    if (!canManageTeam) {
      setTeamMutationError("Only owners and admins can manage team members.")
      return
    }

    const userId = teamForm.userId.trim()
    if (!userId) {
      setTeamMutationError("User ID is required.")
      return
    }

    setTeamMutationError("")
    setIsAddingMember(true)

    try {
      await addWhiteLabelerTeamMember({ user_id: userId, role: teamForm.role })
      setTeamForm({ userId: "", role: "member" })
      await loadTeam()
    } catch (error) {
      setTeamMutationError(describeError(error, "Unable to add team member."))
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleToggleMemberStatus = async (row: WhiteLabelerTeamMember) => {
    if (!canManageTeam) {
      setTeamMutationError("Only owners and admins can manage team members.")
      return
    }

    setTeamMutationError("")
    setUpdatingMemberId(row.user_id)

    try {
      await updateWhiteLabelerTeamMember({ user_id: row.user_id, is_active: !row.is_active })
      await loadTeam()
    } catch (error) {
      setTeamMutationError(describeError(error, "Unable to update team member."))
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const handleAdvancePayoutStatus = async (row: WhiteLabelerPayoutBatch) => {
    if (!canManagePricing) {
      setPayoutMutationError("Only owners and admins can update payout status.")
      return
    }

    const nextStatus = row.status === "draft" ? "finalized" : row.status === "finalized" ? "paid" : null
    if (!nextStatus) return

    setPayoutMutationError("")
    setUpdatingPayoutId(row.id)

    try {
      await updateWhiteLabelerPayoutStatus({ id: row.id, status: nextStatus })
      await loadPayouts()
    } catch (error) {
      setPayoutMutationError(describeError(error, "Unable to update payout status."))
    } finally {
      setUpdatingPayoutId(null)
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">White-Labeler Portal</h1>
            <p className="text-sm text-muted-foreground">
              {overview?.account.displayName
                ? `Welcome back, ${overview.account.displayName}. `
                : ""}
              Manage margins, billing, payouts, branding, and team access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canManageTeam ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/white-labeler/admin" data-icon="inline-start">
                  <LayoutDashboard />
                  Admin workspace
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleRefreshActiveTab} disabled={isRefreshing} data-icon="inline-start">
              <RefreshCcw className={cn(isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut} data-icon="inline-start">
              <LogOut />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
        <Separator />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 p-2 md:grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Account snapshot</CardTitle>
                <CardDescription>Monthly KPI summary for your white-label business.</CardDescription>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-36" />
                    </div>
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                      ))}
                    </div>
                  </div>
                ) : overviewError ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-destructive">{overviewError}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => void loadOverview()}>
                      Retry
                    </Button>
                  </div>
                ) : overview ? (
                  <div className="space-y-4">
                    {overview.launchReadiness && !overview.launchReadiness.canSell ? (
                      <Alert variant="destructive">
                        <AlertTitle>Go-live requirements incomplete</AlertTitle>
                        <AlertDescription>
                          <p className="mb-2 text-sm">
                            Finish the items below before creating live checkout links for clients.
                          </p>
                          <ul className="list-inside list-disc space-y-1 text-sm">
                            {overview.launchReadiness.blockers.map((blocker) => (
                              <li key={blocker.code}>{blocker.message}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    {stripeReturnState === "active" ? (
                      <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                        <AlertTitle>Stripe Connect is active</AlertTitle>
                        <AlertDescription>Your connected payout account is ready for charges and payouts.</AlertDescription>
                      </Alert>
                    ) : stripeReturnState === "pending" ? (
                      <Alert>
                        <AlertTitle>Stripe onboarding saved</AlertTitle>
                        <AlertDescription>Finish any remaining Stripe requirements to enable payouts.</AlertDescription>
                      </Alert>
                    ) : stripeReturnState === "restricted" ? (
                      <Alert>
                        <AlertTitle>Stripe needs attention</AlertTitle>
                        <AlertDescription>Stripe still has outstanding or restricted requirements on this account.</AlertDescription>
                      </Alert>
                    ) : stripeReturnState === "error" ? (
                      <Alert variant="destructive">
                        <AlertTitle>Stripe sync failed</AlertTitle>
                        <AlertDescription>We could not refresh Stripe status after onboarding. Use Refresh to try again.</AlertDescription>
                      </Alert>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary">Role: {overview.account.role}</Badge>
                      <Badge variant="outline">Account: {overview.account.status ?? "active"}</Badge>
                      <Badge variant="outline">Settlement month: {overview.period.settlementMonth}</Badge>
                      {overview.launchReadiness ? (
                        <Badge variant={overview.launchReadiness.canSell ? "secondary" : "outline"}>
                          Checkout: {overview.launchReadiness.canSell ? "ready" : "blocked"}
                        </Badge>
                      ) : null}
                    </div>
                    <Card className="border-border/70 bg-background/80">
                      <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-xl">Stripe Connect</CardTitle>
                            <CardDescription>
                              Connect an Express account so destination charges and payouts can go live.
                            </CardDescription>
                          </div>
                          <Badge variant={overview.stripe.status === "active" ? "secondary" : "outline"}>
                            {overview.stripe.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={overview.stripe.chargesEnabled ? "secondary" : "outline"}>
                                Charges {overview.stripe.chargesEnabled ? "enabled" : "pending"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {overview.stripe.chargesEnabled
                                ? "Your account can accept payments via destination charges."
                                : "Complete Stripe onboarding to enable charges."}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={overview.stripe.payoutsEnabled ? "secondary" : "outline"}>
                                Payouts {overview.stripe.payoutsEnabled ? "enabled" : "pending"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {overview.stripe.payoutsEnabled
                                ? "Stripe can send payouts to your bank account."
                                : "Complete identity verification to enable payouts."}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={overview.stripe.detailsSubmitted ? "secondary" : "outline"}>
                                Details {overview.stripe.detailsSubmitted ? "submitted" : "needed"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {overview.stripe.detailsSubmitted
                                ? "Business details and identity have been submitted."
                                : "Submit required business details to complete onboarding."}
                            </TooltipContent>
                          </Tooltip>
                          {overview.stripe.accountId ? (
                            <Badge variant="outline">{overview.stripe.accountId}</Badge>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!overview.stripe.isConfigured ? (
                          <p className="text-sm text-destructive">
                            Stripe env vars are missing on this deployment. Add the secret key before onboarding partners.
                          </p>
                        ) : null}
                        {overview.stripe.requirements.disabledReason ? (
                          <p className="text-sm text-destructive">
                            Disabled reason: {overview.stripe.requirements.disabledReason}
                          </p>
                        ) : null}
                        {overview.stripe.requirements.currentlyDue.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Outstanding Stripe requirements</p>
                            <div className="flex flex-wrap gap-2">
                              {overview.stripe.requirements.currentlyDue.map((requirement) => (
                                <Badge key={requirement} variant="outline">
                                  {requirement}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {overview.stripe.requirements.pendingVerification.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Pending verification</p>
                            <div className="flex flex-wrap gap-2">
                              {overview.stripe.requirements.pendingVerification.map((requirement) => (
                                <Badge key={requirement} variant="outline">
                                  {requirement}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            onClick={overview.stripe.status === "active" ? handleOpenStripeDashboard : handleOpenStripeOnboarding}
                            disabled={isOpeningStripeOnboarding || !overview.stripe.isConfigured || !canManageClients}
                          >
                            {isOpeningStripeOnboarding
                              ? "Opening Stripe..."
                              : overview.stripe.accountId
                                ? overview.stripe.status === "active"
                                  ? "Open Express dashboard"
                                  : "Resume Stripe onboarding"
                                : "Connect Stripe"}
                          </Button>
                          {overview.stripe.accountId && overview.stripe.status !== "active" ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleOpenStripeOnboarding}
                              disabled={isOpeningStripeOnboarding || !overview.stripe.isConfigured || !canManageClients}
                            >
                              Restart onboarding
                            </Button>
                          ) : null}
                          {overview.stripe.lastSyncedAt ? (
                            <p className="text-sm text-muted-foreground">
                              Last synced {formatDateTime(overview.stripe.lastSyncedAt)}
                            </p>
                          ) : null}
                        </div>
                        {stripeMutationError ? <p className="text-sm text-destructive">{stripeMutationError}</p> : null}
                      </CardContent>
                    </Card>
                    <Card className="border-border/70 bg-background/80">
                      <CardHeader className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-xl">Onboarding progress</CardTitle>
                            <CardDescription>
                              Current step: {overview.onboarding.currentStep === "completed" ? "Completed" : overview.onboarding.steps.find((step) => step.key === overview.onboarding.currentStep)?.label ?? "In progress"}
                            </CardDescription>
                          </div>
                          <Badge variant={overview.onboarding.isComplete ? "secondary" : "outline"}>
                            {overview.onboarding.completedSteps}/{overview.onboarding.totalSteps} complete
                          </Badge>
                        </div>
                        <Progress value={overview.onboarding.percentComplete} className="h-2.5" />
                        <p className="text-right text-xs text-muted-foreground">{overview.onboarding.percentComplete}% complete</p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {overview.onboarding.steps.map((step) => (
                            <div
                              key={step.key}
                              className={cn(
                                "rounded-lg border p-3",
                                step.complete
                                  ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30"
                                  : "border-border/70 bg-background/70",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium">{step.label}</p>
                                <Badge variant={step.complete ? "secondary" : "outline"}>
                                  {step.complete ? "Done" : "Pending"}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <Card className="border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardDescription>Active clients</CardDescription>
                          <Users className="text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{overview.kpis.activeClients}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardDescription>Active sites</CardDescription>
                          <Globe className="text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{overview.kpis.activeSites}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardDescription>Month revenue</CardDescription>
                          <DollarSign className="text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {formatCents(overview.kpis.monthRevenueCents, accountCurrency)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardDescription>Month net payout</CardDescription>
                          <Banknote className="text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {formatCents(overview.kpis.monthNetPayoutCents, accountCurrency)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardDescription>Outstanding drafts</CardDescription>
                          <FileText className="text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {formatCents(overview.kpis.outstandingDraftPayoutCents, accountCurrency)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><ShieldCheck /></EmptyMedia>
                      <EmptyTitle>No overview data yet</EmptyTitle>
                      <EmptyDescription>Once your account is provisioned, your KPIs will appear here.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Client roster</CardTitle>
                <CardDescription>Active managed accounts and site counts.</CardDescription>
              </CardHeader>
              <CardContent>
                {canManageClients ? (
                  <div className="mb-4 grid gap-4 xl:grid-cols-2">
                    <div className="space-y-4 rounded-md border border-border/60 p-4">
                      <p className="text-sm font-medium">Create first client</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="wl-client-name">Client name</Label>
                          <Input
                            id="wl-client-name"
                            value={clientForm.clientName}
                            onChange={(event) => {
                              setClientForm((current) => ({ ...current, clientName: event.target.value }))
                            }}
                            placeholder="Acme Ventures"
                            disabled={isCreatingClient}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wl-client-billing-email">Billing email</Label>
                          <Input
                            id="wl-client-billing-email"
                            value={clientForm.billingEmail}
                            onChange={(event) => {
                              setClientForm((current) => ({ ...current, billingEmail: event.target.value }))
                            }}
                            placeholder="billing@acme.com"
                            disabled={isCreatingClient}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wl-client-external-id">External customer id</Label>
                          <Input
                            id="wl-client-external-id"
                            value={clientForm.externalCustomerId}
                            onChange={(event) => {
                              setClientForm((current) => ({ ...current, externalCustomerId: event.target.value }))
                            }}
                            placeholder="acme-ventures"
                            disabled={isCreatingClient}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wl-client-site-count">Active sites</Label>
                          <Input
                            id="wl-client-site-count"
                            inputMode="numeric"
                            value={clientForm.activeSiteCount}
                            onChange={(event) => {
                              setClientForm((current) => ({ ...current, activeSiteCount: event.target.value }))
                            }}
                            placeholder="1"
                            disabled={isCreatingClient}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="button" onClick={handleCreateClient} disabled={isCreatingClient}>
                          {isCreatingClient ? "Creating client..." : "Create client"}
                        </Button>
                        {clientsMutationError ? <p className="text-sm text-destructive">{clientsMutationError}</p> : null}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-md border border-border/60 p-4">
                      <div>
                        <p className="text-sm font-medium">Create live checkout link</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Generates a Stripe Checkout session using destination charges to the connected account.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wl-checkout-client">Client</Label>
                        <Select
                          value={checkoutForm.clientId}
                          onValueChange={(value) => {
                            setCheckoutForm((current) => ({ ...current, clientId: value }))
                          }}
                          disabled={isCreatingCheckoutSession || clients.length === 0}
                        >
                          <SelectTrigger id="wl-checkout-client">
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.client_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wl-checkout-plan">Pricing override</Label>
                        <Select
                          value={checkoutForm.planOverrideId}
                          onValueChange={(value) => {
                            setCheckoutForm((current) => ({ ...current, planOverrideId: value }))
                          }}
                          disabled={isCreatingCheckoutSession || activePricingPlans.length === 0}
                        >
                          <SelectTrigger id="wl-checkout-plan">
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {activePricingPlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.plan_code} · {formatCents(plan.amount_sold_cents, plan.currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          onClick={handleCreateCheckoutSession}
                          disabled={
                            isCreatingCheckoutSession ||
                            !overview?.stripe.chargesEnabled ||
                            !canSellFromLaunch ||
                            !checkoutForm.clientId ||
                            !checkoutForm.planOverrideId
                          }
                        >
                          {isCreatingCheckoutSession ? "Generating link..." : "Create checkout link"}
                        </Button>
                        {!overview?.stripe.chargesEnabled ? (
                          <p className="text-sm text-muted-foreground">Enable Stripe charges before creating checkout links.</p>
                        ) : !canSellFromLaunch ? (
                          <p className="text-sm text-muted-foreground">
                            Complete go-live requirements on the Overview tab (Stripe + branding minimums) before creating
                            checkout links.
                          </p>
                        ) : null}
                      </div>
                      {checkoutMutationError ? <p className="text-sm text-destructive">{checkoutMutationError}</p> : null}
                      {lastCheckoutSession ? (
                        <div className="space-y-3 rounded-md border border-border/60 bg-background/70 p-3">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="secondary">{lastCheckoutSession.clientName}</Badge>
                            <Badge variant="outline">{lastCheckoutSession.planCode}</Badge>
                            <Badge variant="outline">
                              Sold {formatCents(lastCheckoutSession.amountSoldCents, lastCheckoutSession.currency)}
                            </Badge>
                            <Badge variant="outline">
                              Platform fee {formatCents(lastCheckoutSession.applicationFeeAmountCents, lastCheckoutSession.currency)}
                            </Badge>
                            <Badge variant="outline">
                              Net payout {formatCents(lastCheckoutSession.netPayoutCents, lastCheckoutSession.currency)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Button asChild variant="outline">
                              <a href={lastCheckoutSession.url} target="_blank" rel="noreferrer">
                                Open checkout
                              </a>
                            </Button>
                            <p className="truncate text-sm text-muted-foreground">{lastCheckoutSession.url}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {clientsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : clientsError ? (
                  <p className="text-sm text-destructive">{clientsError}</p>
                ) : clients.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Users /></EmptyMedia>
                      <EmptyTitle>No clients yet</EmptyTitle>
                      <EmptyDescription>Create your first client above to get started.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sites</TableHead>
                        <TableHead>Billing email</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.client_name}</TableCell>
                          <TableCell className="capitalize">{row.status}</TableCell>
                          <TableCell>{row.active_site_count}</TableCell>
                          <TableCell>{row.billing_email ?? "-"}</TableCell>
                          <TableCell>{formatDate(row.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Pricing & margin model</CardTitle>
                <CardDescription>
                  Formula: net payout = amount sold - (base cost + white-label fee)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canManagePricing ? (
                  <div className="mb-4 space-y-4 rounded-md border border-border/60 p-4">
                    <p className="text-sm font-medium">Create plan override</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="wl-pricing-plan-code">Plan code</Label>
                        <Input
                          id="wl-pricing-plan-code"
                          placeholder="statxeo_core"
                          value={pricingForm.planCode}
                          onChange={(event) => {
                            setPricingForm((current) => ({ ...current, planCode: event.target.value }))
                          }}
                          disabled={isCreatingPricingOverride}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wl-pricing-currency">Currency</Label>
                        <Input
                          id="wl-pricing-currency"
                          placeholder="usd"
                          value={pricingForm.currency}
                          onChange={(event) => {
                            setPricingForm((current) => ({ ...current, currency: event.target.value }))
                          }}
                          disabled={isCreatingPricingOverride}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wl-pricing-is-active">Set active on create</Label>
                        <Button
                          id="wl-pricing-is-active"
                          type="button"
                          variant={pricingForm.isActive ? "default" : "outline"}
                          onClick={() => {
                            setPricingForm((current) => ({ ...current, isActive: !current.isActive }))
                          }}
                          disabled={isCreatingPricingOverride}
                          className="w-full"
                        >
                          {pricingForm.isActive ? "Active" : "Inactive"}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wl-pricing-amount-sold">Amount sold</Label>
                        <Input
                          id="wl-pricing-amount-sold"
                          inputMode="decimal"
                          placeholder="499.00"
                          value={pricingForm.amountSold}
                          onChange={(event) => {
                            setPricingForm((current) => ({ ...current, amountSold: event.target.value }))
                          }}
                          disabled={isCreatingPricingOverride}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wl-pricing-base-cost">Base cost</Label>
                        <Input
                          id="wl-pricing-base-cost"
                          inputMode="decimal"
                          placeholder="199.00"
                          value={pricingForm.baseCost}
                          onChange={(event) => {
                            setPricingForm((current) => ({ ...current, baseCost: event.target.value }))
                          }}
                          disabled={isCreatingPricingOverride}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wl-pricing-fee">White-label fee</Label>
                        <Input
                          id="wl-pricing-fee"
                          inputMode="decimal"
                          placeholder="99.00"
                          value={pricingForm.whiteLabelFee}
                          onChange={(event) => {
                            setPricingForm((current) => ({ ...current, whiteLabelFee: event.target.value }))
                          }}
                          disabled={isCreatingPricingOverride}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Preview net payout:{" "}
                        {pricingPreviewNetPayoutCents === null
                          ? "-"
                          : formatCents(pricingPreviewNetPayoutCents, pricingForm.currency || accountCurrency)}
                      </p>
                      <Button onClick={handleCreatePricingOverride} disabled={isCreatingPricingOverride}>
                        {isCreatingPricingOverride ? "Saving override..." : "Create override"}
                      </Button>
                    </div>

                    {pricingMutationError ? <p className="text-sm text-destructive">{pricingMutationError}</p> : null}
                  </div>
                ) : null}

                {pricingLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                    ))}
                  </div>
                ) : pricingError ? (
                  <p className="text-sm text-destructive">{pricingError}</p>
                ) : pricing.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><DollarSign /></EmptyMedia>
                      <EmptyTitle>No pricing overrides</EmptyTitle>
                      <EmptyDescription>Create a plan override above to set your margins.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead>Base cost</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Net payout</TableHead>
                        <TableHead>Status</TableHead>
                        {canManagePricing ? <TableHead>Actions</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricing.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.plan_code}</TableCell>
                          <TableCell>{formatCents(row.amount_sold_cents, row.currency)}</TableCell>
                          <TableCell>{formatCents(row.base_cost_cents, row.currency)}</TableCell>
                          <TableCell>{formatCents(row.white_label_fee_cents, row.currency)}</TableCell>
                          <TableCell>{formatCents(row.net_payout_cents, row.currency)}</TableCell>
                          <TableCell>{row.is_active ? "Active" : "Inactive"}</TableCell>
                          {canManagePricing ? (
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  void handleTogglePricingOverrideStatus(row)
                                }}
                                disabled={updatingPricingId === row.id}
                              >
                                {updatingPricingId === row.id
                                  ? "Updating..."
                                  : row.is_active
                                    ? "Deactivate"
                                    : "Activate"}
                              </Button>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Invoices & charges history</CardTitle>
                <CardDescription>Charges used to compute monthly white-label payouts.</CardDescription>
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : billingError ? (
                  <p className="text-sm text-destructive">{billingError}</p>
                ) : billing.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><CreditCard /></EmptyMedia>
                      <EmptyTitle>No charges yet</EmptyTitle>
                      <EmptyDescription>Charges will appear here once clients complete checkout.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Charged at</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead>Net payout</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billing.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{formatDateTime(row.charged_at)}</TableCell>
                          <TableCell>{row.plan_code}</TableCell>
                          <TableCell className="font-mono text-xs">{row.source_event_id}</TableCell>
                          <TableCell>{formatCents(row.amount_sold_cents, row.currency)}</TableCell>
                          <TableCell>{formatCents(row.net_payout_cents, row.currency)}</TableCell>
                          <TableCell className="capitalize">{row.charge_status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Payout ledger</CardTitle>
                <CardDescription>Monthly drafts, finalized statements, and paid batches.</CardDescription>
              </CardHeader>
              <CardContent>
                {payoutMutationError ? (
                  <p className="mb-3 text-sm text-destructive">{payoutMutationError}</p>
                ) : null}
                {payoutsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : payoutsError ? (
                  <p className="text-sm text-destructive">{payoutsError}</p>
                ) : payouts.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Wallet /></EmptyMedia>
                      <EmptyTitle>No payout batches</EmptyTitle>
                      <EmptyDescription>Monthly payout drafts are generated automatically from billing activity.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Settlement month</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Adjustments</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead>Finalized</TableHead>
                        {canManagePricing ? <TableHead>Actions</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.settlement_month}</TableCell>
                          <TableCell className="capitalize">{row.status}</TableCell>
                          <TableCell>{formatCents(row.gross_amount_cents, row.currency)}</TableCell>
                          <TableCell>{formatCents(row.adjustment_amount_cents, row.currency)}</TableCell>
                          <TableCell>{formatCents(row.net_amount_cents, row.currency)}</TableCell>
                          <TableCell>{formatDateTime(row.generated_at)}</TableCell>
                          <TableCell>{formatDateTime(row.finalized_at)}</TableCell>
                          {canManagePricing ? (
                            <TableCell>
                              {row.status === "draft" || row.status === "finalized" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    void handleAdvancePayoutStatus(row)
                                  }}
                                  disabled={updatingPayoutId === row.id}
                                >
                                  {updatingPayoutId === row.id
                                    ? "Updating..."
                                    : row.status === "draft"
                                      ? "Finalize"
                                      : "Mark paid"}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Branding & domain settings</CardTitle>
                <CardDescription>White-label brand profile and connected domains.</CardDescription>
              </CardHeader>
              <CardContent>
                {brandingLoading ? (
                  <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                ) : brandingError ? (
                  <p className="text-sm text-destructive">{brandingError}</p>
                ) : (
                  <div className="space-y-6">
                    {canManageBranding ? (
                      <div className="space-y-4 rounded-md border border-border/60 p-4">
                        <p className="text-sm font-medium">Brand settings</p>
                        {Array.isArray(branding?.brand_checklist) && branding.brand_checklist.length > 0 ? (
                          <div className="space-y-2 rounded-md border border-border/50 bg-muted/30 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium">Checkout readiness checklist</p>
                              <Badge variant={branding.meets_checkout_brand_minimum ? "secondary" : "outline"}>
                                {typeof branding.brand_score_percent === "number"
                                  ? `${branding.brand_score_percent}%`
                                  : "—"}
                              </Badge>
                            </div>
                            <Progress
                              value={typeof branding.brand_score_percent === "number" ? branding.brand_score_percent : 0}
                              className="h-2"
                            />
                            <ul className="space-y-1.5 text-sm">
                              {branding.brand_checklist.map((item) => (
                                <li key={item.key} className="flex items-center gap-2">
                                  {item.complete ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                                  ) : (
                                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                                  )}
                                  <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="wl-brand-name">Brand name</Label>
                            <Input
                              id="wl-brand-name"
                              placeholder="Acme Agency"
                              value={brandingForm.brandName}
                              onChange={(e) => setBrandingForm((s) => ({ ...s, brandName: e.target.value }))}
                              disabled={isSavingBranding}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wl-support-email">Support email</Label>
                            <Input
                              id="wl-support-email"
                              type="email"
                              placeholder="support@yourco.com"
                              value={brandingForm.supportEmail}
                              onChange={(e) => setBrandingForm((s) => ({ ...s, supportEmail: e.target.value }))}
                              disabled={isSavingBranding}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wl-support-phone">Support phone</Label>
                            <Input
                              id="wl-support-phone"
                              type="tel"
                              placeholder="+1 800 000 0000"
                              value={brandingForm.supportPhone}
                              onChange={(e) => setBrandingForm((s) => ({ ...s, supportPhone: e.target.value }))}
                              disabled={isSavingBranding}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wl-logo-url">Logo URL (https)</Label>
                            <Input
                              id="wl-logo-url"
                              type="url"
                              placeholder="https://cdn.yourco.com/logo.png"
                              value={brandingForm.logoUrl}
                              onChange={(e) => setBrandingForm((s) => ({ ...s, logoUrl: e.target.value }))}
                              disabled={isSavingBranding}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wl-primary-color">Primary color</Label>
                            <Input
                              id="wl-primary-color"
                              placeholder="#3b82f6"
                              value={brandingForm.primaryColor}
                              onChange={(e) => setBrandingForm((s) => ({ ...s, primaryColor: e.target.value }))}
                              disabled={isSavingBranding}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wl-secondary-color">Secondary color</Label>
                            <Input
                              id="wl-secondary-color"
                              placeholder="#6366f1"
                              value={brandingForm.secondaryColor}
                              onChange={(e) => setBrandingForm((s) => ({ ...s, secondaryColor: e.target.value }))}
                              disabled={isSavingBranding}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {brandingMutationError ? (
                            <p className="text-sm text-destructive">{brandingMutationError}</p>
                          ) : (
                            <span />
                          )}
                          <Button onClick={handleSaveBranding} disabled={isSavingBranding}>
                            {isSavingBranding ? "Saving..." : "Save brand settings"}
                          </Button>
                        </div>
                      </div>
                    ) : branding ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border border-border/60 p-3 text-sm">
                          <p className="text-muted-foreground">Brand name</p>
                          <p className="font-medium">{branding.brand_name ?? "-"}</p>
                        </div>
                        <div className="rounded-md border border-border/60 p-3 text-sm">
                          <p className="text-muted-foreground">Support email</p>
                          <p className="font-medium">{branding.support_email ?? "-"}</p>
                        </div>
                        <div className="rounded-md border border-border/60 p-3 text-sm">
                          <p className="text-muted-foreground">Primary color</p>
                          <p className="font-medium">{branding.primary_color ?? "-"}</p>
                        </div>
                        <div className="rounded-md border border-border/60 p-3 text-sm">
                          <p className="text-muted-foreground">Secondary color</p>
                          <p className="font-medium">{branding.secondary_color ?? "-"}</p>
                        </div>
                      </div>
                    ) : null}

                    <Separator />

                    <div>
                      <p className="mb-2 text-sm font-medium">Custom domains</p>
                      {canManageBranding ? (
                        <div className="mb-3 flex items-end gap-2">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="wl-new-domain">Add domain</Label>
                            <Input
                              id="wl-new-domain"
                              placeholder="app.yourco.com"
                              value={newDomainInput}
                              onChange={(e) => setNewDomainInput(e.target.value)}
                              disabled={isAddingDomain}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void handleAddDomain()
                              }}
                            />
                          </div>
                          <Button onClick={handleAddDomain} disabled={isAddingDomain || !newDomainInput.trim()}>
                            {isAddingDomain ? "Adding..." : "Add"}
                          </Button>
                        </div>
                      ) : null}
                      {!branding || branding.domains.length === 0 ? (
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon"><Globe /></EmptyMedia>
                            <EmptyTitle>No domains configured</EmptyTitle>
                            <EmptyDescription>Add a custom domain to white-label the experience.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Domain</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Primary</TableHead>
                              {canManageBranding ? <TableHead>Actions</TableHead> : null}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {branding.domains.map((domain) => (
                              <TableRow key={domain.id}>
                                <TableCell>{domain.domain}</TableCell>
                                <TableCell className="capitalize">{domain.verification_status}</TableCell>
                                <TableCell>{domain.is_primary ? "Yes" : "No"}</TableCell>
                                {canManageBranding ? (
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => void handleRemoveDomain(domain.id)}
                                      disabled={removingDomainId === domain.id}
                                    >
                                      {removingDomainId === domain.id ? "Removing..." : "Remove"}
                                    </Button>
                                  </TableCell>
                                ) : null}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Team management</CardTitle>
                <CardDescription>Owner/admin roles can view and manage white-label users.</CardDescription>
              </CardHeader>
              <CardContent>
                {canManageTeam ? (
                  <div className="mb-4 space-y-3 rounded-md border border-border/60 p-4">
                    <p className="text-sm font-medium">Add team member</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="wl-team-user-id">User ID (UUID)</Label>
                        <Input
                          id="wl-team-user-id"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          value={teamForm.userId}
                          onChange={(e) => setTeamForm((s) => ({ ...s, userId: e.target.value }))}
                          disabled={isAddingMember}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wl-team-role">Role</Label>
                        <Select
                          value={teamForm.role}
                          onValueChange={(value) =>
                            setTeamForm((s) => ({
                              ...s,
                              role: value as "owner" | "admin" | "member",
                            }))
                          }
                          disabled={isAddingMember}
                        >
                          <SelectTrigger id="wl-team-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            {overview?.account.role === "owner" ? <SelectItem value="owner">Owner</SelectItem> : null}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {teamMutationError ? (
                        <p className="text-sm text-destructive">{teamMutationError}</p>
                      ) : (
                        <span />
                      )}
                      <Button onClick={handleAddTeamMember} disabled={isAddingMember || !teamForm.userId.trim()}>
                        {isAddingMember ? "Adding..." : "Add member"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {teamLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : teamError ? (
                  <p className="text-sm text-destructive">{teamError}</p>
                ) : team.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><UserPlus /></EmptyMedia>
                      <EmptyTitle>No team members</EmptyTitle>
                      <EmptyDescription>Invite team members to collaborate on your white-label account.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        {canManageTeam ? <TableHead>Actions</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {team.map((row) => (
                        <TableRow key={`${row.user_id}-${row.created_at}`}>
                          <TableCell className="font-mono text-xs">{row.user_id}</TableCell>
                          <TableCell className="capitalize">{row.role}</TableCell>
                          <TableCell>{row.is_active ? "Active" : "Inactive"}</TableCell>
                          <TableCell>{formatDate(row.created_at)}</TableCell>
                          {canManageTeam ? (
                            <TableCell>
                              {row.user_id !== overview?.account.userId ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void handleToggleMemberStatus(row)}
                                  disabled={updatingMemberId === row.user_id}
                                >
                                  {updatingMemberId === row.user_id
                                    ? "Updating..."
                                    : row.is_active
                                      ? "Deactivate"
                                      : "Reactivate"}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">You</span>
                              )}
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
