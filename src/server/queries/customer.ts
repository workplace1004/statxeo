import "server-only";

import {idToString} from "../db/schemas/_helpers";
import {siteProjectCollections} from "../site-projects/collections";
import {collections} from "../db/collections";
import {serializeAiSetting, type AiSettings} from "../db/schemas/ai-settings";
import {serializeAiTask, type AiTask} from "../db/schemas/ai-tasks";
import {
  serializeBusinessProfile,
  type BusinessProfile,
} from "../db/schemas/business-profile";
import {serializeCall, serializePhoneNumber, type Call, type PhoneNumber} from "../db/schemas/calls";
import {serializeChatMessage, type ChatMessage} from "../db/schemas/chat-messages";
import {serializeCompetitor, type Competitor} from "../db/schemas/competitors";
import {
  serializeCustomerKeyword,
  type CustomerKeyword,
} from "../db/schemas/customer-keywords";
import {
  serializeCustomerTeamMember,
  type CustomerTeamMember,
} from "../db/schemas/customer-team";
import {serializeDomain, type Domain} from "../db/schemas/domains";
import {serializeIntegration, type Integration} from "../db/schemas/integrations";
import {serializeInvoiceCustomer, type InvoiceCustomer} from "../db/schemas/invoices";
import {
  serializeNotificationPreference,
  type NotificationPreference,
} from "../db/schemas/notification-preferences";
import {serializeReview, type Review} from "../db/schemas/reviews";
import {
  serializeSocialPostCustomer,
  type SocialPostCustomer,
} from "../db/schemas/social-posts";
import {serializeWebsitePage, type WebsitePage} from "../db/schemas/website-pages";

export interface CustomerScope {
  customerOrgId: string;
}

// ─── Business profile (singleton-per-org) ──────────────────────────────────

export async function getBusinessProfile(opts: CustomerScope): Promise<BusinessProfile | null> {
  const c = await collections.businessProfiles();
  const doc = await c.findOne({customerOrgId: opts.customerOrgId});

  return doc ? serializeBusinessProfile(doc) : null;
}

// ─── Domains ───────────────────────────────────────────────────────────────

export async function listDomains(opts: CustomerScope): Promise<Domain[]> {
  const c = await collections.domains();
  const docs = await c.find({customerOrgId: opts.customerOrgId}).toArray();

  return docs.map(serializeDomain);
}

// ─── Keywords ──────────────────────────────────────────────────────────────

export async function listCustomerKeywords(opts: CustomerScope): Promise<CustomerKeyword[]> {
  const c = await collections.customerKeywords();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId})
    .sort({position: 1})
    .limit(500)
    .toArray();

  return docs.map(serializeCustomerKeyword);
}

export async function getAverageRanking(opts: CustomerScope): Promise<number | null> {
  const c = await collections.customerKeywords();
  const [row] = await c
    .aggregate<{avg: number}>([
      {$match: {customerOrgId: opts.customerOrgId, position: {$ne: null}}},
      {$group: {_id: null, avg: {$avg: "$position"}}},
    ])
    .toArray();

  return row ? Math.round(row.avg * 10) / 10 : null;
}

// ─── Competitors ───────────────────────────────────────────────────────────

export async function listCompetitors(opts: CustomerScope): Promise<Competitor[]> {
  const c = await collections.competitors();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId})
    .sort({visibility: -1})
    .toArray();

  return docs.map(serializeCompetitor);
}

// ─── Reviews ───────────────────────────────────────────────────────────────

export async function listReviews(opts: CustomerScope): Promise<Review[]> {
  const c = await collections.reviews();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId})
    .sort({postedAt: -1})
    .limit(200)
    .toArray();

  return docs.map(serializeReview);
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  starDistribution: Array<{stars: number; count: number}>;
}

export async function getReviewSummary(opts: CustomerScope): Promise<ReviewSummary> {
  const c = await collections.reviews();
  const [summary] = await c
    .aggregate<{avg: number; total: number}>([
      {$match: {customerOrgId: opts.customerOrgId}},
      {$group: {_id: null, avg: {$avg: "$rating"}, total: {$sum: 1}}},
    ])
    .toArray();

  const distribution = await c
    .aggregate<{_id: number; count: number}>([
      {$match: {customerOrgId: opts.customerOrgId}},
      {$group: {_id: "$rating", count: {$sum: 1}}},
      {$sort: {_id: -1}},
    ])
    .toArray();

  return {
    averageRating: summary ? Math.round(summary.avg * 10) / 10 : 0,
    totalReviews: summary?.total ?? 0,
    starDistribution: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: distribution.find((d) => d._id === stars)?.count ?? 0,
    })),
  };
}

