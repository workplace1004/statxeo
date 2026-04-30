import { createAdminSupabaseClient } from "@/lib/supabase/admin"

/**
 * Returns a service-role Supabase client for STATXAI operations.
 * Reuses the existing admin client factory from lib/supabase/admin.ts.
 */
export function getStatxaiSupabase() {
  return createAdminSupabaseClient()
}
