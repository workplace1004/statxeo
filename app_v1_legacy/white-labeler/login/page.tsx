import { redirect } from "next/navigation"
import Link from "next/link"

import { WhiteLabelerDemoPortalForm } from "@/components/sections/white-labeler-demo-login-form"
import { WhiteLabelerEnvAlert } from "@/components/sections/white-labeler-env-alert"
import { WhiteLabelerLoginSection } from "@/components/sections/white-labeler-login"
import { Button } from "@/components/ui/button"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function WhiteLabelerLoginPage() {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (!hasSupabaseEnv) {
    return (
      <WhiteLabelerEnvAlert
        title="White-labeler sign-in is not configured yet"
        description="This deployment is missing the Supabase environment variables required for white-labeler authentication. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel to enable sign-in on this environment."
      />
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/white-labeler")
  }

  return (
    <div>
      <WhiteLabelerLoginSection />
      <div className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        <Button asChild variant="secondary" className="shadow-lg">
          <Link href="/white-labeler/apply">Apply as a partner</Link>
        </Button>
        <WhiteLabelerDemoPortalForm variant="default" size="default" className="shadow-lg" />
      </div>
    </div>
  )
}
