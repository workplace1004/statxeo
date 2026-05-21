import {getCurrentAffiliateUserId} from "../../../server/context";
import {listMeetings} from "../../../server/queries/affiliate";
import {AffiliateMeetingsPage} from "../../../views/affiliate/meetings-page";

export default async function Page() {
  const affiliateUserId = await getCurrentAffiliateUserId();
  const meetings = await listMeetings({affiliateUserId});

  return <AffiliateMeetingsPage meetings={meetings} />;
}
