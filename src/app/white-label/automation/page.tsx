import {getCurrentAgencyOrgId} from "../../../server/context";
import {listWorkflows} from "../../../server/queries/agency";
import {WhiteLabelAutomationPage} from "../../../views/white-label/automation-page";

export default async function Page() {
  const workflows = await listWorkflows({agencyOrgId: await getCurrentAgencyOrgId()});

  return <WhiteLabelAutomationPage workflows={workflows} />;
}
