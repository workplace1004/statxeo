import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

import {
  WHITE_LABELER_DEMO_LOGIN_EMAIL,
  WHITE_LABELER_DEMO_LOGIN_PASSWORD,
} from "@/lib/statxeo/white-labeler-demo-auth"
import { enforcePublicRateLimit } from "@/lib/statxeo/public-rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin
  const portalUrl = `${origin}/white-labeler`
  const loginUrl = new URL("/white-labeler/login", origin)

  const rateLimitResponse = await enforcePublicRateLimit({
    request,
    scope: "white-labeler.demo_login",
    limit: 12,
    windowMs: 3_600_000,
  })
  if (rateLimitResponse) {
    const busy = new URL("/white-labeler/login", origin)
    busy.searchParams.set("demo", "busy")
    return NextResponse.redirect(busy, 303)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    loginUrl.searchParams.set("demo", "config")
    return NextResponse.redirect(loginUrl, 303)
  }

  let response = NextResponse.redirect(portalUrl, 303)

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.redirect(portalUrl, 303)
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({
    email: WHITE_LABELER_DEMO_LOGIN_EMAIL,
    password: WHITE_LABELER_DEMO_LOGIN_PASSWORD,
  })

  if (error) {
    const fail = new URL("/white-labeler/login", origin)
    fail.searchParams.set("demo", "failed")
    return NextResponse.redirect(fail, 303)
  }

  return response
}
