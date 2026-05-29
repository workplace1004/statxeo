import { NextResponse } from "next/server"
import { createSessionToken, setSessionCookie } from "@/server/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const origin = new URL(request.url).origin
  const portalUrl = `${origin}/white-label`

  // Generate a valid V2 session for the pre-seeded demo agency owner
  const token = createSessionToken({
    sub: "111111111111111111111111", // stable DEMO_AGENCY_USER_ID from seed
    email: "demo-agency@statxeo.dev",
    name: "Demo Agency Owner",
    persona: "white-label",
  })

  await setSessionCookie(token)

  return NextResponse.redirect(portalUrl, 303)
}
