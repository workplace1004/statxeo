import { redirect } from "next/navigation"

import { WhiteLabelerAdminShell } from "@/components/white-labeler/admin-shell"
import { WhiteLabelerEnvAlert } from "@/components/sections/white-labeler-env-alert"
import { WhiteLabelerPortalProvider } from "@/components/white-labeler/portal-context"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getMissingWhiteLabelerSupabaseEnvVars, hasWhiteLabelerSupabaseEnv } from "@/lib/statxeo/white-labeler-server"

export const dynamic = "force-dynamic"

export default async function WhiteLabelerAdminLayout({ children }: { children: React.ReactNode }) {
  const hasSupabaseEnv = hasWhiteLabelerSupabaseEnv()

  if (!hasSupabaseEnv) {
    const missingVars = getMissingWhiteLabelerSupabaseEnvVars().join(", ")

    return (
      <WhiteLabelerEnvAlert
        title="White-label admin workspace is unavailable on this deployment"
        description={`Supabase is not fully configured for this environment yet, so admin routing, team context, and workspace controls cannot load. Add ${missingVars} in Vercel and redeploy to restore the admin workspace.`}
      />
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/white-labeler/login?next=/white-labeler/admin")
  }

  return (
    <WhiteLabelerPortalProvider>
      <WhiteLabelerAdminShell>{children}</WhiteLabelerAdminShell>
    </WhiteLabelerPortalProvider>
  )
}