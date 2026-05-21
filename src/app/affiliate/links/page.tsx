import {getCurrentAffiliateUserId} from "../../../server/context";
import {listReferralLinks} from "../../../server/queries/affiliate";
import {AffiliateLinksPage} from "../../../views/affiliate/links-page";

export default async function Page() {
  const affiliateUserId = await getCurrentAffiliateUserId();
  const links = await listReferralLinks({affiliateUserId});

  return <AffiliateLinksPage links={links} />;
}
