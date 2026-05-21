import {redirect} from "next/navigation";

import {getCurrentCustomerOrgId} from "../../../server/context";
import {getActiveProject, listWebsitePages} from "../../../server/queries/customer";
import {CustomerWebsitePage} from "../../../views/customer/website-page";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const [project, pages] = await Promise.all([
    getActiveProject({customerOrgId}),
    listWebsitePages({customerOrgId}),
  ]);

  if (project?.status === "awaiting_preferences") {
    redirect("/customer/website/setup");
  }
  if (project?.status === "assets_pending") {
    redirect("/customer/website/assets");
  }
  if (project?.status === "preview_ready" || project?.status === "changes_requested") {
    redirect("/customer/website/preview");
  }

  return (
    <CustomerWebsitePage
      pages={pages}
      projectId={project?.projectId ?? null}
      projectStatus={project?.status ?? null}
    />
  );
}
