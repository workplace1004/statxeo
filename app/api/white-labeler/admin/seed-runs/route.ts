import { NextResponse } from "next/server"

import { getAuthenticatedPlatformAdmin } from "@/lib/statxeo/platform-admin-server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AuditRow = {
  id: string | null
  white_labeler_id: string | null
  actor_user_id: string | null
  created_at: string | null
  changes: Record<string, unknown> | null
}

function valueAsBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false
}

function valueAsNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function valueAsString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function mapAuditRow(row: AuditRow) {
  const changes = row.changes ?? {}

  return {
    id: row.id ?? "",
    white_labeler_id: row.white_labeler_id ?? "",
    actor_user_id: row.actor_user_id,
    created_at: row.created_at,
    slug: valueAsString(changes.slug),
    created_owner_user: valueAsBoolean(changes.created_owner_user),
    created_white_labeler: valueAsBoolean(changes.created_white_labeler),
    inserted_sample_clients: valueAsNumber(changes.inserted_sample_clients),
    inserted_sample_charges: valueAsNumber(changes.inserted_sample_charges),
    created_payout_batch: valueAsBoolean(changes.created_payout_batch),
  }
}

export async function GET() {
  const platformAdmin = await getAuthenticatedPlatformAdmin()
  if (platformAdmin instanceof NextResponse) {
    return platformAdmin
  }

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_audit_log")
    .select("id, white_labeler_id, actor_user_id, created_at, changes")
    .contains("changes", { source: "seed_demo" })
    .order("created_at", { ascending: false })
    .limit(25)

  if (error) {
    return NextResponse.json({ error: "Unable to load demo seed history right now." }, { status: 500 })
  }

  const rows = Array.isArray(data) ? (data as AuditRow[]).map((row) => mapAuditRow(row)) : []

  return NextResponse.json({ runs: rows })
}
