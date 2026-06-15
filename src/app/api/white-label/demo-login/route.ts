import { NextResponse } from "next/server"
import { createSessionToken, setSessionCookie } from "@/server/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  // Demo login is only available when explicitly enabled via env var.
  // On production deployments without DEMO_MODE_ENABLED this returns 404
  // so the endpoint cannot be used to bypass auth.
  if (process.env.DEMO_MODE_ENABLED !== "true") {
    return NextResponse.json({error: "Not found"}, {status: 404})
  }

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
