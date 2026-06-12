import {getCurrentAgencyOrgId} from "../../../server/context";
import {listAgencyInvoices} from "../../../server/queries/agency";
import {collections} from "../../../server/db/collections";
import {serializeOrganization} from "../../../server/db/schemas/organizations";
import {WhiteLabelBillingPage} from "../../../views/white-label/billing-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page() {
  const agencyOrgId = await getCurrentAgencyOrgId();

  const {ObjectId} = await import("mongodb");
  const orgsCol = await collections.organizations();
  const orgDoc = await orgsCol.findOne({_id: new ObjectId(agencyOrgId)});
  const organization = orgDoc ? serializeOrganization(orgDoc) : null;

  const invoices = await listAgencyInvoices({agencyOrgId});

  return <WhiteLabelBillingPage invoices={invoices} organization={organization} />;
}