// ─── Calls + phones ────────────────────────────────────────────────────────

export async function listCalls(opts: CustomerScope): Promise<Call[]> {
  const c = await collections.calls();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId})
    .sort({startedAt: -1})
    .limit(200)
    .toArray();

  return docs.map(serializeCall);
}

export async function listPhoneNumbers(opts: CustomerScope): Promise<PhoneNumber[]> {
  const c = await collections.phoneNumbers();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId})
    .sort({isPrimary: -1})
    .toArray();

  return docs.map(serializePhoneNumber);
}

// ─── AI tasks / settings / chat ────────────────────────────────────────────

export async function listAiTasks(opts: CustomerScope): Promise<AiTask[]> {
  const c = await collections.aiTasks();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId})
    .sort({createdAt: -1})
    .limit(50)
    .toArray();

  return docs.map(serializeAiTask);
}

export async function listAiSettings(opts: CustomerScope): Promise<AiSettings[]> {
  const c = await collections.aiSettings();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId})
    .sort({position: 1})
    .toArray();

  return docs.map(serializeAiSetting);
}

export async function listChatHistory(opts: CustomerScope): Promise<ChatMessage[]> {
  const c = await collections.chatMessages();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId, conversationId: "default"})
    .sort({sentAt: 1})
    .limit(200)
    .toArray();

  return docs.map(serializeChatMessage);
}

// ─── Integrations ──────────────────────────────────────────────────────────

export async function listIntegrations(opts: CustomerScope): Promise<Integration[]> {
  const c = await collections.integrations();
  const docs = await c.find({orgId: opts.customerOrgId}).toArray();

  return docs.map(serializeIntegration);
}

// ─── Team ──────────────────────────────────────────────────────────────────

export async function listCustomerTeam(opts: CustomerScope): Promise<CustomerTeamMember[]> {
  const c = await collections.customerTeam();
  const docs = await c.find({customerOrgId: opts.customerOrgId}).toArray();

  return docs.map(serializeCustomerTeamMember);
}

// ─── Invoices ──────────────────────────────────────────────────────────────

export async function listCustomerInvoices(opts: CustomerScope): Promise<InvoiceCustomer[]> {
  const c = await collections.invoices();
  const docs = await c
    .find({orgId: opts.customerOrgId})
    .sort({issuedAt: -1})
    .limit(50)
    .toArray();

  return docs.map(serializeInvoiceCustomer);
}

// ─── Social posts (customer) ───────────────────────────────────────────────

export async function listCustomerSocialPosts(opts: CustomerScope): Promise<SocialPostCustomer[]> {
  const c = await collections.socialPosts();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId})
    .sort({scheduledFor: -1})
    .limit(200)
    .toArray();

  return docs.map(serializeSocialPostCustomer);
}

// ─── Website pages ─────────────────────────────────────────────────────────

export async function listWebsitePages(opts: CustomerScope): Promise<WebsitePage[]> {
  const c = await collections.websitePages();
  const docs = await c
    .find({customerOrgId: opts.customerOrgId})
    .sort({updatedAt: -1})
    .limit(200)
    .toArray();

  return docs.map(serializeWebsitePage);
}

// ─── Notification preferences ──────────────────────────────────────────────

export async function listNotificationPreferences(
  opts: CustomerScope,
): Promise<NotificationPreference[]> {
  const c = await collections.notificationPreferences();
  const docs = await c.find({orgId: opts.customerOrgId}).toArray();

  return docs.map(serializeNotificationPreference);
}

// ─── Active site project ───────────────────────────────────────────────────

export interface ActiveProjectInfo {
  projectId: string;
  status: string;
  packageTier: string;
  businessName: string | null;
  previewUrl: string | null;
}

const TERMINAL_PROJECT_STATUSES = ["live", "cancelled", "deleted"];

export async function getActiveProject(opts: CustomerScope): Promise<ActiveProjectInfo | null> {
  const coll = await siteProjectCollections.siteProjects();
  const doc = await coll.findOne(
    {orgId: opts.customerOrgId, deletedAt: null, status: {$nin: TERMINAL_PROJECT_STATUSES}},
    {sort: {createdAt: -1}},
  );
  if (!doc) return null;
  return {
    projectId: idToString(doc._id),
    status: doc.status,
    packageTier: doc.packageTier,
    businessName: doc.businessName,
    previewUrl: doc.previewUrl,
  };
}
