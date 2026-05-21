import {redirect} from "next/navigation";

import {getCurrentCustomerOrgId} from "../../../../server/context";
import {getActiveProject} from "../../../../server/queries/customer";
import {CustomerWebsiteSetupPage} from "../../../../views/customer/website-setup-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const project = await getActiveProject({customerOrgId});

  if (!project || !["awaiting_preferences", "assets_pending"].includes(project.status)) {
    redirect("/customer/website");
  }

  return (
    <CustomerWebsiteSetupPage
      projectId={project.projectId}
      packageTier={project.packageTier}
      businessName={project.businessName}
    />
  );
}
