import { NextRequest, NextResponse } from "next/server"

import {
  getCustomerAdminSupabaseClientOrResponse,
  getAuthenticatedCustomer,
  resolveCustomerLeadIds,
} from "@/lib/statxeo/customer-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LeadImageRow = {
  id: string | null
  sort_order: number | null
  created_at: string | null
  public_url: string | null
}

type CustomerDocumentRow = {
  id: string | null
  title: string | null
  uploaded_at: string | null
  public_url: string | null
}

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit)
  if (!Number.isFinite(parsed)) return 100
  return Math.max(1, Math.min(250, Math.floor(parsed)))
}

function parseCursorTimestamp(rawCursor: string | null) {
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
  const cursorTimestamp = parseCursorTimestamp(request.nextUrl.searchParams.get("cursor"))

  const adminClient = getCustomerAdminSupabaseClientOrResponse()
  if (adminClient instanceof NextResponse) {
    return adminClient
  }

  const leadIds = await resolveCustomerLeadIds(adminClient, authContext.email, authContext.user.id)

  if (leadIds.length === 0) {
    return NextResponse.json({ documents: [] })
  }

  const { data, error } = await adminClient
    .from("statxeo_customer_documents")
    .select("id, title, uploaded_at, public_url")
    .in("lead_id", leadIds)
    .order("uploaded_at", { ascending: false })

  if (error) {
    return NextResponse.json(
      {
        error: "Unable to load customer documents right now.",
      },
      { status: 500 },
    )
  }

  const tableRows = (Array.isArray(data) ? data : []) as CustomerDocumentRow[]
  if (tableRows.length > 0) {
    const documents = tableRows
      .map((row, index) => {
        const uploadedAt = row.uploaded_at ?? new Date(0).toISOString()
        const title = typeof row.title === "string" && row.title.trim().length > 0
          ? row.title.trim()
          : `Document #${index + 1}`

        return {
          id: row.id ?? `document-${index + 1}`,
          name: title,
          uploaded_at: uploadedAt,
          url: typeof row.public_url === "string" && row.public_url.length > 0 ? row.public_url : undefined,
          _timestamp: toTimestamp(uploadedAt),
        }
      })
      .filter((document) => (cursorTimestamp === null ? true : document._timestamp < cursorTimestamp))
      .sort((a, b) => b._timestamp - a._timestamp || a.id.localeCompare(b.id))
      .slice(0, limit)
      .map(({ _timestamp, ...document }) => document)

    return NextResponse.json({ documents })
  }

  const { data: legacyData, error: legacyError } = await adminClient
    .from("statxeo_lead_images")
    .select("id, sort_order, created_at, public_url")
    .in("lead_id", leadIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (legacyError) {
    return NextResponse.json(
      {
        error: "Unable to load customer documents right now.",
      },
      { status: 500 },
    )
  }

  const rows = (Array.isArray(legacyData) ? legacyData : []) as LeadImageRow[]

  const documents = rows
    .map((row, index) => {
      const uploadAt = row.created_at ?? new Date(0).toISOString()
      const sortOrder = typeof row.sort_order === "number" && Number.isFinite(row.sort_order) ? row.sort_order : index + 1
      return {
        id: row.id ?? `document-${index + 1}`,
        name: `Asset #${sortOrder}`,
        uploaded_at: uploadAt,
        url: typeof row.public_url === "string" && row.public_url.length > 0 ? row.public_url : undefined,
        _timestamp: toTimestamp(uploadAt),
      }
    })
    .filter((document) => (cursorTimestamp === null ? true : document._timestamp < cursorTimestamp))
    .sort((a, b) => b._timestamp - a._timestamp || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map(({ _timestamp, ...document }) => document)

  return NextResponse.json({ documents })
}
