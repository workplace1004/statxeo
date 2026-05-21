import {getCurrentCustomerOrgId} from "../../../server/context";
import {listCustomerSupportTickets, listKnowledgeArticles} from "../../../server/queries/support";
import {CustomerSupportPage} from "../../../views/customer/support-page";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const [tickets, articles] = await Promise.all([
    listCustomerSupportTickets({customerOrgId}),
    listKnowledgeArticles("customer"),
  ]);

  return <CustomerSupportPage articles={articles} tickets={tickets} />;
}
