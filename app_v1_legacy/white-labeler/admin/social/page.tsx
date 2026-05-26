import { redirect } from "next/navigation"

import { WhiteLabelerSocialAdminSection } from "@/components/sections/white-labeler-social-admin"
import { getAuthenticatedWhiteLabeler, isWhiteLabelerAdminRole } from "@/lib/statxeo/white-labeler-server"

export const dynamic = "force-dynamic"

export default async function AdminSocialDashboard() {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof Response) {
    if (authContext.status === 401) {
      redirect("/white-labeler/login?next=/white-labeler/admin/social")
    }

    redirect("/white-labeler")
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    redirect("/white-labeler")
  }

  return <WhiteLabelerSocialAdminSection />
}
