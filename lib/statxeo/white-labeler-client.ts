import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export type WhiteLabelerLaunchBlocker = {
  code: string
  message: string
}

export type WhiteLabelerBrandChecklistItem = {
  key: "brand_name" | "primary_color" | "secondary_color" | "logo_url" | "support_email"
  label: string
  complete: boolean
}

export type WhiteLabelerLaunchReadinessSummary = {
  canSell: boolean
  blockers: WhiteLabelerLaunchBlocker[]
  brandChecklist: WhiteLabelerBrandChecklistItem[]
  brandScorePercent: number
  stripeChargesEnabled: boolean
  accountStatus: string | null
}

export type WhiteLabelerOverviewResponse = {
  account: {
    id: string
    userId: string
    role: "owner" | "admin" | "member"
    displayName: string
    currency: string
    status: string
  }
  period: {
    settlementMonth: string
  }
  stripe: {
    isConfigured: boolean
    accountId: string | null
    status: "not_started" | "pending" | "restricted" | "active"
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
    country: string | null
    email: string | null
    requirements: {
      currentlyDue: string[]
      eventuallyDue: string[]
      pastDue: string[]
      pendingVerification: string[]
      disabledReason: string | null
      errors: Array<{
        code: string | null
        reason: string | null
        requirement: string | null
      }>
    }
    connectedAt: string | null
    lastSyncedAt: string | null
    needsAttention: boolean
  }
  onboarding: {
    isComplete: boolean
    currentStep: "organization" | "branding" | "stripe" | "domain" | "workspace" | "team" | "first_client" | "completed"
    completedSteps: number
    totalSteps: number
    percentComplete: number
    steps: Array<{
      key: "organization" | "branding" | "stripe" | "domain" | "workspace" | "team" | "first_client"
      label: string
      description: string
      complete: boolean
    }>
  }
  launchReadiness: WhiteLabelerLaunchReadinessSummary
  kpis: {
    activeClients: number
    activeSites: number
    monthRevenueCents: number
    monthNetPayoutCents: number
    outstandingDraftPayoutCents: number
  }
}

export type WhiteLabelerClient = {
  id: string
  client_name: string
  external_customer_id?: string | null
  billing_email: string | null
  status: "active" | "paused" | "cancelled"
  active_site_count: number
  created_at: string
}

export type CreateWhiteLabelerClientInput = {
  client_name: string
  billing_email?: string
  external_customer_id?: string
  active_site_count?: number
}

export type WhiteLabelerPlanOverride = {
  id: string
  plan_code: string
  currency: string
  amount_sold_cents: number
  base_cost_cents: number
  white_label_fee_cents: number
  net_payout_cents: number
  is_active: boolean
  effective_from: string
  effective_to: string | null
}

export type CreateWhiteLabelerPlanOverrideInput = {
  plan_code: string
  currency: string
  amount_sold_cents: number
  base_cost_cents: number
  white_label_fee_cents: number
  is_active?: boolean
  effective_from?: string
}

export type UpdateWhiteLabelerPlanOverrideInput = {
  id: string
  currency?: string
  amount_sold_cents?: number
  base_cost_cents?: number
  white_label_fee_cents?: number
  is_active?: boolean
  effective_to?: string | null
}

export type WhiteLabelerCharge = {
  id: string
  source_event_id: string
  plan_code: string
  settlement_month: string
  charged_at: string
  currency: string
  amount_sold_cents: number
  base_cost_cents: number
  white_label_fee_cents: number
  net_payout_cents: number
  charge_status: string
}

export type WhiteLabelerPayoutBatch = {
  id: string
  settlement_month: string
  status: "draft" | "finalized" | "paid" | "voided"
  currency: string
  gross_amount_cents: number
  adjustment_amount_cents: number
  net_amount_cents: number
  generated_at: string
  finalized_at: string | null
  paid_at: string | null
}

export type WhiteLabelerBrandingResponse = {
  brand_name: string | null
  primary_color: string | null
  secondary_color: string | null
  logo_url: string | null
  support_email: string | null
  support_phone: string | null
  domains: Array<{
    id: string
    domain: string
    verification_status: string
    is_primary: boolean
  }>
  brand_checklist?: WhiteLabelerBrandChecklistItem[]
  brand_score_percent?: number
  meets_checkout_brand_minimum?: boolean
}

