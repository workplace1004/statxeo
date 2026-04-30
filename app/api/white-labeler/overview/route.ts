import { NextRequest, NextResponse } from "next/server"

import { getWhiteLabelerLaunchReadiness } from "@/lib/statxeo/white-labeler-launch-gates"
import { getWhiteLabelerOnboardingSnapshot } from "@/lib/statxeo/white-labeler-onboarding"
import { buildWhiteLabelerStripeOverview } from "@/lib/statxeo/white-labeler-stripe"
import { getAuthenticatedWhiteLabeler } from "@/lib/statxeo/white-labeler-server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type WhiteLabelerRow = {
  id: string | null
  display_name: string | null
  status: string | null
  default_currency: string | null
  stripe_connect_account_id: string | null
  stripe_connect_status: string | null
  stripe_connect_charges_enabled: boolean | null
  stripe_connect_payouts_enabled: boolean | null
  stripe_connect_details_submitted: boolean | null
  stripe_connect_country: string | null
  stripe_connect_email: string | null
  stripe_connect_requirements: unknown
  stripe_connected_at: string | null
  stripe_connect_last_synced_at: string | null
}

type ClientRow = {
  status: string | null
  active_site_count: number | null
}

type ChargeRow = {
  amount_sold_cents: number | null
  net_payout_cents: number | null
  charge_status: string | null
}

type PayoutBatchRow = {
  net_amount_cents: number | null
}

function parseSettlementMonth(raw: string | null) {
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
  }

  return `${raw}-01`
}

function sumNumber(values: Array<number | null | undefined>) {
  return values.reduce<number>((total, value) => {
    return total + (typeof value === "number" && Number.isFinite(value) ? value : 0)
  }, 0)
}

export async function GET(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const settlementMonth = parseSettlementMonth(request.nextUrl.searchParams.get("month"))
  const adminClient = createAdminSupabaseClient()

  const [{ data: whiteLabelerData, error: whiteLabelerError }, { data: clientsData, error: clientsError }, { data: chargesData, error: chargesError }, { data: draftBatchesData, error: draftBatchesError }] = await Promise.all([
    adminClient
      .from("statxeo_white_labelers")
      .select(
        "id, display_name, status, default_currency, stripe_connect_account_id, stripe_connect_status, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted, stripe_connect_country, stripe_connect_email, stripe_connect_requirements, stripe_connected_at, stripe_connect_last_synced_at",
      )
      .eq("id", authContext.whiteLabelerId)
      .maybeSingle(),
    adminClient
      .from("statxeo_white_labeler_clients")
      .select("status, active_site_count")
      .eq("white_labeler_id", authContext.whiteLabelerId),
    adminClient
      .from("statxeo_white_labeler_charges")
      .select("amount_sold_cents, net_payout_cents, charge_status")
      .eq("white_labeler_id", authContext.whiteLabelerId)
      .eq("settlement_month", settlementMonth),
    adminClient
      .from("statxeo_white_labeler_payout_batches")
      .select("net_amount_cents")
      .eq("white_labeler_id", authContext.whiteLabelerId)
      .eq("status", "draft"),
  ])

  if (whiteLabelerError || clientsError || chargesError || draftBatchesError) {
    return NextResponse.json({ error: "Unable to load white-labeler overview right now." }, { status: 500 })
  }

  const whiteLabeler = whiteLabelerData as WhiteLabelerRow | null
  if (!whiteLabeler?.id) {
    return NextResponse.json({ error: "White-labeler account not found." }, { status: 404 })
  }

  const onboarding = await getWhiteLabelerOnboardingSnapshot(adminClient, authContext.whiteLabelerId)
  const launchReadiness = await getWhiteLabelerLaunchReadiness(adminClient, authContext.whiteLabelerId)

  const clients = (Array.isArray(clientsData) ? clientsData : []) as ClientRow[]
  const charges = (Array.isArray(chargesData) ? chargesData : []) as ChargeRow[]
  const draftBatches = (Array.isArray(draftBatchesData) ? draftBatchesData : []) as PayoutBatchRow[]

  const activeClients = clients.filter((row) => (row.status ?? "").toLowerCase() === "active").length
  const activeSites = sumNumber(
    clients
      .filter((row) => (row.status ?? "").toLowerCase() === "active")
      .map((row) => row.active_site_count),
  )

  const postedCharges = charges.filter((row) => {
    const normalized = (row.charge_status ?? "").trim().toLowerCase()
    return normalized === "" || normalized === "posted"
  })

  return NextResponse.json({
    account: {
      id: whiteLabeler.id,
      userId: authContext.user.id,
      role: authContext.role,
      displayName: whiteLabeler.display_name ?? "White Label Account",
      currency: whiteLabeler.default_currency ?? "usd",
      status: (whiteLabeler.status ?? "active").trim().toLowerCase(),
    },
    period: {
      settlementMonth,
    },
    onboarding,
    launchReadiness,
    stripe: buildWhiteLabelerStripeOverview(whiteLabeler),
    kpis: {
      activeClients,
      activeSites,
      monthRevenueCents: sumNumber(postedCharges.map((row) => row.amount_sold_cents)),
      monthNetPayoutCents: sumNumber(postedCharges.map((row) => row.net_payout_cents)),
      outstandingDraftPayoutCents: sumNumber(draftBatches.map((row) => row.net_amount_cents)),
    },
  })
}
