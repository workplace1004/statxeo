import { NextRequest, NextResponse } from "next/server"

import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
} from "@/lib/statxeo/white-labeler-server"
import { enforceWhiteLabelerWriteRateLimit } from "@/lib/statxeo/white-labeler-rate-limit"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit)
  if (!Number.isFinite(parsed)) return 100
  return Math.max(1, Math.min(500, Math.floor(parsed)))
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeOptionalEmail(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null
  return trimmed
}

function normalizeActiveSiteCount(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.max(0, Math.min(10_000, Math.floor(parsed)))
}

export async function GET(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
  const adminClient = createAdminSupabaseClient()

  const { data, error } = await adminClient
    .from("statxeo_white_labeler_clients")
    .select("id, client_name, billing_email, status, active_site_count, created_at")
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: "Unable to load white-labeler clients right now." }, { status: 500 })
  }

  return NextResponse.json({ clients: Array.isArray(data) ? data : [] })
}

export async function POST(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    return forbiddenWhiteLabelerResponse()
  }

  const rateLimitResponse = await enforceWhiteLabelerWriteRateLimit({
    request,
    whiteLabelerId: authContext.whiteLabelerId,
    userId: authContext.user.id,
    scope: "clients.create",
    limit: 20,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const body = await request.json().catch(() => null)
  const clientName = normalizeOptionalText((body as Record<string, unknown> | null)?.client_name)
  const billingEmail = normalizeOptionalEmail((body as Record<string, unknown> | null)?.billing_email)
  const externalCustomerId = normalizeOptionalText((body as Record<string, unknown> | null)?.external_customer_id)
  const activeSiteCount = normalizeActiveSiteCount((body as Record<string, unknown> | null)?.active_site_count)

  if (!clientName) {
    return NextResponse.json({ error: "client_name is required." }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_clients")
    .insert({
      white_labeler_id: authContext.whiteLabelerId,
      external_customer_id: externalCustomerId,
      client_name: clientName,
      billing_email: billingEmail,
      status: "active",
      active_site_count: activeSiteCount,
    })
    .select("id, client_name, billing_email, status, active_site_count, created_at")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That external customer id already exists." }, { status: 409 })
    }

    return NextResponse.json({ error: "Unable to create white-label client right now." }, { status: 500 })
  }

  const { count } = await adminClient
    .from("statxeo_white_labeler_clients")
    .select("id", { count: "exact", head: true })
    .eq("white_labeler_id", authContext.whiteLabelerId)

  if ((count ?? 0) > 0) {
    await adminClient
      .from("statxeo_white_labelers")
      .update({
        first_client_created_at: new Date().toISOString(),
      })
      .eq("id", authContext.whiteLabelerId)
      .is("first_client_created_at", null)
  }

  return NextResponse.json({ client: data }, { status: 201 })
}
