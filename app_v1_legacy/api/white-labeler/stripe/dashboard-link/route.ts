import { NextRequest, NextResponse } from "next/server"

import { enforceWhiteLabelerWriteRateLimit } from "@/lib/statxeo/white-labeler-rate-limit"
import { createWhiteLabelerStripeDashboardLoginLink } from "@/lib/statxeo/white-labeler-stripe"
import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
} from "@/lib/statxeo/white-labeler-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function resolveWhiteLabeler() {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    return forbiddenWhiteLabelerResponse()
  }

  return authContext
}

async function createDashboardLink(request: NextRequest) {
  const authContext = await resolveWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const rateLimitResponse = await enforceWhiteLabelerWriteRateLimit({
    request,
    whiteLabelerId: authContext.whiteLabelerId,
    userId: authContext.user.id,
    scope: "stripe.dashboard_link",
    limit: 10,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const response = await createWhiteLabelerStripeDashboardLoginLink(authContext.whiteLabelerId)
    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Unable to open the Stripe dashboard right now."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return createDashboardLink(request)
}

export async function GET(request: NextRequest) {
  const response = await createDashboardLink(request)
  if (!response.ok) {
    return response
  }

  const payload = (await response.json()) as { url?: string }
  const target = typeof payload.url === "string" && payload.url.trim() ? payload.url : "/white-labeler?stripe=error"
  return NextResponse.redirect(target)
}