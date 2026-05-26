import { redirect } from "next/navigation"

import { AffiliateEnvAlert } from "@/components/sections/affiliate-env-alert"
import { AffiliateLoginSection } from "@/components/sections/affiliate-login"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AffiliateLoginPage() {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (!hasSupabaseEnv) {
    return (
      <AffiliateEnvAlert
        title="Affiliate sign-in is not configured yet"
        description="This deployment is missing the Supabase environment variables required for affiliate authentication. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel to enable sign-in on this environment."
      />
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/affiliate/portal")
  }

  return <AffiliateLoginSection />
}
