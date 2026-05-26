import {getCurrentAgencyOrgId} from "../../../server/context";
import {listCustomers} from "../../../server/queries/agency";
import {WhiteLabelCampaignsPage} from "../../../views/white-label/campaigns-page";

export default async function Page() {
  const customers = await listCustomers({agencyOrgId: await getCurrentAgencyOrgId()});

  return <WhiteLabelCampaignsPage customers={customers} />;
}
