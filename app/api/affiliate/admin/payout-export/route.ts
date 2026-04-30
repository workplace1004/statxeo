import { NextRequest } from "next/server"

import { proxyGetToStatxtRaw } from "@/lib/statxt-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search

  return proxyGetToStatxtRaw({
    request,
    path: `/api/admin/statxeo/affiliates/payout-export${search}`,
  })
}
