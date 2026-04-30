"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import {
  describePortalError,
  formatCentsForInput,
  parseDollarsInputToCents,
  pathnameToSegment,
} from "@/components/white-labeler/portal-utils"
import {
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

export type CheckoutSessionSummary = {
  sessionId: string
  url: string
  clientName: string
  planCode: string
  currency: string
  amountSoldCents: number
  applicationFeeAmountCents: number
  netPayoutCents: number
}
function useWhiteLabelerPortalValue() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const segment = pathnameToSegment(pathname ?? "")
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
  const [updatingMemberRoleId, setUpdatingMemberRoleId] = useState<string | null>(null)
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
      setOverviewError(describePortalError(error, "Unable to load overview."))
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
      setClientsError(describePortalError(error, "Unable to load clients."))
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
      setPricingError(describePortalError(error, "Unable to load pricing overrides."))
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
      setBillingError(describePortalError(error, "Unable to load billing history."))
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
      setPayoutsError(describePortalError(error, "Unable to load payouts."))
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
      setBrandingError(describePortalError(error, "Unable to load branding settings."))
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
      setTeamError(describePortalError(error, "Unable to load team settings."))
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

  const stripeReturnQuery = searchParams.get("stripe")

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
    if (!stripeReturnQuery) return
    void loadOverview()
  }, [stripeReturnQuery, loadOverview])

  const refreshCurrentPage = useCallback(async () => {
    setIsRefreshing(true)

    try {
      const seg = pathnameToSegment(pathname ?? "")
      if (seg === "home") {
        await Promise.all([loadOverview(), loadBilling(), loadClients(), loadPayouts()])
      } else if (seg === "account") {
        await loadOverview()
      } else if (seg === "clients") {
        await Promise.all([loadClients(), loadOverview(), loadPricing()])
      } else if (seg === "pricing") {
        await loadPricing()
      } else if (seg === "billing") {
        await loadBilling()
      } else if (seg === "payouts") {
        await loadPayouts()
      } else if (seg === "branding") {
        await Promise.all([loadBranding(), loadOverview()])
      } else if (seg === "team") {
        await loadTeam()
      } else {
        await loadOverview()
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [
    pathname,
    loadOverview,
    loadClients,
    loadPricing,
    loadBilling,
    loadPayouts,
    loadBranding,
    loadTeam,
  ])

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)

    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      router.replace("/white-labeler/login")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }, [router])

  const handleCreatePricingOverride = useCallback(async (): Promise<boolean> => {
    if (!canManagePricing) {
      setPricingMutationError("Only owners and admins can manage plan pricing.")
      return false
    }

    setPricingMutationError("")

    const planCode = pricingForm.planCode.trim().toLowerCase()
    const currency = pricingForm.currency.trim().toLowerCase()
    const amountSoldCents = parseDollarsInputToCents(pricingForm.amountSold)
    const baseCostCents = parseDollarsInputToCents(pricingForm.baseCost)
    const whiteLabelFeeCents = parseDollarsInputToCents(pricingForm.whiteLabelFee)

    if (!planCode) {
      setPricingMutationError("Plan code is required.")
      return false
    }

    if (amountSoldCents === null || baseCostCents === null || whiteLabelFeeCents === null) {
      setPricingMutationError("Amounts must be valid positive numbers.")
      return false
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
      return true
    } catch (error) {
      setPricingMutationError(describePortalError(error, "Unable to create pricing override."))
      return false
    } finally {
      setIsCreatingPricingOverride(false)
    }
  }, [canManagePricing, pricingForm, loadPricing])

  const handleCreateClient = useCallback(async (): Promise<boolean> => {
    if (!canManageClients) {
      setClientsMutationError("Only owners and admins can create clients.")
      return false
    }

    const clientName = clientForm.clientName.trim()
    const billingEmail = clientForm.billingEmail.trim()
    const externalCustomerId = clientForm.externalCustomerId.trim()
    const activeSiteCount = Number(clientForm.activeSiteCount)

    if (!clientName) {
      setClientsMutationError("Client name is required.")
      return false
    }

    if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
      setClientsMutationError("Billing email must be valid.")
      return false
    }

    if (!Number.isFinite(activeSiteCount) || activeSiteCount < 0) {
      setClientsMutationError("Active sites must be zero or greater.")
      return false
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
      return true
    } catch (error) {
      setClientsMutationError(describePortalError(error, "Unable to create client."))
      return false
    } finally {
      setIsCreatingClient(false)
    }
  }, [canManageClients, clientForm, loadClients, loadOverview])

  const handleCreateCheckoutSession = useCallback(
    async (override?: { clientId: string; planOverrideId: string }) => {
      if (!canManageClients) {
        setCheckoutMutationError("Only owners and admins can create checkout links.")
        return
      }

      const clientId = override?.clientId ?? checkoutForm.clientId
      const planOverrideId = override?.planOverrideId ?? checkoutForm.planOverrideId

      if (!clientId || !planOverrideId) {
        setCheckoutMutationError("Select both a client and a plan.")
        return
      }

      setCheckoutMutationError("")
      setIsCreatingCheckoutSession(true)

      try {
        const response = await createWhiteLabelerCheckoutSession({
          client_id: clientId,
          plan_override_id: planOverrideId,
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
        setCheckoutMutationError(describePortalError(error, "Unable to create checkout session."))
      } finally {
        setIsCreatingCheckoutSession(false)
      }
    },
    [canManageClients, checkoutForm.clientId, checkoutForm.planOverrideId, loadOverview],
  )

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
      setStripeMutationError(describePortalError(error, "Unable to open Stripe onboarding."))
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
      setStripeMutationError(describePortalError(error, "Unable to open the Stripe Express dashboard."))
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
      setPricingMutationError(describePortalError(error, "Unable to update pricing override."))
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
      setBrandingMutationError(describePortalError(error, "Unable to save branding settings."))
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
      setBrandingMutationError(describePortalError(error, "Unable to add domain."))
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
      setBrandingMutationError(describePortalError(error, "Unable to remove domain."))
    } finally {
      setRemovingDomainId(null)
    }
  }

  const canManageTeam = useMemo(() => {
    return overview?.account.role === "owner" || overview?.account.role === "admin"
  }, [overview])

  const handleAddTeamMember = useCallback(async (): Promise<boolean> => {
    if (!canManageTeam) {
      setTeamMutationError("Only owners and admins can manage team members.")
      return false
    }

    const userId = teamForm.userId.trim()
    if (!userId) {
      setTeamMutationError("User ID is required.")
      return false
    }

    setTeamMutationError("")
    setIsAddingMember(true)

    try {
      await addWhiteLabelerTeamMember({ user_id: userId, role: teamForm.role })
      setTeamForm({ userId: "", role: "member" })
      await loadTeam()
      return true
    } catch (error) {
      setTeamMutationError(describePortalError(error, "Unable to add team member."))
      return false
    } finally {
      setIsAddingMember(false)
    }
  }, [canManageTeam, teamForm, loadTeam])

  const handleUpdateMemberRole = useCallback(
    async (row: WhiteLabelerTeamMember, role: "owner" | "admin" | "member") => {
      if (!canManageTeam) {
        setTeamMutationError("Only owners and admins can manage team members.")
        return
      }
      if (row.user_id === overview?.account.userId) {
        setTeamMutationError("You cannot change your own role here.")
        return
      }
      if (role === "owner" && overview?.account.role !== "owner") {
        setTeamMutationError("Only the workspace owner can assign the owner role.")
        return
      }

      setTeamMutationError("")
      setUpdatingMemberRoleId(row.user_id)

      try {
        await updateWhiteLabelerTeamMember({ user_id: row.user_id, role })
        await loadTeam()
        await loadOverview()
      } catch (error) {
        setTeamMutationError(describePortalError(error, "Unable to update member role."))
      } finally {
        setUpdatingMemberRoleId(null)
      }
    },
    [canManageTeam, overview?.account.role, overview?.account.userId, loadTeam, loadOverview],
  )

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
      setTeamMutationError(describePortalError(error, "Unable to update team member."))
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
      setPayoutMutationError(describePortalError(error, "Unable to update payout status."))
    } finally {
      setUpdatingPayoutId(null)
    }
  }

  return {
    pathname: pathname ?? "",
    segment,
    stripeReturnQuery,
    overview,
    overviewLoading,
    overviewError,
    loadOverview,
    clients,
    clientsLoading,
    clientsError,
    clientsMutationError,
    isCreatingClient,
    clientForm,
    setClientForm,
    checkoutMutationError,
    isCreatingCheckoutSession,
    checkoutForm,
    setCheckoutForm,
    lastCheckoutSession,
    setLastCheckoutSession,
    pricing,
    pricingLoading,
    pricingError,
    pricingMutationError,
    isCreatingPricingOverride,
    updatingPricingId,
    pricingForm,
    setPricingForm,
    pricingPreviewNetPayoutCents,
    billing,
    billingLoading,
    billingError,
    payouts,
    payoutsLoading,
    payoutsError,
    branding,
    brandingLoading,
    brandingError,
    brandingMutationError,
    isSavingBranding,
    newDomainInput,
    setNewDomainInput,
    isAddingDomain,
    removingDomainId,
    brandingForm,
    setBrandingForm,
    team,
    teamLoading,
    teamError,
    teamMutationError,
    isAddingMember,
    updatingMemberId,
    updatingMemberRoleId,
    teamForm,
    setTeamForm,
    payoutMutationError,
    updatingPayoutId,
    isRefreshing,
    refreshCurrentPage,
    isSigningOut,
    handleSignOut,
    stripeMutationError,
    isOpeningStripeOnboarding,
    accountCurrency,
    canManagePricing,
    canManageClients,
    canSellFromLaunch,
    activePricingPlans,
    canManageBranding,
    canManageTeam,
    loadClients,
    loadPricing,
    loadBilling,
    loadPayouts,
    loadBranding,
    loadTeam,
    handleCreatePricingOverride,
    handleCreateClient,
    handleCreateCheckoutSession,
    handleOpenStripeOnboarding,
    handleOpenStripeDashboard,
    handleTogglePricingOverrideStatus,
    handleSaveBranding,
    handleAddDomain,
    handleRemoveDomain,
    handleAddTeamMember,
    handleToggleMemberStatus,
    handleUpdateMemberRole,
    handleAdvancePayoutStatus,
  }
}

export type WhiteLabelerPortalContextValue = ReturnType<typeof useWhiteLabelerPortalValue>

const WhiteLabelerPortalContext = createContext<WhiteLabelerPortalContextValue | null>(null)

export function WhiteLabelerPortalProvider({ children }: { children: ReactNode }) {
  const value = useWhiteLabelerPortalValue()
  return <WhiteLabelerPortalContext.Provider value={value}>{children}</WhiteLabelerPortalContext.Provider>
}

export function useWhiteLabelerPortal() {
  const ctx = useContext(WhiteLabelerPortalContext)
  if (!ctx) {
    throw new Error("useWhiteLabelerPortal must be used within WhiteLabelerPortalProvider")
  }
  return ctx
}
