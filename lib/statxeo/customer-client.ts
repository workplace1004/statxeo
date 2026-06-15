import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export type CustomerPackage = {
  id: string
  name: string
  status: "active" | "pending" | "expired" | "cancelled"
  expires_at: string | null
  created_at: string
}

export type CustomerOverviewResponse = {
  packages: CustomerPackage[]
  account: {
    id: string
    email: string
    name?: string
  }
}

export type CustomerOrder = {
  id: string
  package_name: string
  status: "pending" | "active" | "completed" | "cancelled"
  amount_cents?: number | null
  created_at: string
  updated_at?: string | null
}

export type CustomerWorkflow = {
  id: string
  status: "not_started" | "in_progress" | "completed"
  stages: Array<{
    name: string
    title?: string
    description?: string
    status: "pending" | "in_progress" | "completed"
    completed_at?: string | null
  }>
}

export type CustomerDocument = {
  id: string
  name: string
  uploaded_at: string
  expires_at?: string | null
  url?: string
}

export type SupportThread = {
  id: string
  created_at: string
  updated_at?: string | null
  subject?: string
}

export type SupportMessage = {
  id: string
  thread_id: string
  body: string
  is_from_staff: boolean
  created_at: string
  sender_user_id?: string
  author?: {
    id: string
    email?: string
    name?: string
  }
}

export type SupportOpsThread = {
  id: string
  customer_user_id: string
  customer_email: string
  lead_id: string | null
  status: "open" | "closed"
  subject: string
  last_message_at: string | null
  created_at: string
  updated_at: string | null
  last_message_preview: string | null
  last_message_is_from_staff: boolean | null
  last_message_created_at: string | null
}

export class CustomerApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = "CustomerApiError"
    this.status = status
    this.payload = payload
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function buildQueryString(params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue
    query.set(key, String(value))
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

async function renderRequestHeaders(initHeaders?: HeadersInit): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  }

  try {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token) {
      headers.authorization = `Bearer ${session.access_token}`
    }
  } catch {
    // Session resolution failed; request will proceed without auth
  }

  if (initHeaders instanceof Headers) {
    initHeaders.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })
  } else if (Array.isArray(initHeaders)) {
    for (const [key, value] of initHeaders) {
      headers[key.toLowerCase()] = value
    }
  } else if (initHeaders && typeof initHeaders === "object") {
    Object.assign(headers, initHeaders)
  }

  return headers
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

function getErrorMessage(payload: unknown, status: number, fallback: string) {
  if (isRecord(payload)) {
    if (typeof payload.error === "string" && payload.error.trim().length > 0) {
      return payload.error
    }

    if (typeof payload.message === "string" && payload.message.trim().length > 0) {
      return payload.message
    }
  }

  if (status === 401) return "You need to sign in to view customer data."
  if (status === 403) return "You do not have permission to perform this action."
  return fallback
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback
}

function readNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function parseCustomerOrder(value: unknown): CustomerOrder | null {
  if (!isRecord(value)) return null
  return {
    id: readString(value.id),
    package_name: readString(value.package_name, "Website Package"),
    status:
      value.status === "pending" ||
      value.status === "active" ||
      value.status === "completed" ||
      value.status === "cancelled"
        ? value.status
        : "pending",
    amount_cents: readNullableNumber(value.amount_cents),
    created_at: readString(value.created_at),
    updated_at: readNullableString(value.updated_at),
  }
}

function parseCustomerDocument(value: unknown): CustomerDocument | null {
  if (!isRecord(value)) return null
  return {
    id: readString(value.id),
    name: readString(value.name, "Document"),
    uploaded_at: readString(value.uploaded_at),
    expires_at: readNullableString(value.expires_at),
    url: typeof value.url === "string" ? value.url : undefined,
  }
}

function parseSupportMessage(value: unknown): SupportMessage | null {
  if (!isRecord(value)) return null
  const id = readString(value.id)
  const threadId = readString(value.thread_id)
  const body = readString(value.body)
  const createdAt = readString(value.created_at)

  if (!id || !threadId || !createdAt) {
    return null
  }

  return {
    id,
    thread_id: threadId,
    body,
    is_from_staff: readBoolean(value.is_from_staff),
    created_at: createdAt,
    sender_user_id: typeof value.sender_user_id === "string" ? value.sender_user_id : undefined,
  }
}

function parseSupportOpsThread(value: unknown): SupportOpsThread | null {
  if (!isRecord(value)) return null

  const id = readString(value.id)
  if (!id) return null

  const statusValue = readString(value.status, "open").toLowerCase()

  return {
    id,
    customer_user_id: readString(value.customer_user_id),
    customer_email: readString(value.customer_email),
    lead_id: readNullableString(value.lead_id),
    status: statusValue === "closed" ? "closed" : "open",
    subject: readString(value.subject, "Support Request"),
    last_message_at: readNullableString(value.last_message_at),
    created_at: readString(value.created_at),
    updated_at: readNullableString(value.updated_at),
    last_message_preview: readNullableString(value.last_message_preview),
    last_message_is_from_staff:
      typeof value.last_message_is_from_staff === "boolean"
        ? value.last_message_is_from_staff
        : null,
    last_message_created_at: readNullableString(value.last_message_created_at),
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await renderRequestHeaders(init?.headers)

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new CustomerApiError(
      getErrorMessage(payload, response.status, "Customer request failed."),
      response.status,
      payload,
    )
  }

  return payload as T
}

