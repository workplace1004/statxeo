import {getCurrentCustomerOrgId} from "../../../server/context";
import {listCustomerSocialPosts} from "../../../server/queries/customer";
import {CustomerSocialPage} from "../../../views/customer/social-page";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const posts = await listCustomerSocialPosts({customerOrgId});

  return <CustomerSocialPage posts={posts} />;
}
