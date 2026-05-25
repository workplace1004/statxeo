import { NextRequest, NextResponse } from "next/server"

import { WebsiteCheckoutPayloadSchema } from "@/lib/statxeo/checkout-schemas"
import { proxyPostToStatxt } from "@/lib/statxt-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = WebsiteCheckoutPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }

  return proxyPostToStatxt({
    request,
    path: "/api/statxeo/checkout",
    payload: parsed.data,
  })
}