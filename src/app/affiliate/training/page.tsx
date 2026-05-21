import {getCurrentAffiliateUserId} from "../../../server/context";
import {getTrainingStats, listTrainingModules} from "../../../server/queries/affiliate";
import {AffiliateTrainingPage} from "../../../views/affiliate/training-page";

export default async function Page() {
  const affiliateUserId = await getCurrentAffiliateUserId();
  const [modules, stats] = await Promise.all([
    listTrainingModules({affiliateUserId}),
    getTrainingStats({affiliateUserId}),
  ]);

  return <AffiliateTrainingPage modules={modules} stats={stats} />;
}
