import { redirect } from "next/navigation"

import { WhiteLabelerApplicationsAdminSection } from "@/components/sections/white-labeler-applications-admin"
import { WhiteLabelerEnvAlert } from "@/components/sections/white-labeler-env-alert"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { isSupportStaff } from "@/lib/statxeo/customer-server"
import { getMissingWhiteLabelerSupabaseEnvVars, hasWhiteLabelerSupabaseEnv } from "@/lib/statxeo/white-labeler-server"

export const dynamic = "force-dynamic"

export default async function WhiteLabelerApplicationsAdminPage() {
  const hasSupabaseEnv = hasWhiteLabelerSupabaseEnv()

  if (!hasSupabaseEnv) {
    const missingVars = getMissingWhiteLabelerSupabaseEnvVars().join(", ")

    return (
      <WhiteLabelerEnvAlert
        title="White-label application review is unavailable on this deployment"
        description={`Supabase is not fully configured for this environment yet, so platform-admin partner reviews cannot load. Add ${missingVars} in Vercel and redeploy to restore this workspace.`}
      />
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/white-labeler/login?next=/white-labeler/admin/applications")
  }

  const adminClient = createAdminSupabaseClient()
  const hasAccess = await isSupportStaff(adminClient, user.id)

  if (!hasAccess) {
    redirect("/white-labeler/admin")
  }

  return <WhiteLabelerApplicationsAdminSection />
}