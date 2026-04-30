import type { NextRequest } from "next/server"
import type { User } from "@supabase/supabase-js"

import { createAdminSupabaseClient } from "./admin"
import { createServerSupabaseClient } from "./server"

/**
 * Resolves the authenticated user for an API route.
 *
 * Checks in order:
 *   1. Authorization: Bearer <jwt> header  (curl / API clients)
 *   2. Supabase SSR cookie session          (browser / Next.js pages)
 *
 * Use this in all API routes instead of createServerSupabaseClient()
 * so both curl testing and browser sessions work.
 */
export async function getApiUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (token) {
    const admin = createAdminSupabaseClient()
    const {
      data: { user },
    } = await admin.auth.getUser(token)
    return user ?? null
  }

  // Fall back to cookie-based session (browser)
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
}