async function requestBlob(path: string, init?: RequestInit): Promise<Response> {
  const headers = await renderRequestHeaders(init?.headers)

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await parseResponseBody(response)
    throw new CustomerApiError(
      getErrorMessage(payload, response.status, "Customer request failed."),
      response.status,
      payload,
    )
  }

  return response
}

export async function fetchCustomerOverview(): Promise<CustomerOverviewResponse> {
  const data = await requestJson<unknown>("/api/customer/overview")
  if (
    isRecord(data) &&
    Array.isArray(data.packages) &&
    isRecord(data.account)
  ) {
    return data as CustomerOverviewResponse
  }
  return {
    packages: [],
    account: {
      id: "",
      email: "",
    },
  }
}

export async function fetchCustomerOrders(params?: {
  limit?: number
  cursor?: string | null
}): Promise<CustomerOrder[]> {
  const query = buildQueryString({
    limit: params?.limit,
    cursor: params?.cursor ?? undefined,
  })

  const data = await requestJson<unknown>(`/api/customer/orders${query}`)
  if (isRecord(data) && Array.isArray(data.orders)) {
    return data.orders
      .map((item) => parseCustomerOrder(item))
      .filter((item): item is CustomerOrder => item !== null)
  }
  return []
}

export async function fetchCustomerWorkflow(params?: {
  limit?: number
  cursor?: string | null
}): Promise<CustomerWorkflow> {
  const query = buildQueryString({
    limit: params?.limit,
    cursor: params?.cursor ?? undefined,
  })

  const data = await requestJson<unknown>(`/api/customer/workflow${query}`)
  if (
    isRecord(data) &&
    typeof data.id === "string" &&
    typeof data.status === "string" &&
    Array.isArray(data.stages)
  ) {
    return data as CustomerWorkflow
  }
  return {
    id: "",
    status: "not_started",
    stages: [],
  }
}

export async function fetchCustomerDocuments(params?: {
  limit?: number
  cursor?: string | null
}): Promise<CustomerDocument[]> {
  const query = buildQueryString({
    limit: params?.limit,
    cursor: params?.cursor ?? undefined,
  })

  const data = await requestJson<unknown>(`/api/customer/documents${query}`)
  if (isRecord(data) && Array.isArray(data.documents)) {
    return data.documents
      .map((item) => parseCustomerDocument(item))
      .filter((item): item is CustomerDocument => item !== null)
  }
  return []
}

export async function downloadCustomerDocument(documentId: string) {
  const query = buildQueryString({ document_id: documentId })
  const response = await requestBlob(`/api/customer/documents/download${query}`)
  return response
}

export async function fetchCustomerSupportThread() {
  return requestJson<SupportThread>("/api/customer/support/thread")
}

export async function ensureCustomerSupportThread() {
  return requestJson<SupportThread>("/api/customer/support/thread", {
    method: "POST",
  })
}

export async function fetchCustomerSupportMessages(params?: {
  thread_id?: string
  limit?: number
  cursor?: string | null
}): Promise<SupportMessage[]> {
  const query = buildQueryString({
    thread_id: params?.thread_id,
    limit: params?.limit,
    cursor: params?.cursor ?? undefined,
  })

  const data = await requestJson<unknown>(`/api/customer/support/messages${query}`)
  if (isRecord(data) && Array.isArray(data.messages)) {
    return data.messages
      .map((item) => parseSupportMessage(item))
      .filter((item): item is SupportMessage => item !== null)
  }
  return []
}

export async function sendCustomerSupportMessage(payload: {
  thread_id: string
  body: string
}) {
  const data = await requestJson<unknown>("/api/customer/support/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const parsed = parseSupportMessage(data)
  if (parsed) {
    return parsed
  }

  throw new CustomerApiError("Unexpected support message response.", 500, data)
}

export async function fetchSupportOpsThreads(params?: {
  status?: "open" | "closed" | "all"
  limit?: number
}): Promise<SupportOpsThread[]> {
  const query = buildQueryString({
    status: params?.status,
    limit: params?.limit,
  })

  const data = await requestJson<unknown>(`/api/customer/support/staff/threads${query}`)
  if (isRecord(data) && Array.isArray(data.threads)) {
    return data.threads
      .map((item) => parseSupportOpsThread(item))
      .filter((item): item is SupportOpsThread => item !== null)
  }

  return []
}

export async function fetchSupportOpsMessages(params: {
  thread_id: string
  limit?: number
}): Promise<SupportMessage[]> {
  const query = buildQueryString({
    thread_id: params.thread_id,
    limit: params.limit,
  })

  const data = await requestJson<unknown>(`/api/customer/support/staff/messages${query}`)
  if (isRecord(data) && Array.isArray(data.messages)) {
    return data.messages
      .map((item) => parseSupportMessage(item))
      .filter((item): item is SupportMessage => item !== null)
  }

  return []
}

export async function sendSupportOpsMessage(payload: {
  thread_id: string
  body: string
}) {
  const data = await requestJson<unknown>("/api/customer/support/staff/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const parsed = parseSupportMessage(data)
  if (parsed) {
    return parsed
  }

  throw new CustomerApiError("Unexpected support message response.", 500, data)
}
