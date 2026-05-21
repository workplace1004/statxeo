import type {NextRequest} from "next/server";

import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";

import {SESSION_COOKIE_NAME} from "@/server/auth/constants";

export type ApiRateLimitBucket = "auth" | "ai" | "health" | "internal";

type RateLimitResult = {
  configured: boolean;
  success: boolean;
  limit: number | null;
  remaining: number | null;
  reset: number | null;
};

const RATE_LIMIT_RULES: Record<ApiRateLimitBucket, {limit: number; window: `${number} ${"s" | "m" | "h" | "d"}`}> = {
  auth: {limit: 20, window: "1 m"},
  ai: {limit: 10, window: "1 m"},
  health: {limit: 30, window: "1 m"},
  internal: {limit: 60, window: "1 m"},
};

let limiterCache: Record<ApiRateLimitBucket, Ratelimit> | null = null;

function isRateLimitConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getLimiters(): Record<ApiRateLimitBucket, Ratelimit> | null {
  if (!isRateLimitConfigured()) return null;
  if (limiterCache) return limiterCache;

  const redis = Redis.fromEnv();
  limiterCache = {
    auth: new Ratelimit({redis, limiter: Ratelimit.slidingWindow(20, "1 m"), prefix: "rl:auth"}),
    ai: new Ratelimit({redis, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "rl:ai"}),
    health: new Ratelimit({redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:health"}),
    internal: new Ratelimit({redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "rl:internal"}),
  };

  return limiterCache;
}

function firstForwardedIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function resolveIdentifier(request: NextRequest, bucket: ApiRateLimitBucket): Promise<string> {
  const keyId = request.headers.get("x-api-key-id")?.trim();
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim();
  const ip =
    firstForwardedIp(request.headers.get("x-forwarded-for")) ??
    request.headers.get("x-real-ip")?.trim() ??
    "unknown";
  const raw = keyId ?? sessionToken ?? `${ip}:${request.nextUrl.pathname}`;
  const hashed = await sha256(raw);
  return `${bucket}:${hashed}`;
}

export function resolveApiRateLimitBucket(pathname: string): ApiRateLimitBucket | null {
  if (pathname === "/api/integrations/google" || pathname === "/api/integrations/google/callback") {
    return "auth";
  }

  if (pathname === "/api/social/callback") {
    return "auth";
  }

  if (pathname.startsWith("/api/health/")) {
    return "health";
  }

  if (
    pathname === "/api/admin/ensure-indexes" ||
    pathname === "/api/ai/generate" ||
    pathname === "/api/site-projects/reconcile"
  ) {
    return "internal";
  }

  if (pathname.startsWith("/api/ai/") || /\/api\/site-projects\/[^/]+\/trigger$/.test(pathname)) {
    return "ai";
  }

  return null;
}

export async function limitApiRequest(
  request: NextRequest,
  bucket: ApiRateLimitBucket,
): Promise<RateLimitResult> {
  const limiters = getLimiters();
  if (!limiters) {
    return {
      configured: false,
      success: true,
      limit: null,
      remaining: null,
      reset: null,
    };
  }

  const identifier = await resolveIdentifier(request, bucket);
  const result = await limiters[bucket].limit(identifier);

  return {
    configured: true,
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function rateLimitWindowSeconds(bucket: ApiRateLimitBucket): number {
  const [amount, unit] = RATE_LIMIT_RULES[bucket].window.split(" ") as [string, "s" | "m" | "h" | "d"];
  const value = Number(amount);
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
  }
}