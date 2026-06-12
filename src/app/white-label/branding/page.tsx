import {getCurrentAgencyOrgId} from "../../../server/context";
import {
  listBrandAssets,
  listBrandPalettes,
  listBrandedDomains,
} from "../../../server/queries/agency";
import {WhiteLabelBrandingPage} from "../../../views/white-label/branding-page";
import {collections} from "../../../server/db/collections";
import {serializeOrganization} from "../../../server/db/schemas/organizations";

export default async function Page() {
  const agencyOrgId = await getCurrentAgencyOrgId();

  const {ObjectId} = await import("mongodb");
  const orgsCol = await collections.organizations();
  const orgDoc = await orgsCol.findOne({_id: new ObjectId(agencyOrgId)});
  const organization = orgDoc ? serializeOrganization(orgDoc) : null;

  const [palettes, assets, domains] = await Promise.all([
    listBrandPalettes({agencyOrgId}),
    listBrandAssets({agencyOrgId}),
    listBrandedDomains({agencyOrgId}),
  ]);

  return (
    <WhiteLabelBrandingPage
      assets={assets}
      domains={domains}
      palettes={palettes}
      organization={organization}
    />
  );
}
