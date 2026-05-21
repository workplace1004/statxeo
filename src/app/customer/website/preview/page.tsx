import {redirect} from "next/navigation";

import {getCurrentCustomerOrgId} from "../../../../server/context";
import {getActiveProject} from "../../../../server/queries/customer";
import {resolveSessionContext} from "../../../../server/site-projects/auth";
import {createRequestId} from "../../../../server/site-projects/http";
import * as service from "../../../../server/site-projects/service";
import {CustomerWebsitePreviewPage} from "../../../../views/customer/website-preview-page";

export const dynamic = "force-dynamic";

const PREVIEW_STATUSES = ["preview_ready", "changes_requested"];

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const project = await getActiveProject({customerOrgId});

  if (!project || !PREVIEW_STATUSES.includes(project.status)) {
    redirect("/customer/website");
  }

  const ctx = await resolveSessionContext(createRequestId());
  const {changeRequests} = await service.listChangeRequests(ctx, project.projectId);

  return (
    <CustomerWebsitePreviewPage
      businessName={project.businessName}
      changeRequests={changeRequests}
      previewUrl={project.previewUrl}
      projectId={project.projectId}
      status={project.status}
    />
  );
}
