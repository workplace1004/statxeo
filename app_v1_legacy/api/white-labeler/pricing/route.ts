import { NextRequest, NextResponse } from "next/server"

import { calculateWhiteLabelerNetPayout } from "@/lib/statxeo/white-labeler-pricing"
import { enforceWhiteLabelerWriteRateLimit } from "@/lib/statxeo/white-labeler-rate-limit"
import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
  logWhiteLabelerAuditEvent,
} from "@/lib/statxeo/white-labeler-server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type PlanRow = {
  id: string | null
  plan_code: string | null
  currency: string | null
  amount_sold_cents: number | null
  base_cost_cents: number | null
  white_label_fee_cents: number | null
  is_active: boolean | null
  effective_from: string | null
  effective_to: string | null
}

type PlanPayload = {
  plan_code?: unknown
  currency?: unknown
  amount_sold_cents?: unknown
  base_cost_cents?: unknown
  white_label_fee_cents?: unknown
  is_active?: unknown
  effective_from?: unknown
  effective_to?: unknown
  id?: unknown
}

function normalizeMoneyCents(raw: unknown) {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return null
  }

  const value = Math.round(raw)
  if (value < 0) {
    return null
  }

  return value
}

function normalizeCurrency(raw: unknown) {
  if (typeof raw !== "string") return null
  const value = raw.trim().toLowerCase()

  if (!/^[a-z]{3}$/.test(value)) {
    return null
  }

  return value
}

function normalizePlanCode(raw: unknown) {
  if (typeof raw !== "string") return null
  const value = raw.trim().toLowerCase()

  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(value)) {
    return null
  }

  return value
}

function normalizeTimestamp(raw: unknown) {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return null
  }

  const parsed = Date.parse(raw)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return new Date(parsed).toISOString()
}

function mapPlanRow(row: PlanRow) {
  const amountSoldCents = typeof row.amount_sold_cents === "number" ? row.amount_sold_cents : 0
  const baseCostCents = typeof row.base_cost_cents === "number" ? row.base_cost_cents : 0
  const whiteLabelFeeCents = typeof row.white_label_fee_cents === "number" ? row.white_label_fee_cents : 0

  return {
    id: row.id ?? "",
    plan_code: row.plan_code ?? "",
    currency: row.currency ?? "usd",
    amount_sold_cents: amountSoldCents,
    base_cost_cents: baseCostCents,
    white_label_fee_cents: whiteLabelFeeCents,
    net_payout_cents: calculateWhiteLabelerNetPayout({
      amountSoldCents,
      baseCostCents,
      whiteLabelFeeCents,
    }).netPayoutCents,
    is_active: Boolean(row.is_active),
    effective_from: row.effective_from ?? new Date(0).toISOString(),
    effective_to: row.effective_to,
  }
}

