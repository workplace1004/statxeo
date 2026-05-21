import {getCurrentAgencyOrgId} from "../../../server/context";
import {
  listBrandAssets,
  listBrandPalettes,
  listBrandedDomains,
} from "../../../server/queries/agency";
import {WhiteLabelBrandingPage} from "../../../views/white-label/branding-page";

export default async function Page() {
  const agencyOrgId = await getCurrentAgencyOrgId();

  const [palettes, assets, domains] = await Promise.all([
    listBrandPalettes({agencyOrgId}),
    listBrandAssets({agencyOrgId}),
    listBrandedDomains({agencyOrgId}),
  ]);

  return <WhiteLabelBrandingPage assets={assets} domains={domains} palettes={palettes} />;
}
