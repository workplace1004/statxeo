import { redirect } from "next/navigation"

import { WhiteLabelerAppShell } from "@/components/white-labeler/app-shell"
import { WhiteLabelerEnvAlert } from "@/components/sections/white-labeler-env-alert"
import { WhiteLabelerPortalProvider } from "@/components/white-labeler/portal-context"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getMissingWhiteLabelerSupabaseEnvVars, hasWhiteLabelerSupabaseEnv } from "@/lib/statxeo/white-labeler-server"

export const dynamic = "force-dynamic"

export default async function WhiteLabelerPortalLayout({ children }: { children: React.ReactNode }) {
  const hasSupabaseEnv = hasWhiteLabelerSupabaseEnv()

  if (!hasSupabaseEnv) {
    const missingVars = getMissingWhiteLabelerSupabaseEnvVars().join(", ")

    return (
      <WhiteLabelerEnvAlert
        title="White-labeler portal is unavailable on this deployment"
        description={`Supabase is not fully configured for this environment yet, so white-label account data, billing history, payouts, and team settings cannot load. Add ${missingVars} in Vercel and redeploy to restore the portal.`}
      />
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/white-labeler/login?next=/white-labeler")
  }

  return (
    <WhiteLabelerPortalProvider>
      <WhiteLabelerAppShell>{children}</WhiteLabelerAppShell>
    </WhiteLabelerPortalProvider>
  )
}
