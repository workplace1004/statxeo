import {getCurrentAgencyOrgId} from "../../../server/context";
import {listAgencyKeywords} from "../../../server/queries/agency";
import {WhiteLabelSeoPage} from "../../../views/white-label/seo-page";

export default async function Page() {
  const keywords = await listAgencyKeywords({agencyOrgId: await getCurrentAgencyOrgId()});

  return <WhiteLabelSeoPage keywords={keywords} />;
}
