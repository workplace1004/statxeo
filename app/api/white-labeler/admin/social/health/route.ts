import { NextResponse } from "next/server"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
} from "@/lib/statxeo/white-labeler-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    return forbiddenWhiteLabelerResponse()
  }

  try {
    const apiKey = process.env.OUSTAND_API_KEY?.trim()

    if (!apiKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "Social auth is not configured for this deployment.",
          checkedAt: new Date().toISOString(),
        },
        { status: 503 },
      )
    }

    const adminClient = createAdminSupabaseClient()
    const [{ count, error: countError }, response] = await Promise.all([
      adminClient
        .from("statxeo_white_labeler_social_accounts")
        .select("id", { count: "exact", head: true })
        .eq("white_labeler_id", authContext.whiteLabelerId)
        .eq("is_active", true),
      fetch("https://api.outstand.so/v1/social-accounts", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }),
    ])

    if (countError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Unable to load saved social account metadata.",
          checkedAt: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    if (response.ok) {
      return NextResponse.json({
        status: "healthy",
        message: "Outstand API is reachable and the connection secret is valid.",
        connectedAccountCount: count ?? 0,
        checkedAt: new Date().toISOString(),
      })
    }

    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    return NextResponse.json(
      {
        status: "unhealthy",
        message: errorPayload?.message ?? "Outstand API returned an error.",
        statusCode: response.status,
        connectedAccountCount: count ?? 0,
        checkedAt: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Internal server error",
        checkedAt: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
