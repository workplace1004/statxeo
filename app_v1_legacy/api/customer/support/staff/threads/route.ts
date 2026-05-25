import { NextRequest, NextResponse } from "next/server"

import {
  forbiddenCustomerResponse,
  getCustomerAdminSupabaseClientOrResponse,
  getAuthenticatedCustomer,
  isSupportStaff,
} from "@/lib/statxeo/customer-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SupportThreadRow = {
  id: string | null
  customer_user_id: string | null
  customer_email: string | null
  lead_id: string | null
  status: string | null
  subject: string | null
  last_message_at: string | null
  created_at: string | null
  updated_at: string | null
}

type SupportMessagePreviewRow = {
  thread_id: string | null
  body: string | null
  is_from_staff: boolean | null
  created_at: string | null
}

type ThreadStatusFilter = "open" | "closed" | "all"

function parseStatus(rawStatus: string | null): ThreadStatusFilter {
  if (rawStatus === "closed" || rawStatus === "all") {
    return rawStatus
  }
  return "open"
}

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit)
  if (!Number.isFinite(parsed)) return 50
  return Math.max(1, Math.min(200, Math.floor(parsed)))
}

function mapThreadWithPreview(
  row: SupportThreadRow,
  latestMessageByThreadId: Map<string, SupportMessagePreviewRow>,
) {
  const threadId = typeof row.id === "string" ? row.id : ""
  const latestMessage = latestMessageByThreadId.get(threadId)
  const body = typeof latestMessage?.body === "string" ? latestMessage.body.trim() : ""

  return {
    id: threadId,
    customer_user_id: typeof row.customer_user_id === "string" ? row.customer_user_id : "",
    customer_email: typeof row.customer_email === "string" ? row.customer_email : "",
    lead_id: typeof row.lead_id === "string" ? row.lead_id : null,
    status: row.status === "closed" ? "closed" : "open",
    subject:
      typeof row.subject === "string" && row.subject.trim().length > 0
        ? row.subject.trim()
        : "Support Request",
    last_message_at: typeof row.last_message_at === "string" ? row.last_message_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date(0).toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    last_message_preview: body ? body.slice(0, 280) : null,
    last_message_is_from_staff:
      typeof latestMessage?.is_from_staff === "boolean" ? latestMessage.is_from_staff : null,
    last_message_created_at:
      typeof latestMessage?.created_at === "string" ? latestMessage.created_at : null,
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

  const statusFilter = parseStatus(request.nextUrl.searchParams.get("status"))
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))

  let threadsQuery = adminClient
    .from("statxeo_support_threads")
    .select(
      "id, customer_user_id, customer_email, lead_id, status, subject, last_message_at, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (statusFilter === "closed") {
    threadsQuery = threadsQuery.eq("status", "closed")
  } else if (statusFilter === "open") {
    threadsQuery = threadsQuery.or("status.eq.open,status.is.null")
  }

  const { data, error } = await threadsQuery

  if (error) {
    return NextResponse.json(
      {
        error: "Unable to load support threads right now.",
      },
      { status: 500 },
    )
  }

  const threadRows = (Array.isArray(data) ? data : []) as SupportThreadRow[]
  const threadIds = threadRows
    .map((row) => row.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0)

  const latestMessageByThreadId = new Map<string, SupportMessagePreviewRow>()

  if (threadIds.length > 0) {
    const { data: messagesData, error: messagesError } = await adminClient
      .from("statxeo_support_messages")
      .select("thread_id, body, is_from_staff, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false })

    if (messagesError) {
      return NextResponse.json(
        {
          error: "Unable to load support threads right now.",
        },
        { status: 500 },
      )
    }

    const messageRows = (Array.isArray(messagesData) ? messagesData : []) as SupportMessagePreviewRow[]
    for (const message of messageRows) {
      if (typeof message.thread_id !== "string" || message.thread_id.length === 0) continue
      if (latestMessageByThreadId.has(message.thread_id)) continue
      latestMessageByThreadId.set(message.thread_id, message)
    }
  }

  const threads = threadRows
    .filter((row) => typeof row.id === "string" && row.id.length > 0)
    .map((row) => mapThreadWithPreview(row, latestMessageByThreadId))

  return NextResponse.json({ threads })
}
