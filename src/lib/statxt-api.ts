import { NextRequest, NextResponse } from "next/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

const FORWARD_HEADERS = ["retry-after", "x-ratelimit-remaining", "x-ratelimit-reset"] as const
const RAW_FORWARD_HEADERS = ["content-type", "content-disposition", "cache-control", ...FORWARD_HEADERS] as const

function getStatxtBaseUrl() {
  const baseUrl = process.env.STATXT_API_BASE_URL?.trim() || "https://statxt.com"
  return baseUrl.replace(/\/+$/, "")
}

type ProxyMethod = "GET" | "POST"

type ProxyBaseArgs = {
  request: NextRequest
  path: string
}

type ProxyPostArgs = ProxyBaseArgs & {
  payload: unknown
}

async function parseUpstreamJson(upstream: Response, target: string) {
  const raw = await upstream.text()
  if (!raw) {
    return {}
  }

  const contentType = upstream.headers.get("content-type")?.toLowerCase() || ""
  const looksLikeHtml = raw.trimStart().startsWith("<!DOCTYPE html") || raw.trimStart().startsWith("<html")

  if (looksLikeHtml || contentType.includes("text/html")) {
    if (upstream.status === 404) {
      return {
        error: "Checkout service route is not available on the upstream deployment yet.",
        upstreamStatus: upstream.status,
        target,
      }
    }

    return {
      error: "Checkout service returned an unexpected HTML response.",
      upstreamStatus: upstream.status,
      target,
    }
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {
      error: raw.length > 500 ? `${raw.slice(0, 500)}...` : raw,
      upstreamStatus: upstream.status,
      target,
    }
  }
}

async function resolveAuthorizationHeader(request: NextRequest): Promise<string | null> {
  const directAuthorization = request.headers.get("authorization") || request.headers.get("Authorization")
  if (directAuthorization) {
    return directAuthorization
  }

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const accessToken = session?.access_token?.trim()
    if (accessToken) {
      return `Bearer ${accessToken}`
    }
  } catch {
    // Fall through when Supabase session resolution is unavailable.
  }

  return null
}

async function buildForwardHeaders(request: NextRequest, method: ProxyMethod) {
  const headers: Record<string, string> = {
    accept: "application/json",
  }

  const xForwardedFor = request.headers.get("x-forwarded-for")
  const origin = request.headers.get("origin")
  const userAgent = request.headers.get("user-agent")
  const cookie = request.headers.get("cookie")
  const authorization = await resolveAuthorizationHeader(request)
  const internalKey = process.env.STATXT_INTERNAL_API_KEY?.trim()

  if (xForwardedFor) headers["x-forwarded-for"] = xForwardedFor
  if (origin) headers.origin = origin
  if (userAgent) headers["user-agent"] = userAgent
  if (cookie) headers.cookie = cookie
  if (authorization) headers.authorization = authorization
  if (internalKey) headers["x-statxt-internal-key"] = internalKey

  if (method === "POST") {
    headers["content-type"] = "application/json"
  }

  return headers
}

function getPassthroughHeaders(upstream: Response, names: readonly string[]) {
  const passthroughHeaders: Record<string, string> = {}

  for (const headerName of names) {
    const headerValue = upstream.headers.get(headerName)
    if (headerValue) {
      passthroughHeaders[headerName] = headerValue
    }
  }

  return passthroughHeaders
}

async function proxyRequestToStatxt({ request, path, method, payload }: ProxyBaseArgs & { method: ProxyMethod; payload?: unknown }) {
  const target = `${getStatxtBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 15000)

  try {
    const headers = await buildForwardHeaders(request, method)

    const upstream = await fetch(target, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(payload ?? {}) : undefined,
      cache: "no-store",
      signal: abortController.signal,
    })

    const data = await parseUpstreamJson(upstream, target)
    const passthroughHeaders = getPassthroughHeaders(upstream, FORWARD_HEADERS)

    return NextResponse.json(data, {
      status: upstream.status,
      headers: passthroughHeaders,
    })
  } catch {
    return NextResponse.json(
      {
        error: "Unable to connect to statxt checkout services right now.",
      },
      { status: 502 },
    )
  } finally {
    clearTimeout(timeout)
  }
}

async function proxyRawGetToStatxt({ request, path }: ProxyBaseArgs) {
  const target = `${getStatxtBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 15000)

  try {
    const headers = await buildForwardHeaders(request, "GET")

    const upstream = await fetch(target, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: abortController.signal,
    })

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: getPassthroughHeaders(upstream, RAW_FORWARD_HEADERS),
    })
  } catch {
    return NextResponse.json(
      {
        error: "Unable to connect to statxt checkout services right now.",
      },
      { status: 502 },
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function proxyPostToStatxt({ request, path, payload }: ProxyPostArgs) {
  return proxyRequestToStatxt({
    request,
    path,
    method: "POST",
    payload,
  })
}

export async function proxyGetToStatxt({ request, path }: ProxyBaseArgs) {
  return proxyRequestToStatxt({
    request,
    path,
    method: "GET",
  })
}

export async function proxyGetToStatxtRaw({ request, path }: ProxyBaseArgs) {
  return proxyRawGetToStatxt({
    request,
    path,
  })
}