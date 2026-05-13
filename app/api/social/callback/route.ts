import { NextRequest, NextResponse } from "next/server"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAuthenticatedWhiteLabeler } from "@/lib/statxeo/white-labeler-server"
import { parseWhiteLabelerSocialAuthState } from "@/lib/statxeo/white-labeler-social-auth"

export const runtime = "nodejs"

export const dynamic = "force-dynamic"

function buildRedirectUrl(request: NextRequest, params: { status: "success" | "error"; message?: string }) {
  const redirectUrl = new URL("/white-labeler/social", request.url)
  redirectUrl.searchParams.set("status", params.status)
  if (params.message) {
    redirectUrl.searchParams.set("message", params.message)
  }
  return redirectUrl
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")
  const stateToken = searchParams.get("state")

  if (!sessionId || !stateToken) {
    return NextResponse.redirect(
      buildRedirectUrl(request, { status: "error", message: "Missing social callback parameters." }),
    )
  }

  try {
    const authContext = await getAuthenticatedWhiteLabeler()
    if (authContext instanceof NextResponse) {
      if (authContext.status === 401) {
        return NextResponse.redirect(
          buildRedirectUrl(request, { status: "error", message: "Please sign in again to finish connecting the account." }),
        )
      }

      return NextResponse.redirect(buildRedirectUrl(request, { status: "error", message: "Access denied." }))
    }

    const state = parseWhiteLabelerSocialAuthState(stateToken)
    if (!state) {
      return NextResponse.redirect(
        buildRedirectUrl(request, { status: "error", message: "Invalid or expired callback state." }),
      )
    }

    if (state.whiteLabelerId !== authContext.whiteLabelerId || state.userId !== authContext.user.id) {
      return NextResponse.redirect(buildRedirectUrl(request, { status: "error", message: "Social callback session mismatch." }))
    }

    const apiKey = process.env.OUSTAND_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.redirect(
        buildRedirectUrl(request, { status: "error", message: "Social auth is not configured for this deployment." }),
      )
    }

    const adminClient = createAdminSupabaseClient()

    const detailsRes = await fetch(`https://api.outstand.so/v1/social-accounts/pending?sessionId=${sessionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    })

    if (!detailsRes.ok) {
      return NextResponse.redirect(
        buildRedirectUrl(request, { status: "error", message: "Failed to load pending social account details." }),
      )
    }

    const { data: pendingData } = await detailsRes.json()

    const finalizeRes = await fetch("https://api.outstand.so/v1/social-accounts/finalize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
      cache: "no-store",
    })

    if (!finalizeRes.ok) {
      return NextResponse.redirect(
        buildRedirectUrl(request, { status: "error", message: "Failed to finalize social connection." }),
      )
    }

    const { data: finalizedAccount } = await finalizeRes.json()
    const provider =
      typeof finalizedAccount?.provider === "string"
        ? finalizedAccount.provider
        : typeof pendingData?.provider === "string"
          ? pendingData.provider
          : state.provider
    const displayName =
      typeof finalizedAccount?.name === "string" && finalizedAccount.name.trim()
        ? finalizedAccount.name.trim()
        : typeof pendingData?.name === "string" && pendingData.name.trim()
          ? pendingData.name.trim()
          : `${provider} account`

    const { error: upsertError } = await adminClient.from("statxeo_white_labeler_social_accounts").upsert(
      {
        white_labeler_id: authContext.whiteLabelerId,
        outstand_account_id: String(finalizedAccount?.id ?? sessionId),
        provider,
        display_name: displayName,
        is_active: true,
        metadata: {
          pending: pendingData ?? null,
          finalized: finalizedAccount ?? null,
          connected_by_user_id: authContext.user.id,
          connected_at: new Date().toISOString(),
        },
      },
      { onConflict: "white_labeler_id, outstand_account_id" },
    )

    if (upsertError) {
      console.error("Social callback upsert error:", upsertError)
      return NextResponse.redirect(
        buildRedirectUrl(request, { status: "error", message: "Connected upstream, but failed to save the account locally." }),
      )
    }

    return NextResponse.redirect(
      buildRedirectUrl(request, { status: "success", message: `${displayName} connected successfully.` }),
    )
  } catch (error) {
    console.error("Social callback error:", error)
    return NextResponse.redirect(buildRedirectUrl(request, { status: "error", message: "Internal server error." }))
  }
}
