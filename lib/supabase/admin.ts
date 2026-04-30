import { createClient } from "@supabase/supabase-js"

const ADMIN_SUPABASE_REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

export function getMissingAdminSupabaseEnvVars() {
  return ADMIN_SUPABASE_REQUIRED_ENV_VARS.filter((key) => !process.env[key])
}

export function hasAdminSupabaseEnv() {
  return getMissingAdminSupabaseEnvVars().length === 0
}

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required to create the admin Supabase client.")
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to create the admin Supabase client.")
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
