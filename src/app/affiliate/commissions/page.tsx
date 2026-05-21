import {getCurrentAffiliateUserId} from "../../../server/context";
import {
  getCommissionTotals,
  listCommissions,
  listPayouts,
} from "../../../server/queries/affiliate";
import {AffiliateCommissionsPage} from "../../../views/affiliate/commissions-page";

export default async function Page() {
  const affiliateUserId = await getCurrentAffiliateUserId();
  const [commissions, payouts, totals] = await Promise.all([
    listCommissions({affiliateUserId}),
    listPayouts({affiliateUserId}),
    getCommissionTotals({affiliateUserId}),
  ]);

  return (
    <AffiliateCommissionsPage
      commissions={commissions}
      payouts={payouts}
      totals={totals}
    />
  );
}
