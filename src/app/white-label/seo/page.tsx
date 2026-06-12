import {getCurrentAgencyOrgId} from "../../../server/context";
import {listAgencyKeywords, listCompetitors} from "../../../server/queries/agency";
import {WhiteLabelSeoPage} from "../../../views/white-label/seo-page";

export default async function Page() {
  const agencyOrgId = await getCurrentAgencyOrgId();
  const [keywords, competitors] = await Promise.all([
    listAgencyKeywords({agencyOrgId}),
    listCompetitors({agencyOrgId}),
  ]);

  return <WhiteLabelSeoPage keywords={keywords} competitors={competitors} />;
}