export type WhiteLabelerTeamMember = {
  user_id: string
  role: "owner" | "admin" | "member"
  is_active: boolean
  created_at: string
}

export type CreateWhiteLabelerApplicationInput = {
  contactFullName: string
  contactEmail: string
  companyName: string
  companyWebsite?: string
  desiredSlug?: string
  referredBy?: string
  notes?: string
}

export type WhiteLabelerApplicationResponse = {
  application: {
    id: string
    status: "pending_review" | "approved" | "rejected"
    created_at: string
    company_name: string
  }
}

export type WhiteLabelerAdminApplication = {
  id: string
  status: "pending_review" | "approved" | "invited" | "rejected"
  contact_full_name: string
  contact_email: string
  company_name: string
  company_website: string | null
  desired_slug: string | null
  referred_by: string | null
  notes: string | null
  review_notes: string | null
  reviewed_by_user_id: string | null
  reviewed_at: string | null
  approved_white_labeler_id: string | null
  created_at: string
}

export type ReviewWhiteLabelerApplicationInput = {
  application_id: string
  decision: "approve" | "reject"
  review_notes?: string
  display_name?: string
  slug?: string
  owner_password?: string
  plan_code?: string
}

export type SendWhiteLabelerApplicationInviteInput = {
  application_id: string
}

export type WhiteLabelerApplicationApprovalResponse = {
  application: {
    id: string
    status: "pending_review" | "approved" | "invited" | "rejected"
  }
  approval?: {
    applicationId: string
    ownerUserId: string
    ownerEmail: string
    temporaryPassword: string | null
    whiteLabelerId: string
    slug: string
    createdOwnerUser: boolean
    createdWhiteLabeler: boolean
  }
  message: string
}

export type WhiteLabelerCheckoutSessionResponse = {
  session: {
    sessionId: string
    url: string
    clientId: string
    clientName: string
    planOverrideId: string
    planCode: string
    currency: string
    amountSoldCents: number
    applicationFeeAmountCents: number
    netPayoutCents: number
  }
}

export class WhiteLabelerApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = "WhiteLabelerApiError"
    this.status = status
    this.payload = payload
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function buildQueryString(params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue
    query.set(key, String(value))
  }

  const output = query.toString()
  return output ? `?${output}` : ""
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

async function renderRequestHeaders(initHeaders?: HeadersInit): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  }

  try {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token) {
      headers.authorization = `Bearer ${session.access_token}`
    }
  } catch {
    // Session resolution failed; request will proceed without auth.
  }

  if (initHeaders instanceof Headers) {
    initHeaders.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })
  } else if (Array.isArray(initHeaders)) {
    for (const [key, value] of initHeaders) {
      headers[key.toLowerCase()] = value
    }
  } else if (initHeaders && typeof initHeaders === "object") {
    Object.assign(headers, initHeaders)
  }

  return headers
}

function getErrorMessage(payload: unknown, status: number, fallback: string) {
  if (isRecord(payload)) {
    if (typeof payload.error === "string" && payload.error.trim().length > 0) {
      return payload.error
    }

    if (typeof payload.message === "string" && payload.message.trim().length > 0) {
      return payload.message
    }
  }

  if (status === 401) return "You need to sign in to view white-label data."
  if (status === 403) return "You do not have permission to perform this action."
  return fallback
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await renderRequestHeaders(init?.headers)

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new WhiteLabelerApiError(
      getErrorMessage(payload, response.status, "White-label request failed."),
      response.status,
      payload,
    )
  }

  return payload as T
}

export async function fetchWhiteLabelerOverview() {
  return requestJson<WhiteLabelerOverviewResponse>("/api/white-labeler/overview")
}

export async function createWhiteLabelerStripeAccountLink() {
  return requestJson<{ accountId: string; status: "not_started" | "pending" | "restricted" | "active"; url: string }>(
    "/api/white-labeler/stripe/account-link",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    },
  )
}

