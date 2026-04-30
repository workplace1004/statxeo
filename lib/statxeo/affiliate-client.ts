import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export type AffiliateLinkKind = "evergreen" | "one_time"
export type AffiliateCommissionStatus = "pending" | "approved" | "paid" | "reversed"

export type AffiliateOverviewResponse = {
  affiliate: {
    id: string
    code: string
    status: "pending" | "active" | "suspended"
    displayName: string
    attributionWindowDays: number
    commissionBps: {
      statxeo_lander: number
      statxeo_core: number
      statxeo_titan: number
      boost: number
    }
  }
  stats: {
    links: {
      total: number
      active: number
    }
    conversions: {
      websitePaid: number
      boostPaid: number
      totalPaid: number
    }
    commissions: {
      totalCents: number
      pendingCents: number
      paidCents: number
      basisCents: number
    }
  }
}

export type AffiliateLink = {
  id: string
  slug: string
  kind: AffiliateLinkKind
  destination_path: string
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
  affiliateCode: string
  shareUrl: string
}

export type AffiliateLinksResponse = {
  links: AffiliateLink[]
  affiliateCode: string
}

export type CreateAffiliateLinkPayload = {
  kind?: AffiliateLinkKind
  destinationPath?: string
  maxUses?: number | null
  expiresAt?: string | null
}

export type AffiliateLedgerEntry = {
  id: string
  amount_cents: number
  currency: string
  status: AffiliateCommissionStatus
  commission_bps: number
  commission_basis_cents: number
  package_tier: string | null
  occurred_at: string
  paid_at: string | null
  approved_at: string | null
  stripe_checkout_session_id: string | null
  affiliate_link_id: string | null
}

export type AffiliateLedgerResponse = {
  affiliate: {
    id: string
    code: string
  }
  ledger: AffiliateLedgerEntry[]
  summary: {
    totalCents: number
    pendingCents: number
    paidCents: number
  }
  pageInfo: {
    hasMore: boolean
    nextCursor: string | null
  }
}

export type AffiliatePayoutsResponse = {
  affiliate?: {
    id: string
    code: string
  }
  payouts: Array<{
    id: string
    status: string
    period_start?: string | null
    period_end?: string | null
    total_cents?: number | null
    currency?: string | null
    exported_at?: string | null
    created_at?: string | null
    affiliate_total_cents?: number
    affiliate_pending_cents?: number
    affiliate_paid_cents?: number
    affiliate_commission_count?: number
    last_occurred_at?: string | null
  }>
  pageInfo?: {
    hasMore: boolean
    nextCursor: string | null
  }
}

export type AffiliateAdminAccessResponse = {
  canAccess: boolean
  role: string
  isSuperAdmin: boolean
  permissions: string[]
}

export class AffiliateApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = "AffiliateApiError"
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

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

async function resolveBrowserAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const accessToken = session?.access_token?.trim()
    return accessToken || null
  } catch {
    return null
  }
}

async function mergeRequestHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders)

  if (!headers.has("authorization")) {
    const token = await resolveBrowserAccessToken()
    if (token) {
      headers.set("authorization", `Bearer ${token}`)
    }
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

  if (status === 401) return "You need to sign in to view affiliate data."
  if (status === 403) return "You do not have permission to perform this action."
  return fallback
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await mergeRequestHeaders(init?.headers)

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new AffiliateApiError(
      getErrorMessage(payload, response.status, "Affiliate request failed."),
      response.status,
      payload,
    )
  }

  return payload as T
}

async function requestBlob(path: string, init?: RequestInit): Promise<Response> {
  const headers = await mergeRequestHeaders(init?.headers)

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await parseResponseBody(response)
    throw new AffiliateApiError(
      getErrorMessage(payload, response.status, "Affiliate export request failed."),
      response.status,
      payload,
    )
  }

  return response
}

export async function fetchAffiliateOverview() {
  return requestJson<AffiliateOverviewResponse>("/api/affiliate/overview")
}

export async function fetchAffiliateLinks() {
  return requestJson<AffiliateLinksResponse>("/api/affiliate/links")
}

export async function createAffiliateLink(payload: CreateAffiliateLinkPayload) {
  return requestJson<{ link: AffiliateLink }>("/api/affiliate/links", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchAffiliateLedger(params?: {
  status?: AffiliateCommissionStatus
  limit?: number
  cursor?: string | null
}) {
  const query = buildQueryString({
    status: params?.status,
    limit: params?.limit,
    cursor: params?.cursor ?? undefined,
  })

  return requestJson<AffiliateLedgerResponse>(`/api/affiliate/ledger${query}`)
}

export async function fetchAffiliatePayouts(params?: {
  limit?: number
  cursor?: string | null
}) {
  const query = buildQueryString({
    limit: params?.limit,
    cursor: params?.cursor ?? undefined,
  })

  return requestJson<AffiliatePayoutsResponse>(`/api/affiliate/payouts${query}`)
}

export async function fetchAffiliateAdminAccess() {
  return requestJson<AffiliateAdminAccessResponse>("/api/affiliate/admin/access")
}

function parseFilenameFromDisposition(value: string | null): string | null {
  if (!value) return null

  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)
  if (encoded?.[1]) {
    return decodeURIComponent(encoded[1])
  }

  const quoted = value.match(/filename="([^"]+)"/i)
  if (quoted?.[1]) {
    return quoted[1]
  }

  const plain = value.match(/filename=([^;]+)/i)
  if (plain?.[1]) {
    return plain[1].trim()
  }

  return null
}

export async function exportAffiliatePayoutCsv(month: string) {
  const query = buildQueryString({ month })
  const response = await requestBlob(`/api/affiliate/admin/payout-export${query}`)
  const blob = await response.blob()

  return {
    blob,
    filename: parseFilenameFromDisposition(response.headers.get("content-disposition")),
  }
}
