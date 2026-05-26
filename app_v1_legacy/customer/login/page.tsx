import { redirect } from "next/navigation"

import { CustomerEnvAlert } from "@/components/sections/customer-env-alert"
import { CustomerLoginSection } from "@/components/sections/customer-login"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function CustomerLoginPage() {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (!hasSupabaseEnv) {
    return (
      <CustomerEnvAlert
        title="Customer sign-in is not configured yet"
        description="This deployment is missing the Supabase environment variables required for customer authentication. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel to enable sign-in on this environment."
      />
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/customer")
  }

  return <CustomerLoginSection />
}