export async function createWhiteLabelerStripeDashboardLink() {
  return requestJson<{ accountId: string; url: string }>("/api/white-labeler/stripe/dashboard-link", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  })
}

export async function createWhiteLabelerCheckoutSession(payload: {
  client_id: string
  plan_override_id: string
}) {
  return requestJson<WhiteLabelerCheckoutSessionResponse>("/api/white-labeler/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export async function createWhiteLabelerApplication(payload: CreateWhiteLabelerApplicationInput) {
  return requestJson<WhiteLabelerApplicationResponse>("/api/white-labeler/apply", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchWhiteLabelerApplicationsAdmin(params?: {
  status?: "pending_review" | "approved" | "invited" | "rejected"
  limit?: number
}) {
  const query = buildQueryString({
    status: params?.status,
    limit: params?.limit,
  })

  return requestJson<{ applications: WhiteLabelerAdminApplication[] }>(`/api/white-labeler/admin/applications${query}`)
}

export async function reviewWhiteLabelerApplication(payload: ReviewWhiteLabelerApplicationInput) {
  return requestJson<WhiteLabelerApplicationApprovalResponse>("/api/white-labeler/admin/applications", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export async function sendWhiteLabelerApplicationInvite(payload: SendWhiteLabelerApplicationInviteInput) {
  return requestJson<{ message: string }>("/api/white-labeler/admin/applications/invite", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchWhiteLabelerClients(params?: { limit?: number }) {
  const query = buildQueryString({ limit: params?.limit })
  return requestJson<{ clients: WhiteLabelerClient[] }>(`/api/white-labeler/clients${query}`)
}

export async function createWhiteLabelerClient(payload: CreateWhiteLabelerClientInput) {
  const data = await requestJson<unknown>("/api/white-labeler/clients", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (isRecord(data) && isRecord(data.client)) {
    return data.client as WhiteLabelerClient
  }

  throw new WhiteLabelerApiError("Unexpected client create response.", 500, data)
}

export async function fetchWhiteLabelerPricing() {
  return requestJson<{ plans: WhiteLabelerPlanOverride[] }>("/api/white-labeler/pricing")
}

export async function createWhiteLabelerPricingOverride(payload: CreateWhiteLabelerPlanOverrideInput) {
  const data = await requestJson<unknown>("/api/white-labeler/pricing", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (isRecord(data) && isRecord(data.plan)) {
    return data.plan as WhiteLabelerPlanOverride
  }

  throw new WhiteLabelerApiError("Unexpected pricing override response.", 500, data)
}

export async function updateWhiteLabelerPricingOverride(payload: UpdateWhiteLabelerPlanOverrideInput) {
  const data = await requestJson<unknown>("/api/white-labeler/pricing", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (isRecord(data) && isRecord(data.plan)) {
    return data.plan as WhiteLabelerPlanOverride
  }

  throw new WhiteLabelerApiError("Unexpected pricing override response.", 500, data)
}

export async function fetchWhiteLabelerBillingHistory(params?: {
  limit?: number
  month?: string
}) {
  const query = buildQueryString({
    limit: params?.limit,
    month: params?.month,
  })

  return requestJson<{ charges: WhiteLabelerCharge[] }>(`/api/white-labeler/billing${query}`)
}

export async function fetchWhiteLabelerPayouts(params?: { limit?: number }) {
  const query = buildQueryString({ limit: params?.limit })
  return requestJson<{ payouts: WhiteLabelerPayoutBatch[] }>(`/api/white-labeler/payouts${query}`)
}

export async function fetchWhiteLabelerBranding() {
  return requestJson<WhiteLabelerBrandingResponse>("/api/white-labeler/branding")
}

export type UpdateWhiteLabelerBrandingInput = {
  brand_name?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  logo_url?: string | null
  support_email?: string | null
  support_phone?: string | null
}

export async function updateWhiteLabelerBranding(payload: UpdateWhiteLabelerBrandingInput) {
  const data = await requestJson<unknown>("/api/white-labeler/branding", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  if (isRecord(data) && isRecord(data.branding)) {
    return data.branding as WhiteLabelerBrandingResponse
  }

  throw new WhiteLabelerApiError("Unexpected branding update response.", 500, data)
}

export async function addWhiteLabelerDomain(domain: string) {
  const data = await requestJson<unknown>("/api/white-labeler/branding", {
    method: "POST",
    body: JSON.stringify({ domain }),
  })

  if (isRecord(data) && isRecord(data.domain)) {
    return data.domain as WhiteLabelerBrandingResponse["domains"][number]
  }

  throw new WhiteLabelerApiError("Unexpected domain add response.", 500, data)
}

export async function removeWhiteLabelerDomain(domainId: string) {
  await requestJson<unknown>("/api/white-labeler/branding", {
    method: "DELETE",
    body: JSON.stringify({ domain_id: domainId }),
  })
}

export async function fetchWhiteLabelerTeam() {
  return requestJson<{ members: WhiteLabelerTeamMember[] }>("/api/white-labeler/team")
}

export type AddWhiteLabelerTeamMemberInput = {
  user_id: string
  role?: "owner" | "admin" | "member"
}

export type UpdateWhiteLabelerTeamMemberInput = {
  user_id: string
  role?: "owner" | "admin" | "member"
  is_active?: boolean
}

export async function addWhiteLabelerTeamMember(payload: AddWhiteLabelerTeamMemberInput) {
  const data = await requestJson<unknown>("/api/white-labeler/team", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (isRecord(data) && isRecord(data.member)) {
    return data.member as WhiteLabelerTeamMember
  }

  throw new WhiteLabelerApiError("Unexpected team member add response.", 500, data)
}

export async function updateWhiteLabelerTeamMember(payload: UpdateWhiteLabelerTeamMemberInput) {
  const data = await requestJson<unknown>("/api/white-labeler/team", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  if (isRecord(data) && isRecord(data.member)) {
    return data.member as WhiteLabelerTeamMember
  }

  throw new WhiteLabelerApiError("Unexpected team member update response.", 500, data)
}

export type UpdateWhiteLabelerPayoutStatusInput = {
  id: string
  status: "finalized" | "paid"
}

export type WhiteLabelerDemoSeedAccessResponse = {
  can_seed_demo_white_labeler: boolean
  seed_demo_enabled?: boolean
  actor_user_id: string
  reason?: string | null
}

export type WhiteLabelerDemoSeedRun = {
  id: string
  white_labeler_id: string
  actor_user_id: string | null
  created_at: string | null
  slug: string
  created_owner_user: boolean
  created_white_labeler: boolean
  inserted_sample_clients: number
  inserted_sample_charges: number
  created_payout_batch: boolean
}

export type SeedDemoWhiteLabelerInput = {
  display_name: string
  owner_email: string
  owner_password?: string
  slug?: string
  plan_code?: string
  create_sample_data?: boolean
}

export type SeedDemoWhiteLabelerResponse = {
  seed: {
    ownerUserId: string
    whiteLabelerId: string
    slug: string
    createdOwnerUser: boolean
    createdWhiteLabeler: boolean
    insertedSampleClients: number
    insertedSampleCharges: number
    createdPayoutBatch: boolean
  }
  message: string
}

export async function updateWhiteLabelerPayoutStatus(payload: UpdateWhiteLabelerPayoutStatusInput) {
  const data = await requestJson<unknown>("/api/white-labeler/payouts", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  if (isRecord(data) && isRecord(data.payout)) {
    return data.payout as WhiteLabelerPayoutBatch
  }

  throw new WhiteLabelerApiError("Unexpected payout status update response.", 500, data)
}

export async function fetchWhiteLabelerDemoSeedAccess() {
  return requestJson<WhiteLabelerDemoSeedAccessResponse>("/api/white-labeler/admin/seed-demo")
}

export async function seedDemoWhiteLabeler(payload: SeedDemoWhiteLabelerInput) {
  return requestJson<SeedDemoWhiteLabelerResponse>("/api/white-labeler/admin/seed-demo", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function fetchWhiteLabelerDemoSeedRuns() {
  return requestJson<{ runs: WhiteLabelerDemoSeedRun[] }>("/api/white-labeler/admin/seed-runs")
}
