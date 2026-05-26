import { redirect } from "next/navigation"

import { CustomerEnvAlert } from "@/components/sections/customer-env-alert"
import { CustomerSupportOpsSection } from "@/components/sections/customer-support-ops"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getMissingCustomerPortalSupabaseEnvVars, hasCustomerPortalSupabaseEnv } from "@/lib/statxeo/customer-server"

export const dynamic = "force-dynamic"

export default async function CustomerSupportOpsPage() {
  const hasSupabaseEnv = hasCustomerPortalSupabaseEnv()

  if (!hasSupabaseEnv) {
    const missingVars = getMissingCustomerPortalSupabaseEnvVars().join(", ")

    return (
      <CustomerEnvAlert
        title="Customer support operations are unavailable on this deployment"
        description={`Supabase is not fully configured for this environment yet, so staff support threads and replies cannot load. Add ${missingVars} in Vercel and redeploy to restore this page.`}
      />
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/customer/login?next=/customer/support-ops")
  }

  return <CustomerSupportOpsSection />
}