export async function GET() {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_plan_overrides")
    .select("id, plan_code, currency, amount_sold_cents, base_cost_cents, white_label_fee_cents, is_active, effective_from, effective_to")
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .order("is_active", { ascending: false })
    .order("effective_from", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Unable to load white-labeler pricing right now." }, { status: 500 })
  }

  const plans = (Array.isArray(data) ? data : []).map((row) => mapPlanRow(row as PlanRow))

  return NextResponse.json({ plans })
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
    scope: "pricing.create",
    limit: 20,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const payload = (await request.json().catch(() => null)) as PlanPayload | null

  const planCode = normalizePlanCode(payload?.plan_code)
  const currency = normalizeCurrency(payload?.currency ?? "usd")
  const amountSoldCents = normalizeMoneyCents(payload?.amount_sold_cents)
  const baseCostCents = normalizeMoneyCents(payload?.base_cost_cents)
  const whiteLabelFeeCents = normalizeMoneyCents(payload?.white_label_fee_cents)

  if (!planCode || !currency || amountSoldCents === null || baseCostCents === null || whiteLabelFeeCents === null) {
    return NextResponse.json(
      {
        error:
          "Invalid payload. plan_code, currency, amount_sold_cents, base_cost_cents, and white_label_fee_cents are required.",
      },
      { status: 400 },
    )
  }

  const effectiveFrom = normalizeTimestamp(payload?.effective_from) ?? new Date().toISOString()
  const isActive = payload?.is_active !== false

  const adminClient = createAdminSupabaseClient()

  if (isActive) {
    const { error: deactivateError } = await adminClient
      .from("statxeo_white_labeler_plan_overrides")
      .update({ is_active: false })
      .eq("white_labeler_id", authContext.whiteLabelerId)
      .eq("plan_code", planCode)
      .eq("is_active", true)

    if (deactivateError) {
      return NextResponse.json({ error: "Unable to create pricing override right now." }, { status: 500 })
    }
  }

  const { data, error } = await adminClient
    .from("statxeo_white_labeler_plan_overrides")
    .insert({
      white_labeler_id: authContext.whiteLabelerId,
      plan_code: planCode,
      currency,
      amount_sold_cents: amountSoldCents,
      base_cost_cents: baseCostCents,
      white_label_fee_cents: whiteLabelFeeCents,
      is_active: isActive,
      effective_from: effectiveFrom,
      created_by_user_id: authContext.user.id,
    })
    .select(
      "id, plan_code, currency, amount_sold_cents, base_cost_cents, white_label_fee_cents, is_active, effective_from, effective_to",
    )
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create pricing override right now." }, { status: 500 })
  }

  const created = mapPlanRow(data as PlanRow)

  void logWhiteLabelerAuditEvent({
    whiteLabelerId: authContext.whiteLabelerId,
    actorUserId: authContext.user.id,
    action: "create",
    entityType: "plan_override",
    entityId: created.id,
    changes: { plan_code: created.plan_code, currency: created.currency, is_active: created.is_active },
  })

  return NextResponse.json({ plan: created }, { status: 201 })
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
    scope: "pricing.patch",
    limit: 30,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const payload = (await request.json().catch(() => null)) as PlanPayload | null
  const id = typeof payload?.id === "string" ? payload.id.trim() : ""

  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()
  const { data: existingData, error: existingError } = await adminClient
    .from("statxeo_white_labeler_plan_overrides")
    .select(
      "id, plan_code, currency, amount_sold_cents, base_cost_cents, white_label_fee_cents, is_active, effective_from, effective_to",
    )
    .eq("id", id)
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: "Unable to update pricing override right now." }, { status: 500 })
  }

  const existingPlan = existingData as PlanRow | null
  if (!existingPlan?.id) {
    return NextResponse.json({ error: "Pricing override not found." }, { status: 404 })
  }

  const updatePayload: Record<string, unknown> = {}

  if (payload && Object.prototype.hasOwnProperty.call(payload, "currency")) {
    const currency = normalizeCurrency(payload.currency)
    if (!currency) {
      return NextResponse.json({ error: "currency must be a 3-letter code." }, { status: 400 })
    }
    updatePayload.currency = currency
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "amount_sold_cents")) {
    const value = normalizeMoneyCents(payload.amount_sold_cents)
    if (value === null) {
      return NextResponse.json({ error: "amount_sold_cents must be a non-negative integer." }, { status: 400 })
    }
    updatePayload.amount_sold_cents = value
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "base_cost_cents")) {
    const value = normalizeMoneyCents(payload.base_cost_cents)
    if (value === null) {
      return NextResponse.json({ error: "base_cost_cents must be a non-negative integer." }, { status: 400 })
    }
    updatePayload.base_cost_cents = value
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "white_label_fee_cents")) {
    const value = normalizeMoneyCents(payload.white_label_fee_cents)
    if (value === null) {
      return NextResponse.json({ error: "white_label_fee_cents must be a non-negative integer." }, { status: 400 })
    }
    updatePayload.white_label_fee_cents = value
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "effective_to")) {
    if (payload.effective_to === null) {
      updatePayload.effective_to = null
    } else {
      const value = normalizeTimestamp(payload.effective_to)
      if (!value) {
        return NextResponse.json({ error: "effective_to must be null or a valid date string." }, { status: 400 })
      }
      updatePayload.effective_to = value
    }
  }

  const hasIsActiveUpdate = payload && Object.prototype.hasOwnProperty.call(payload, "is_active")
  const nextIsActive = hasIsActiveUpdate ? Boolean(payload?.is_active) : null

  if (hasIsActiveUpdate) {
    updatePayload.is_active = nextIsActive
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided." }, { status: 400 })
  }

  if (nextIsActive === true && existingPlan.plan_code) {
    const { error: deactivateError } = await adminClient
      .from("statxeo_white_labeler_plan_overrides")
      .update({ is_active: false })
      .eq("white_labeler_id", authContext.whiteLabelerId)
      .eq("plan_code", existingPlan.plan_code)
      .neq("id", id)
      .eq("is_active", true)

    if (deactivateError) {
      return NextResponse.json({ error: "Unable to update pricing override right now." }, { status: 500 })
    }
  }

  const { data: updatedData, error: updateError } = await adminClient
    .from("statxeo_white_labeler_plan_overrides")
    .update(updatePayload)
    .eq("id", id)
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .select(
      "id, plan_code, currency, amount_sold_cents, base_cost_cents, white_label_fee_cents, is_active, effective_from, effective_to",
    )
    .single()

  if (updateError || !updatedData) {
    return NextResponse.json({ error: "Unable to update pricing override right now." }, { status: 500 })
  }

  const updated = mapPlanRow(updatedData as PlanRow)

  void logWhiteLabelerAuditEvent({
    whiteLabelerId: authContext.whiteLabelerId,
    actorUserId: authContext.user.id,
    action: "update",
    entityType: "plan_override",
    entityId: updated.id,
    changes: updatePayload as Record<string, unknown>,
  })

  return NextResponse.json({ plan: updated })
}
