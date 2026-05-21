import {redirect} from "next/navigation";

import {getCurrentCustomerOrgId} from "../../../../server/context";
import {getActiveProject} from "../../../../server/queries/customer";
import {resolveSessionContext} from "../../../../server/site-projects/auth";
import {createRequestId} from "../../../../server/site-projects/http";
import * as service from "../../../../server/site-projects/service";
import {CustomerWebsiteAssetsPage} from "../../../../views/customer/website-assets-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const project = await getActiveProject({customerOrgId});

  if (!project || project.status !== "assets_pending") {
    redirect("/customer/website");
  }

  const ctx = await resolveSessionContext(createRequestId());
  const {assets} = await service.listProjectMedia(ctx, project.projectId);

  return (
    <CustomerWebsiteAssetsPage
      businessName={project.businessName}
      existingAssets={assets}
      projectId={project.projectId}
    />
  );
}
