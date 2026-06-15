import { NextRequest, NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

type PublicRateLimitParams = {
  request: NextRequest
  scope: string
  limit?: number
  windowMs?: number
}

type RateLimitBucket = {
  count: number
  resetAt: number
}

type InMemoryLimiterStore = {
  buckets: Map<string, RateLimitBucket>
}

type SharedLimiterStore = {
  ratelimits: Map<string, Ratelimit>
}

declare global {
  var __statxeoPublicRateLimitMemoryStore: InMemoryLimiterStore | undefined
  var __statxeoPublicRateLimitSharedStore: SharedLimiterStore | undefined
}

const DEFAULT_LIMIT = 5
const DEFAULT_WINDOW_MS = 3_600_000
const MAX_BUCKETS_BEFORE_CLEANUP = 5_000

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  return "unknown"
}

function getSharedStore() {
  if (!globalThis.__statxeoPublicRateLimitSharedStore) {
    globalThis.__statxeoPublicRateLimitSharedStore = {
      ratelimits: new Map<string, Ratelimit>(),
    }
  }

  return globalThis.__statxeoPublicRateLimitSharedStore
}

function getInMemoryStore() {
  if (!globalThis.__statxeoPublicRateLimitMemoryStore) {
    globalThis.__statxeoPublicRateLimitMemoryStore = {
      buckets: new Map<string, RateLimitBucket>(),
    }
  }

  return globalThis.__statxeoPublicRateLimitMemoryStore
}

function cleanupExpiredBuckets(store: Map<string, RateLimitBucket>, now: number) {
  if (store.size < MAX_BUCKETS_BEFORE_CLEANUP) return

  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key)
    }
  }
}

function getSharedLimiter(limit: number, windowMs: number) {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!upstashUrl || !upstashToken) {
    return null
  }

  const store = getSharedStore()
  const configKey = `${limit}:${windowMs}`
  const existing = store.ratelimits.get(configKey)
  if (existing) {
    return existing
  }

  const redis = new Redis({
    url: upstashUrl,
    token: upstashToken,
  })

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: "statxeo:publicrate",
    analytics: true,
  })

  store.ratelimits.set(configKey, limiter)
  return limiter
}

export async function enforcePublicRateLimit({
  request,
  scope,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
}: PublicRateLimitParams) {
  const now = Date.now()
  const key = `${scope}:${getClientIp(request)}`
  const sharedLimiter = getSharedLimiter(limit, windowMs)

  if (sharedLimiter) {
    const result = await sharedLimiter.limit(key)

    if (result.success) {
      return null
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - now) / 1000))
    return NextResponse.json(
      { error: `Too many requests. Please retry in about ${retryAfterSeconds} seconds.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
          "X-RateLimit-Reset": String(Math.floor(result.reset / 1000)),
        },
      },
    )
  }

  const store = getInMemoryStore().buckets
  cleanupExpiredBuckets(store, now)

  const existing = store.get(key)
  let bucket: RateLimitBucket

  if (!existing || existing.resetAt <= now) {
    bucket = {
      count: 1,
      resetAt: now + windowMs,
    }
  } else {
    bucket = {
      count: existing.count + 1,
      resetAt: existing.resetAt,
    }
  }

  store.set(key, bucket)

  if (bucket.count <= limit) {
    return null
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  return NextResponse.json(
    { error: `Too many requests. Please retry in about ${retryAfterSeconds} seconds.` },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.floor(bucket.resetAt / 1000)),
      },
    },
  )
}