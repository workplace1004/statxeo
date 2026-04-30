import { NextRequest, NextResponse } from "next/server"

import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
  logWhiteLabelerAuditEvent,
} from "@/lib/statxeo/white-labeler-server"
import { enforceWhiteLabelerWriteRateLimit } from "@/lib/statxeo/white-labeler-rate-limit"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit)
  if (!Number.isFinite(parsed)) return 100
  return Math.max(1, Math.min(500, Math.floor(parsed)))
}

export async function GET(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
  const adminClient = createAdminSupabaseClient()

  const { data, error } = await adminClient
    .from("statxeo_white_labeler_payout_batches")
    .select("id, settlement_month, status, currency, gross_amount_cents, adjustment_amount_cents, net_amount_cents, generated_at, finalized_at, paid_at")
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .order("settlement_month", { ascending: false })
    .order("generated_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: "Unable to load white-labeler payouts right now." }, { status: 500 })
  }

  return NextResponse.json({ payouts: Array.isArray(data) ? data : [] })
}

export async function PATCH(request: NextRequest) {
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
    scope: "payouts.patch",
    limit: 12,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 })
  }

  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 })
  }

  const newStatus =
    typeof body.status === "string" ? body.status.trim().toLowerCase() : null
  if (newStatus !== "finalized" && newStatus !== "paid") {
    return NextResponse.json(
      { error: "status must be 'finalized' (from draft) or 'paid' (from finalized)." },
      { status: 400 },
    )
  }

  const adminClient = createAdminSupabaseClient()

  const { data: batch, error: fetchError } = await adminClient
    .from("statxeo_white_labeler_payout_batches")
    .select("id, status")
    .eq("id", id)
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: "Unable to look up payout batch." }, { status: 500 })
  }

  if (!batch) {
    return NextResponse.json({ error: "Payout batch not found." }, { status: 404 })
  }

  const batchStatus = (batch as { status: string }).status

  if (newStatus === "finalized" && batchStatus !== "draft") {
    return NextResponse.json({ error: "Only draft batches can be finalized." }, { status: 422 })
  }

  if (newStatus === "paid" && batchStatus !== "finalized") {
    return NextResponse.json({ error: "Only finalized batches can be marked as paid." }, { status: 422 })
  }

  const updates: Record<string, unknown> = {
    status: newStatus,
    locked_by_user_id: authContext.user.id,
  }

  if (newStatus === "finalized") updates.finalized_at = new Date().toISOString()
  if (newStatus === "paid") updates.paid_at = new Date().toISOString()

  const { data, error } = await adminClient
    .from("statxeo_white_labeler_payout_batches")
    .update(updates)
    .eq("id", id)
    .select(
      "id, settlement_month, status, currency, gross_amount_cents, adjustment_amount_cents, net_amount_cents, generated_at, finalized_at, paid_at",
    )
    .single()

  if (error) {
    return NextResponse.json({ error: "Unable to update payout batch status." }, { status: 500 })
  }

  void logWhiteLabelerAuditEvent({
    whiteLabelerId: authContext.whiteLabelerId,
    actorUserId: authContext.user.id,
    action: "transition",
    entityType: "payout_batch",
    entityId: id,
    changes: { from: batchStatus, to: newStatus },
  })

  return NextResponse.json({ payout: data })
}
