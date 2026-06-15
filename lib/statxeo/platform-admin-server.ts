import type { User } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { isSupportStaff } from "@/lib/statxeo/customer-server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const PLATFORM_ADMIN_REQUIRED_SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

export type AuthenticatedPlatformAdminContext = {
  user: User
  supabase: ServerSupabaseClient
}

export function unauthorizedPlatformAdminResponse() {
  return NextResponse.json({ error: "You must be signed in to access admin operations." }, { status: 401 })
}

export function forbiddenPlatformAdminResponse() {
  return NextResponse.json({ error: "You do not have permission to run admin operations." }, { status: 403 })
}

export function getMissingPlatformAdminSupabaseEnvVars() {
  return PLATFORM_ADMIN_REQUIRED_SUPABASE_ENV_VARS.filter((key) => !process.env[key])
}

export function platformAdminEnvUnavailableResponse() {
  const missing = getMissingPlatformAdminSupabaseEnvVars()

  return NextResponse.json(
    {
      error: "Admin operations are not configured for this deployment. Add missing Supabase environment variables and redeploy.",
      missing,
    },
    { status: 503 },
  )
}

export async function getAuthenticatedPlatformAdmin(): Promise<AuthenticatedPlatformAdminContext | NextResponse> {
  if (getMissingPlatformAdminSupabaseEnvVars().length > 0) {
    return platformAdminEnvUnavailableResponse()
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return unauthorizedPlatformAdminResponse()
  }

  const adminClient = createAdminSupabaseClient()
  const hasAccess = await isSupportStaff(adminClient, user.id)

  if (!hasAccess) {
    return forbiddenPlatformAdminResponse()
  }

  return {
    user,
    supabase,
  }
}
