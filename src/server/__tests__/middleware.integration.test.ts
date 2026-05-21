import {beforeEach, describe, expect, it, vi} from "vitest";
import {NextRequest} from "next/server";

type MockRateLimitResult = {
  configured: boolean;
  success: boolean;
  limit: number | null;
  remaining: number | null;
  reset: number | null;
};

let nextBucket: "auth" | "ai" | "health" | "internal" | null = null;
let nextRateLimitResult: MockRateLimitResult = {
  configured: true,
  success: true,
  limit: 20,
  remaining: 19,
  reset: 60_000,
};

vi.mock("@/lib/rate-limit", () => ({
  limitApiRequest: vi.fn(async () => nextRateLimitResult),
  rateLimitWindowSeconds: vi.fn(() => 60),
  resolveApiRateLimitBucket: vi.fn((pathname: string) => {
    if (pathname === "/api/integrations/google" || pathname === "/api/social/callback") {
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
    return nextBucket;
  }),
}));

import {middleware} from "@/middleware";

function makeRequest(pathname: string, init?: {headers?: HeadersInit}) {
  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers: init?.headers,
  });
}

describe("middleware integration behavior", () => {
  beforeEach(() => {
    nextBucket = null;
    nextRateLimitResult = {
      configured: true,
      success: true,
      limit: 20,
      remaining: 19,
      reset: 60_000,
    };
  });

  it("allows public oauth entry without auth", async () => {
    const response = await middleware(makeRequest("/api/integrations/google?persona=customer"));
    expect(response.status).toBe(200);
  });

  it("rejects protected site-project routes without auth", async () => {
    const response = await middleware(makeRequest("/api/site-projects/project_123"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {code: "UNAUTHORIZED"},
    });
  });

  it("rejects internal routes without internal auth", async () => {
    const response = await middleware(makeRequest("/api/health/db"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {code: "UNAUTHORIZED"},
    });
  });

  it("returns 429 when the rate limiter blocks the request", async () => {
    nextRateLimitResult = {
      configured: true,
      success: false,
      limit: 20,
      remaining: 0,
      reset: 60_000,
    };

    const response = await middleware(makeRequest("/api/integrations/google?persona=customer"));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {code: "RATE_LIMITED"},
    });
  });
});