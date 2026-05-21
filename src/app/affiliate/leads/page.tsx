import {getCurrentAffiliateUserId} from "../../../server/context";
import {listLeads} from "../../../server/queries/affiliate";
import {AffiliateLeadsPage} from "../../../views/affiliate/leads-page";

export default async function Page() {
  const affiliateUserId = await getCurrentAffiliateUserId();
  const leads = await listLeads({affiliateUserId});

  return <AffiliateLeadsPage leads={leads} />;
}
