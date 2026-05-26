import { NextRequest } from "next/server"

import { proxyGetToStatxt } from "@/lib/statxt-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search

  return proxyGetToStatxt({
    request,
    path: `/api/statxeo/affiliate/overview${search}`,
  })
}
