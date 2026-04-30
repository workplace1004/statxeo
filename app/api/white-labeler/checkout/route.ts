import { NextRequest, NextResponse } from "next/server"

import { whiteLabelerJsonError } from "@/lib/statxeo/white-labeler-api-errors"
import { isCheckoutBlockedError } from "@/lib/statxeo/white-labeler-launch-gates"
import { enforceWhiteLabelerWriteRateLimit } from "@/lib/statxeo/white-labeler-rate-limit"
import {
  createWhiteLabelerDestinationCheckoutSession,
  isStripeConnectConfigured,
} from "@/lib/statxeo/white-labeler-stripe"
import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
} from "@/lib/statxeo/white-labeler-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CheckoutPayload = {
  client_id?: unknown
  plan_override_id?: unknown
}

function normalizeRequiredId(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(request: NextRequest) {
  if (!isStripeConnectConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured for this deployment yet." }, { status: 503 })
  }

  const authContext = await getAuthenticatedWhiteLabeler()
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
    scope: "checkout.create",
    limit: 12,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const body = (await request.json().catch(() => null)) as CheckoutPayload | null
  const clientId = normalizeRequiredId(body?.client_id)
  const planOverrideId = normalizeRequiredId(body?.plan_override_id)

  if (!clientId || !planOverrideId) {
    return NextResponse.json({ error: "client_id and plan_override_id are required." }, { status: 400 })
  }

  try {
    const session = await createWhiteLabelerDestinationCheckoutSession({
      whiteLabelerId: authContext.whiteLabelerId,
      clientId,
      planOverrideId,
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    if (isCheckoutBlockedError(error)) {
      return whiteLabelerJsonError(
        {
          error: error.message,
          code: "LAUNCH_BLOCKED",
          retryable: false,
          blockers: error.readiness.blockers,
          launchReadiness: {
            canSell: error.readiness.canSell,
            brandScorePercent: error.readiness.brandScorePercent,
            brandChecklist: error.readiness.brandChecklist,
            stripeChargesEnabled: error.readiness.stripeChargesEnabled,
            accountStatus: error.readiness.accountStatus,
          },
        },
        403,
      )
    }

    const message = error instanceof Error && error.message ? error.message : "Unable to create checkout session right now."
    return whiteLabelerJsonError({ error: message, code: "CHECKOUT_FAILED", retryable: true }, 500)
  }
}