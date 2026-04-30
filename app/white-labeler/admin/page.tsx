import { redirect } from "next/navigation"

import { WhiteLabelerAdminPanelSection } from "@/components/sections/white-labeler-admin-panel"
import { WhiteLabelerEnvAlert } from "@/components/sections/white-labeler-env-alert"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getMissingWhiteLabelerSupabaseEnvVars, hasWhiteLabelerSupabaseEnv, normalizeRole } from "@/lib/statxeo/white-labeler-server"

export const dynamic = "force-dynamic"

type MembershipRow = {
  role: string | null
}

export default async function WhiteLabelerAdminPage() {
  const hasSupabaseEnv = hasWhiteLabelerSupabaseEnv()

  if (!hasSupabaseEnv) {
    const missingVars = getMissingWhiteLabelerSupabaseEnvVars().join(", ")

    return (
      <WhiteLabelerEnvAlert
        title="White-label admin panel is unavailable on this deployment"
        description={`Supabase is not fully configured for this environment yet, so admin commands and white-label account controls cannot load. Add ${missingVars} in Vercel and redeploy to restore this workspace.`}
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

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_members")
    .select("role, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)

  if (error || !Array.isArray(data) || data.length === 0) {
    redirect("/white-labeler")
  }

  const membership = data[0] as MembershipRow
  const normalizedRole = normalizeRole(membership.role)

  if (normalizedRole !== "owner" && normalizedRole !== "admin") {
    redirect("/white-labeler")
  }

  const adminRole: "owner" | "admin" = normalizedRole

  return <WhiteLabelerAdminPanelSection role={adminRole} />
}
