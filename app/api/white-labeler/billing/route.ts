import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedWhiteLabeler } from "@/lib/statxeo/white-labeler-server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit)
  if (!Number.isFinite(parsed)) return 100
  return Math.max(1, Math.min(500, Math.floor(parsed)))
}

function parseMonth(rawMonth: string | null) {
  if (!rawMonth || !/^\d{4}-\d{2}$/.test(rawMonth)) return null
  return `${rawMonth}-01`
}

export async function GET(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
  const month = parseMonth(request.nextUrl.searchParams.get("month"))
  const adminClient = createAdminSupabaseClient()

  let query = adminClient
    .from("statxeo_white_labeler_charges")
    .select("id, source_event_id, plan_code, settlement_month, charged_at, currency, amount_sold_cents, base_cost_cents, white_label_fee_cents, net_payout_cents, charge_status")
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .order("charged_at", { ascending: false })
    .limit(limit)

  if (month) {
    query = query.eq("settlement_month", month)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: "Unable to load white-labeler billing history right now." }, { status: 500 })
  }

  return NextResponse.json({ charges: Array.isArray(data) ? data : [] })
}
