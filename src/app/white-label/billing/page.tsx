import {getCurrentAgencyOrgId} from "../../../server/context";
import {listAgencyInvoices} from "../../../server/queries/agency";
import {WhiteLabelBillingPage} from "../../../views/white-label/billing-page";

export default async function Page() {
  const invoices = await listAgencyInvoices({agencyOrgId: await getCurrentAgencyOrgId()});

  return <WhiteLabelBillingPage invoices={invoices} />;
}
