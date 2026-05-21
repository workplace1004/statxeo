import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

import {SESSION_COOKIE_NAME} from "@/server/auth/constants";
import {
  limitApiRequest,
  rateLimitWindowSeconds,
  resolveApiRateLimitBucket,
  type ApiRateLimitBucket,
} from "@/lib/rate-limit";

const PUBLIC_API_PATHS = new Set([
  "/api/integrations/google",
  "/api/integrations/google/callback",
]);

const INTERNAL_API_PATHS = new Set([
  "/api/admin/ensure-indexes",
  "/api/admin/site-projects/api-keys",
  "/api/admin/site-projects/jobs/[jobId]/timeline",
  "/api/ai/generate",
  "/api/health/db",
  "/api/site-projects/reconcile",
]);

export function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.has(pathname);
}

export function isInternalApiPath(pathname: string): boolean {
  return (
    INTERNAL_API_PATHS.has(pathname) ||
    /^\/api\/admin\/site-projects\/jobs\/[^/]+\/timeline$/.test(pathname) ||
    /^\/api\/admin\/site-projects\/api-keys\/[^/]+$/.test(pathname)
  );
}

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

function hasRouteAuth(request: NextRequest): boolean {
  return Boolean(
    request.headers.get("authorization") ||
      request.headers.get("x-api-key-id") ||
      request.headers.get("x-statxai-api-key") ||
      hasSessionCookie(request),
  );
}

function hasInternalAuth(request: NextRequest): boolean {
  return Boolean(
    request.headers.get("authorization") || request.headers.get("x-statxai-api-key"),
  );
}

function attachRateLimitHeaders(
  response: NextResponse,
  input: {bucket: ApiRateLimitBucket; limit: number | null; remaining: number | null; reset: number | null},
) {
  if (input.limit !== null) {
    response.headers.set("x-ratelimit-limit", String(input.limit));
  }
  if (input.remaining !== null) {
    response.headers.set("x-ratelimit-remaining", String(input.remaining));
  }
  if (input.reset !== null) {
    response.headers.set("x-ratelimit-reset", String(Math.max(0, Math.floor(input.reset / 1000))));
  }
  response.headers.set("x-ratelimit-bucket", input.bucket);
}

function unauthorizedResponse(message: string, status = 401): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        message,
      },
    },
    {status},
  );
}

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const bucket = resolveApiRateLimitBucket(pathname);
  let rateLimitResult:
    | {bucket: ApiRateLimitBucket; limit: number | null; remaining: number | null; reset: number | null}
    | null = null;

  if (bucket) {
    const limited = await limitApiRequest(request, bucket);
    rateLimitResult = {
      bucket,
      limit: limited.limit,
      remaining: limited.remaining,
      reset: limited.reset,
    };

    if (!limited.success) {
      const response = NextResponse.json(
        {
          ok: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests",
          },
        },
        {status: 429},
      );
      response.headers.set("retry-after", String(rateLimitWindowSeconds(bucket)));
      attachRateLimitHeaders(response, rateLimitResult);
      return response;
    }
  }

  if (isPublicApiPath(pathname)) {
    const response = NextResponse.next();
    if (rateLimitResult) attachRateLimitHeaders(response, rateLimitResult);
    return response;
  }

  if (isInternalApiPath(pathname) && !hasInternalAuth(request)) {
    const response = unauthorizedResponse("Internal API key required");
    if (rateLimitResult) attachRateLimitHeaders(response, rateLimitResult);
    return response;
  }

  if (!isInternalApiPath(pathname) && !hasRouteAuth(request)) {
    const response = unauthorizedResponse("Authentication required");
    if (rateLimitResult) attachRateLimitHeaders(response, rateLimitResult);
    return response;
  }

  const response = NextResponse.next();
  if (rateLimitResult) attachRateLimitHeaders(response, rateLimitResult);
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};