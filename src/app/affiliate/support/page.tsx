import {getCurrentAffiliateUserId} from "../../../server/context";
import {
  listAffiliateSupportTickets,
  listFaqs,
  listKnowledgeArticles,
} from "../../../server/queries/support";
import {AffiliateSupportPage} from "../../../views/affiliate/support-page";

export default async function Page() {
  const affiliateUserId = await getCurrentAffiliateUserId();
  const [tickets, faqs, articles] = await Promise.all([
    listAffiliateSupportTickets({affiliateUserId}),
    listFaqs("affiliate"),
    listKnowledgeArticles("affiliate"),
  ]);

  return <AffiliateSupportPage articles={articles} faqs={faqs} tickets={tickets} />;
}
