import { NextRequest, NextResponse } from "next/server"

import {
  buildOrderStatus,
  derivePackageName,
  getCustomerAdminSupabaseClientOrResponse,
  getAuthenticatedCustomer,
  resolveCustomerLeadIds,
} from "@/lib/statxeo/customer-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LeadStatusRow = {
  id: string | null
  status: string | null
  package_tier: string | null
}

type PurchaseRow = {
  id: string | null
  lead_id: string | null
  package_tier: string | null
  total_cents: number | null
  purchased_at: string | null
  created_at: string | null
}

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit)
  if (!Number.isFinite(parsed)) return 25
  return Math.max(1, Math.min(100, Math.floor(parsed)))
}

function parseCursor(rawCursor: string | null) {
  if (!rawCursor) return null
  const parsed = Date.parse(rawCursor)
  return Number.isFinite(parsed) ? parsed : null
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET(request: NextRequest) {
  const authContext = await getAuthenticatedCustomer()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
  const cursorTimestamp = parseCursor(request.nextUrl.searchParams.get("cursor"))

  const adminClient = getCustomerAdminSupabaseClientOrResponse()
  if (adminClient instanceof NextResponse) {
    return adminClient
  }

  const leadIds = await resolveCustomerLeadIds(adminClient, authContext.email, authContext.user.id)

  if (leadIds.length === 0) {
    return NextResponse.json({ orders: [] })
  }

  const [{ data: leadStatusData, error: leadStatusError }, { data: purchaseData, error: purchaseError }] =
    await Promise.all([
      adminClient.from("statxeo_leads").select("id, status, package_tier").in("id", leadIds),
      adminClient
        .from("statxeo_purchases")
        .select("id, lead_id, package_tier, total_cents, purchased_at, created_at")
        .in("lead_id", leadIds),
    ])

  if (leadStatusError || purchaseError) {
    return NextResponse.json(
      {
        error: "Unable to load customer orders right now.",
      },
      { status: 500 },
    )
  }

  const leadStatusRows = (Array.isArray(leadStatusData) ? leadStatusData : []) as LeadStatusRow[]
  const purchaseRows = (Array.isArray(purchaseData) ? purchaseData : []) as PurchaseRow[]

  const leadById = new Map<string, LeadStatusRow>()
  for (const row of leadStatusRows) {
    if (row.id) leadById.set(row.id, row)
  }

  const orders = purchaseRows
    .map((purchase) => {
      const lead = purchase.lead_id ? leadById.get(purchase.lead_id) : undefined
      const eventTimestamp = toTimestamp(purchase.purchased_at ?? purchase.created_at)
      return {
        id: purchase.id ?? `${purchase.lead_id ?? "order"}-${purchase.created_at ?? "unknown"}`,
        package_name: derivePackageName(purchase.package_tier ?? lead?.package_tier),
        status: buildOrderStatus(lead?.status),
        amount_cents: typeof purchase.total_cents === "number" ? purchase.total_cents : null,
        created_at: purchase.purchased_at ?? purchase.created_at ?? new Date(0).toISOString(),
        updated_at: purchase.created_at ?? purchase.purchased_at ?? null,
        _timestamp: eventTimestamp,
      }
    })
    .filter((order) => (cursorTimestamp === null ? true : order._timestamp < cursorTimestamp))
    .sort((a, b) => b._timestamp - a._timestamp || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map(({ _timestamp, ...order }) => order)

  return NextResponse.json({ orders })
}
