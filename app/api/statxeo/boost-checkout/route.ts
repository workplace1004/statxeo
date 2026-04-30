import { NextRequest, NextResponse } from "next/server"

import { BoostCheckoutPayloadSchema } from "@/lib/statxeo/checkout-schemas"
import { proxyPostToStatxt } from "@/lib/statxt-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = BoostCheckoutPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }

  return proxyPostToStatxt({
    request,
    path: "/api/statxeo/boost-checkout",
    payload: parsed.data,
  })
}