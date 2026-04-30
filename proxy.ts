import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (name + value only — RequestCookies
          // does not accept full SerializeOptions).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          // Set cookies on the response including all options (expiry, path…)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must call getUser() to keep the cookie fresh.
  // Do not add any code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Guard: /white-labeler (except /white-labeler/login)
  if (
    !user &&
    pathname.startsWith("/white-labeler") &&
    !pathname.startsWith("/white-labeler/login")
  ) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/white-labeler/login"
    return NextResponse.redirect(loginUrl)
  }

  // Guard: /customer (except /customer/login)
  if (
    !user &&
    pathname.startsWith("/customer") &&
    !pathname.startsWith("/customer/login")
  ) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/customer/login"
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
}
