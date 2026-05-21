import {getCurrentAgencyOrgId} from "../../../server/context";
import {listCustomers} from "../../../server/queries/agency";
import {WhiteLabelCustomersPage} from "../../../views/white-label/customers-page";

export default async function Page() {
  const customers = await listCustomers({agencyOrgId: await getCurrentAgencyOrgId()});

  return <WhiteLabelCustomersPage customers={customers} />;
}
