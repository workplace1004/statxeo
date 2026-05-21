import "server-only";

import {collections} from "../db/collections";
import {
  serializeAffiliateTicket,
  serializeCustomerTicket,
  serializeFaq,
  serializeKnowledgeArticle,
  type AffiliateSupportTicket,
  type CustomerSupportTicket,
  type FaqItem,
  type KnowledgeArticle,
  type SupportAudience,
} from "../db/schemas/support-tickets";

export async function listAffiliateSupportTickets(opts: {
  affiliateUserId: string;
}): Promise<AffiliateSupportTicket[]> {
  const c = await collections.supportTickets();
  const docs = await c
    .find({audience: "affiliate", userId: opts.affiliateUserId})
    .sort({lastUpdatedAt: -1})
    .limit(50)
    .toArray();

  return docs.map(serializeAffiliateTicket);
}

export async function listCustomerSupportTickets(opts: {
  customerOrgId: string;
}): Promise<CustomerSupportTicket[]> {
  const c = await collections.supportTickets();
  const docs = await c
    .find({audience: "customer", orgId: opts.customerOrgId})
    .sort({lastUpdatedAt: -1})
    .limit(50)
    .toArray();

  return docs.map(serializeCustomerTicket);
}

export async function listFaqs(audience: SupportAudience): Promise<FaqItem[]> {
  const c = await collections.faqs();
  const docs = await c.find({audience}).sort({position: 1}).toArray();

  return docs.map(serializeFaq);
}

export async function listKnowledgeArticles(
  audience: SupportAudience,
): Promise<KnowledgeArticle[]> {
  const c = await collections.knowledgeArticles();
  const docs = await c.find({audience}).sort({category: 1, title: 1}).toArray();

  return docs.map(serializeKnowledgeArticle);
}
