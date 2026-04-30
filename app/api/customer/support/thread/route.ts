import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  getCustomerAdminSupabaseClientOrResponse,
  getAuthenticatedCustomer,
  resolveCustomerLeadIds,
} from "@/lib/statxeo/customer-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SupportThreadResponse = {
  id: string
  created_at: string
  updated_at: string | null
  subject: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isOpenThread(record: Record<string, unknown>) {
  const status = typeof record.status === "string" ? record.status.trim().toLowerCase() : ""
  if (status === "closed" || status === "resolved" || status === "archived") {
    return false
  }

  const closedAt = record.closed_at
  return !(typeof closedAt === "string" && closedAt.length > 0)
}

function mapThread(record: Record<string, unknown>): SupportThreadResponse | null {
  const id = typeof record.id === "string" ? record.id : ""
  if (!id) return null

  const createdAt = typeof record.created_at === "string" && record.created_at.length > 0
    ? record.created_at
    : new Date(0).toISOString()

  return {
    id,
    created_at: createdAt,
    updated_at: typeof record.updated_at === "string" ? record.updated_at : null,
    subject: typeof record.subject === "string" && record.subject.trim().length > 0
      ? record.subject
      : "Support Request",
  }
}

async function findLatestOpenThread(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("statxeo_support_threads")
    .select("*")
    .eq("customer_user_id", userId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(25)

  if (error || !Array.isArray(data)) {
    return null
  }

  for (const row of data) {
    if (!isRecord(row)) continue
    if (!isOpenThread(row)) continue

    const mapped = mapThread(row)
    if (mapped) return mapped
  }

  return null
}

export async function GET() {
  const authContext = await getAuthenticatedCustomer()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const thread = await findLatestOpenThread(authContext.supabase, authContext.user.id)
  if (!thread) {
    return NextResponse.json({ error: "No open support thread found." }, { status: 404 })
  }

  return NextResponse.json(thread)
}

export async function POST() {
  const authContext = await getAuthenticatedCustomer()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const existingThread = await findLatestOpenThread(authContext.supabase, authContext.user.id)
  if (existingThread) {
    return NextResponse.json(existingThread)
  }

  const adminClient = getCustomerAdminSupabaseClientOrResponse()
  if (adminClient instanceof NextResponse) {
    return adminClient
  }

  const leadIds = await resolveCustomerLeadIds(adminClient, authContext.email, authContext.user.id)
  const newestLeadId = leadIds[0] ?? null

  const { data, error } = await authContext.supabase
    .from("statxeo_support_threads")
    .insert({
      customer_user_id: authContext.user.id,
      customer_email: authContext.email,
      lead_id: newestLeadId,
      subject: "Support Request",
    })
    .select("id, created_at, updated_at, subject")
    .single()

  if (error || !data || !isRecord(data)) {
    return NextResponse.json(
      {
        error: "Unable to create support thread right now.",
      },
      { status: 500 },
    )
  }

  const mapped = mapThread(data)
  if (!mapped) {
    return NextResponse.json(
      {
        error: "Unable to create support thread right now.",
      },
      { status: 500 },
    )
  }

  return NextResponse.json(mapped)
}
