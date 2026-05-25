import { NextRequest, NextResponse } from "next/server"

import { enforceWhiteLabelerWriteRateLimit } from "@/lib/statxeo/white-labeler-rate-limit"
import {
  createWhiteLabelerStripeAccountLink,
  isStripeConnectConfigured,
} from "@/lib/statxeo/white-labeler-stripe"
import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
} from "@/lib/statxeo/white-labeler-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function buildLoginRedirect(request: NextRequest) {
  const url = new URL("/white-labeler/login", request.url)
  url.searchParams.set("next", "/white-labeler")
  return NextResponse.redirect(url)
}

async function resolveWhiteLabelerForBrowser(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (!(authContext instanceof NextResponse)) {
    return authContext
  }

  if (authContext.status === 401) {
    return buildLoginRedirect(request)
  }

  return NextResponse.redirect(new URL("/white-labeler", request.url))
}

async function createAccountLink(request: NextRequest) {
  if (!isStripeConnectConfigured()) {
    return NextResponse.json(
      { error: "Stripe Connect is not configured for this deployment yet." },
      { status: 503 },
    )
  }

  const authContext = await resolveWhiteLabelerForBrowser(request)
  if (authContext instanceof NextResponse) {
    return authContext
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    return forbiddenWhiteLabelerResponse()
  }

  const rateLimitResponse = await enforceWhiteLabelerWriteRateLimit({
    request,
    whiteLabelerId: authContext.whiteLabelerId,
    userId: authContext.user.id,
    scope: "stripe.account_link",
    limit: 10,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const response = await createWhiteLabelerStripeAccountLink({
      whiteLabelerId: authContext.whiteLabelerId,
      ownerEmail: authContext.user.email ?? null,
    })

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Unable to start Stripe onboarding right now."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return createAccountLink(request)
}

export async function GET(request: NextRequest) {
  const response = await createAccountLink(request)
  if (!response.ok) {
    return response
  }

  const payload = (await response.json()) as { url?: string }
  const target = typeof payload.url === "string" && payload.url.trim() ? payload.url : "/white-labeler?stripe=error"
  return NextResponse.redirect(target)
}