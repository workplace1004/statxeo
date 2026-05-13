import { redirect } from "next/navigation"

import { SocialHealthCheckSection } from "@/components/sections/social-health-check"
import { getAuthenticatedWhiteLabeler, isWhiteLabelerAdminRole } from "@/lib/statxeo/white-labeler-server"

export const dynamic = "force-dynamic"

export default async function SocialHealthPage() {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof Response) {
    if (authContext.status === 401) {
      redirect("/white-labeler/login?next=/white-labeler/admin/social/health")
    }

    redirect("/white-labeler")
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    redirect("/white-labeler")
  }

  return <SocialHealthCheckSection />
}
