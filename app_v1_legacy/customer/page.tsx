import { redirect } from "next/navigation"

import { CustomerEnvAlert } from "@/components/sections/customer-env-alert"
import { CustomerPortalSection } from "@/components/sections/customer-portal"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getMissingCustomerPortalSupabaseEnvVars, hasCustomerPortalSupabaseEnv } from "@/lib/statxeo/customer-server"

export const dynamic = "force-dynamic"

export default async function CustomerPortalPage() {
  const hasSupabaseEnv = hasCustomerPortalSupabaseEnv()

  if (!hasSupabaseEnv) {
    const missingVars = getMissingCustomerPortalSupabaseEnvVars().join(", ")

    return (
      <CustomerEnvAlert
        title="Customer portal is unavailable on this deployment"
        description={`Supabase is not fully configured for this environment yet, so customer sessions, orders, and support cannot load. Add ${missingVars} in Vercel and redeploy to restore the portal.`}
      />
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/customer/login?next=/customer")
  }

  return <CustomerPortalSection />
}
