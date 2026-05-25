import { NextRequest, NextResponse } from "next/server"

import { syncWhiteLabelerStripeAccountByWhiteLabelerId } from "@/lib/statxeo/white-labeler-stripe"
import { getAuthenticatedWhiteLabeler } from "@/lib/statxeo/white-labeler-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function buildLoginRedirect(request: NextRequest) {
  const url = new URL("/white-labeler/login", request.url)
  url.searchParams.set("next", "/white-labeler")
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    if (authContext.status === 401) {
      return buildLoginRedirect(request)
    }

    return NextResponse.redirect(new URL("/white-labeler", request.url))
  }

  try {
    const synced = await syncWhiteLabelerStripeAccountByWhiteLabelerId(authContext.whiteLabelerId)
    const nextUrl = new URL("/white-labeler", request.url)
    nextUrl.searchParams.set("stripe", synced?.overview.status ?? "pending")
    return NextResponse.redirect(nextUrl)
  } catch {
    const nextUrl = new URL("/white-labeler", request.url)
    nextUrl.searchParams.set("stripe", "error")
    return NextResponse.redirect(nextUrl)
  }
}