import { NextRequest, NextResponse } from "next/server"

import {
  forbiddenCustomerResponse,
  getCustomerAdminSupabaseClientOrResponse,
  getAuthenticatedCustomer,
  isSupportStaff,
} from "@/lib/statxeo/customer-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SupportMessageRow = {
  id: string | null
  thread_id: string | null
  body: string | null
  is_from_staff: boolean | null
  created_at: string | null
  sender_user_id: string | null
}

type SupportThreadStatusRow = {
  id: string | null
  status: string | null
}

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit)
  if (!Number.isFinite(parsed)) return 200
  return Math.max(1, Math.min(500, Math.floor(parsed)))
}

function mapSupportMessage(row: SupportMessageRow) {
  return {
    id: row.id ?? "",
    thread_id: row.thread_id ?? "",
    body: row.body ?? "",
    is_from_staff: Boolean(row.is_from_staff),
    created_at: row.created_at ?? new Date(0).toISOString(),
    sender_user_id: typeof row.sender_user_id === "string" ? row.sender_user_id : undefined,
  }
}

export async function GET(request: NextRequest) {
  const authContext = await getAuthenticatedCustomer()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const adminClient = getCustomerAdminSupabaseClientOrResponse()
  if (adminClient instanceof NextResponse) {
    return adminClient
  }

  const hasStaffAccess = await isSupportStaff(adminClient, authContext.user.id)

  if (!hasStaffAccess) {
    return forbiddenCustomerResponse()
  }

  const threadId = (request.nextUrl.searchParams.get("thread_id") ?? "").trim()
  if (!threadId) {
    return NextResponse.json({ error: "thread_id is required." }, { status: 400 })
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))

  const { data: threadData, error: threadError } = await adminClient
    .from("statxeo_support_threads")
    .select("id")
    .eq("id", threadId)
    .maybeSingle()

  if (threadError || !threadData) {
    return NextResponse.json({ error: "Support thread not found." }, { status: 404 })
  }

  const { data, error } = await adminClient
    .from("statxeo_support_messages")
    .select("id, thread_id, body, is_from_staff, created_at, sender_user_id")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(limit)

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

  const adminClient = getCustomerAdminSupabaseClientOrResponse()
  if (adminClient instanceof NextResponse) {
    return adminClient
  }

  const hasStaffAccess = await isSupportStaff(adminClient, authContext.user.id)

  if (!hasStaffAccess) {
    return forbiddenCustomerResponse()
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

  if (body.length < 1 || body.length > 4000) {
    return NextResponse.json(
      { error: "Message body must be between 1 and 4000 characters." },
      { status: 400 },
    )
  }

  const { data: threadData, error: threadError } = await adminClient
    .from("statxeo_support_threads")
    .select("id, status")
    .eq("id", threadId)
    .maybeSingle()

  if (threadError || !threadData) {
    return NextResponse.json({ error: "Support thread not found." }, { status: 404 })
  }

  const thread = threadData as SupportThreadStatusRow
  if (thread.status === "closed") {
    const { error: reopenError } = await adminClient
      .from("statxeo_support_threads")
      .update({
        status: "open",
        closed_at: null,
      })
      .eq("id", threadId)

    if (reopenError) {
      return NextResponse.json(
        {
          error: "Unable to reopen support thread right now.",
        },
        { status: 500 },
      )
    }
  }

  const { data, error } = await adminClient
    .from("statxeo_support_messages")
    .insert({
      thread_id: threadId,
      sender_user_id: authContext.user.id,
      is_from_staff: true,
      body,
    })
    .select("id, thread_id, body, is_from_staff, created_at, sender_user_id")
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
