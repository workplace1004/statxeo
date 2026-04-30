import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required")
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
  }

  return { url, anonKey }
}

export async function createClient() {
  const { url, anonKey } = getSupabaseConfig()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Ignore set attempts in RSC context.
        }
      },
    },
  })
}

export const createServerSupabaseClient = createClient