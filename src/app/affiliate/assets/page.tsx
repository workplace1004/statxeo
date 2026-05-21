import {listMarketingAssets} from "../../../server/queries/affiliate";
import {AffiliateAssetsPage} from "../../../views/affiliate/assets-page";

export default async function Page() {
  const assets = await listMarketingAssets();

  return <AffiliateAssetsPage assets={assets} />;
}
