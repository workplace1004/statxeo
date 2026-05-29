import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  // Since V2 uses Google OAuth via /api/integrations/google/callback,
  // we redirect any legacy login callbacks to the partner login interface.
  return NextResponse.redirect(`${origin}/login/partners`)
}
