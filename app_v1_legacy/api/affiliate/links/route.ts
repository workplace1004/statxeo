import { NextRequest } from "next/server"

import { proxyGetToStatxt, proxyPostToStatxt } from "@/lib/statxt-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search

  return proxyGetToStatxt({
    request,
    path: `/api/statxeo/affiliate/links${search}`,
  })
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}))

  return proxyPostToStatxt({
    request,
    path: "/api/statxeo/affiliate/links",
    payload,
  })
}
