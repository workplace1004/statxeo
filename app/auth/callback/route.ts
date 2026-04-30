import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getSafeRedirectUrl(next: string | null, fallback: string) {
  if (!next) return fallback
  // Only allow relative paths to prevent open redirect attacks
  if (next.startsWith("/") && !next.startsWith("//")) {
    return next
  }
  return fallback
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next")
  const type = searchParams.get("type")

  const redirectOnError = `${origin}/auth/auth-error`

  if (!code) {
    return NextResponse.redirect(redirectOnError)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return NextResponse.redirect(redirectOnError)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(redirectOnError)
  }

  // For password recovery flows, always send to the reset password page
  if (type === "recovery") {
    const safeNext = getSafeRedirectUrl(next, "/white-labeler/reset-password")
    // If no specific next but type is recovery, default to white-labeler reset
    return NextResponse.redirect(`${origin}${safeNext}`)
  }

  // For invite flows, default to the appropriate portal
  const defaultNext = next?.startsWith("/white-labeler") ? "/white-labeler" : "/white-labeler"
  const safeNext = getSafeRedirectUrl(next, defaultNext)

  return NextResponse.redirect(`${origin}${safeNext}`)
}
