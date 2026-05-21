import {getCurrentAgencyOrgId} from "../../../server/context";
import {
  listAgencyBrandVoices,
  listAgencySocialPosts,
} from "../../../server/queries/agency";
import {WhiteLabelSocialPage} from "../../../views/white-label/social-page";

export default async function Page() {
  const agencyOrgId = await getCurrentAgencyOrgId();

  const [posts, voices] = await Promise.all([
    listAgencySocialPosts({agencyOrgId}),
    listAgencyBrandVoices({agencyOrgId}),
  ]);

  return <WhiteLabelSocialPage posts={posts} voices={voices} />;
}
