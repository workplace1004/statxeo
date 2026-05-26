import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { enforceWhiteLabelerWriteRateLimit } from "@/lib/statxeo/white-labeler-rate-limit"
import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
} from "@/lib/statxeo/white-labeler-server"
import {
  createWhiteLabelerSocialAuthState,
  WHITE_LABELER_SOCIAL_PROVIDERS,
} from "@/lib/statxeo/white-labeler-social-auth"

const WhiteLabelerSocialAuthRequestSchema = z
  .object({
    provider: z.enum(WHITE_LABELER_SOCIAL_PROVIDERS),
  })
  .strict()

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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
    scope: "social.auth_url",
    limit: 10,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const body = await request.json().catch(() => null)
  const parsed = WhiteLabelerSocialAuthRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }

  const apiKey = process.env.OUSTAND_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: "Social auth is not configured for this deployment." }, { status: 503 })
  }

  try {
    const redirectUrl = new URL("/api/social/callback", request.url).toString()
    const state = createWhiteLabelerSocialAuthState({
      whiteLabelerId: authContext.whiteLabelerId,
      userId: authContext.user.id,
      provider: parsed.data.provider,
    })

    const response = await fetch("https://api.outstand.so/v1/social-accounts/auth-url", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        provider: parsed.data.provider,
        redirectUrl,
        state,
      }),
      cache: "no-store",
    })

    const payload = (await response.json().catch(() => null)) as
      | { authUrl?: string; data?: { authUrl?: string }; message?: string }
      | null

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.message || "Failed to generate social connection URL." },
        { status: response.status },
      )
    }

    const rawAuthUrl = payload?.authUrl ?? payload?.data?.authUrl
    if (typeof rawAuthUrl !== "string" || !rawAuthUrl.trim()) {
      return NextResponse.json({ error: "Provider returned an invalid authorization URL." }, { status: 502 })
    }

    let authUrl = rawAuthUrl
    try {
      const url = new URL(rawAuthUrl)
      url.searchParams.set("state", state)
      if (!url.searchParams.has("redirectUrl")) {
        url.searchParams.set("redirectUrl", redirectUrl)
      }
      authUrl = url.toString()
    } catch {
      authUrl = rawAuthUrl
    }

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Social auth-url error:", error)
    return NextResponse.json({ error: "Unable to start social connection right now." }, { status: 500 })
  }
}
