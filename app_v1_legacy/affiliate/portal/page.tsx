import { redirect } from "next/navigation"

import { AffiliateEnvAlert } from "@/components/sections/affiliate-env-alert"
import { AffiliatePortalSection } from "@/components/sections/affiliate-portal"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AffiliatePortalPage() {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (!hasSupabaseEnv) {
    return (
      <AffiliateEnvAlert
        title="Affiliate portal is unavailable on this deployment"
        description="Supabase is not configured for this environment yet, so affiliate sessions, links, commissions, and payouts cannot load. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel to restore the portal."
      />
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/affiliate/login?next=/affiliate/portal")
  }

  return <AffiliatePortalSection />
}