import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { normalizeRole } from "@/lib/statxeo/white-labeler-server"
import { SocialHealthCheckSection } from "@/components/sections/social-health-check"

export const dynamic = "force-dynamic"

export default async function SocialHealthPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/white-labeler/login?next=/white-labeler/admin/social/health")
  }

  // Check if user is admin/owner
  const { data: membership } = await supabase
    .from("statxeo_white_labeler_members")
    .select("role")
    .eq("user_id", user.id)
    .single()

  const role = normalizeRole(membership?.role)
  if (role !== "owner" && role !== "admin") {
    redirect("/white-labeler")
  }

  return <SocialHealthCheckSection />
}
