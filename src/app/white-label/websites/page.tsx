import {getCurrentAgencyOrgId} from "../../../server/context";
import {listSites} from "../../../server/queries/agency";
import {WhiteLabelWebsitesPage} from "../../../views/white-label/websites-page";

export default async function Page() {
  const sites = await listSites({agencyOrgId: await getCurrentAgencyOrgId()});

  return <WhiteLabelWebsitesPage sites={sites} />;
}
