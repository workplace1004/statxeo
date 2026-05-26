import { NextRequest, NextResponse } from "next/server"

import type { SupabaseClient } from "@supabase/supabase-js"

import { getAuthenticatedCustomer } from "@/lib/statxeo/customer-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SupportMessageRow = {
  id: string | null
  thread_id: string | null
  body: string | null
  is_from_staff: boolean | null
  created_at: string | null
}

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit)
  if (!Number.isFinite(parsed)) return 100
  return Math.max(1, Math.min(250, Math.floor(parsed)))
}

function parseCursor(rawCursor: string | null) {
  if (!rawCursor) return null
  const parsed = Date.parse(rawCursor)
  return Number.isFinite(parsed) ? rawCursor : null
}

async function verifyThreadOwnership(supabase: SupabaseClient, threadId: string, userId: string) {
  const { data, error } = await supabase
    .from("statxeo_support_threads")
    .select("id")
    .eq("id", threadId)
    .eq("customer_user_id", userId)
    .maybeSingle()

  if (error || !data) {
    return false
  }

  return true
}

function mapSupportMessage(row: SupportMessageRow) {
  return {
    id: row.id ?? "",
    thread_id: row.thread_id ?? "",
    body: row.body ?? "",
    is_from_staff: Boolean(row.is_from_staff),
    created_at: row.created_at ?? new Date(0).toISOString(),
  }
}

export async function GET(request: NextRequest) {
  const authContext = await getAuthenticatedCustomer()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const threadId = (request.nextUrl.searchParams.get("thread_id") ?? "").trim()
  if (!threadId) {
    return NextResponse.json({ error: "thread_id is required." }, { status: 400 })
  }

  const ownsThread = await verifyThreadOwnership(authContext.supabase, threadId, authContext.user.id)
  if (!ownsThread) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 })
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
  const cursor = parseCursor(request.nextUrl.searchParams.get("cursor"))

  let query = authContext.supabase
    .from("statxeo_support_messages")
    .select("id, thread_id, body, is_from_staff, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(limit)

  if (cursor) {
    query = query.gt("created_at", cursor)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      {
        error: "Unable to load support messages right now.",
      },
      { status: 500 },
    )
  }

  const messages = ((Array.isArray(data) ? data : []) as SupportMessageRow[]).map(mapSupportMessage)

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  const authContext = await getAuthenticatedCustomer()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        thread_id?: unknown
        body?: unknown
      }
    | null

  const threadId = typeof payload?.thread_id === "string" ? payload.thread_id.trim() : ""
  const body = typeof payload?.body === "string" ? payload.body.trim() : ""

  if (!threadId) {
    return NextResponse.json({ error: "thread_id is required." }, { status: 400 })
  }

  if (!body) {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 })
  }

  if (body.length > 4000) {
    return NextResponse.json({ error: "Message body must be 4000 characters or fewer." }, { status: 400 })
  }

  const ownsThread = await verifyThreadOwnership(authContext.supabase, threadId, authContext.user.id)
  if (!ownsThread) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 })
  }

  const { data, error } = await authContext.supabase
    .from("statxeo_support_messages")
    .insert({
      thread_id: threadId,
      sender_user_id: authContext.user.id,
      is_from_staff: false,
      body,
    })
    .select("id, thread_id, body, is_from_staff, created_at")
    .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Unable to send support message right now.",
      },
      { status: 500 },
    )
  }

  return NextResponse.json(mapSupportMessage(data as SupportMessageRow))
}
