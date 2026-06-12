import {getCurrentAgencyOrgId} from "../../../server/context";
import {collections} from "../../../server/db/collections";
import {serializeOrganization} from "../../../server/db/schemas/organizations";
import {WhiteLabelSettingsPage} from "../../../views/white-label/settings-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page() {
  const agencyOrgId = await getCurrentAgencyOrgId();

  const {ObjectId} = await import("mongodb");
  const orgsCol = await collections.organizations();
  const orgDoc = await orgsCol.findOne({_id: new ObjectId(agencyOrgId)});
  const organization = orgDoc ? serializeOrganization(orgDoc) : null;

  return <WhiteLabelSettingsPage organization={organization} />;
}
