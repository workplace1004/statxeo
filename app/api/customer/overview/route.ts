import { NextResponse } from "next/server"

import {
  buildOrderStatus,
  derivePackageName,
  getCustomerAdminSupabaseClientOrResponse,
  getAuthenticatedCustomer,
  resolveCustomerLeadIds,
} from "@/lib/statxeo/customer-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LeadRow = {
  id: string | null
  status: string | null
  package_tier: string | null
  created_at: string | null
  updated_at: string | null
}

type PurchaseRow = {
  id: string | null
  lead_id: string | null
  package_tier: string | null
  purchased_at: string | null
  created_at: string | null
}

type CustomerPackageStatus = "active" | "pending" | "expired" | "cancelled"

function toEpochMs(value: string | null | undefined) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function resolvePackageCreatedAt(values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return new Date(0).toISOString()
}

function derivePackageStatus(leadStatus: string | null | undefined): CustomerPackageStatus {
  const normalized = (leadStatus ?? "").trim().toLowerCase()
  if (normalized === "expired") return "expired"

  const orderStatus = buildOrderStatus(leadStatus)
  if (orderStatus === "cancelled") return "cancelled"
  if (orderStatus === "pending") return "pending"
  return "active"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export async function GET() {
  const authContext = await getAuthenticatedCustomer()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const adminClient = getCustomerAdminSupabaseClientOrResponse()
  if (adminClient instanceof NextResponse) {
    return adminClient
  }

  const leadIds = await resolveCustomerLeadIds(adminClient, authContext.email, authContext.user.id)

  const metadata = isRecord(authContext.user.user_metadata) ? authContext.user.user_metadata : {}
  const accountName =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    undefined

  const account = {
    id: authContext.user.id,
    email: authContext.email,
    name: accountName,
  }

  if (leadIds.length === 0) {
    return NextResponse.json({ account, packages: [] })
  }

  const [{ data: leadsData, error: leadsError }, { data: purchasesData, error: purchasesError }] = await Promise.all([
    adminClient
      .from("statxeo_leads")
      .select("id, status, package_tier, created_at, updated_at")
      .in("id", leadIds),
    adminClient
      .from("statxeo_purchases")
      .select("id, lead_id, package_tier, purchased_at, created_at")
      .in("lead_id", leadIds),
  ])

  if (leadsError || purchasesError) {
    return NextResponse.json(
      {
        error: "Unable to load customer overview right now.",
      },
      { status: 500 },
    )
  }

  const leads = (Array.isArray(leadsData) ? leadsData : []) as LeadRow[]
  const purchases = (Array.isArray(purchasesData) ? purchasesData : []) as PurchaseRow[]

  const leadById = new Map<string, LeadRow>()
  for (const lead of leads) {
    if (lead.id) leadById.set(lead.id, lead)
  }

  const purchasePackages = purchases
    .map((purchase) => {
      const lead = purchase.lead_id ? leadById.get(purchase.lead_id) : undefined
      return {
        id: purchase.id ?? `${purchase.lead_id ?? "purchase"}-${purchase.created_at ?? "unknown"}`,
        name: derivePackageName(purchase.package_tier ?? lead?.package_tier),
        status: derivePackageStatus(lead?.status),
        expires_at: null,
        created_at: resolvePackageCreatedAt([
          purchase.purchased_at,
          purchase.created_at,
          lead?.created_at,
          lead?.updated_at,
        ]),
      }
    })
    .sort((a, b) => toEpochMs(b.created_at) - toEpochMs(a.created_at) || a.id.localeCompare(b.id))

  const leadFallbackPackages = leads
    .map((lead) => ({
      id: lead.id ?? `lead-${lead.created_at ?? "unknown"}`,
      name: derivePackageName(lead.package_tier),
      status: derivePackageStatus(lead.status),
      expires_at: null,
      created_at: resolvePackageCreatedAt([lead.created_at, lead.updated_at]),
    }))
    .sort((a, b) => toEpochMs(b.created_at) - toEpochMs(a.created_at) || a.id.localeCompare(b.id))

  return NextResponse.json({
    account,
    packages: purchasePackages.length > 0 ? purchasePackages : leadFallbackPackages,
  })
}
