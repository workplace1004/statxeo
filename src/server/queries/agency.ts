import "server-only";

import {collections} from "../db/collections";
import {serializeAiActivity, type AiActivity} from "../db/schemas/ai-activity";
import {
  serializeActivityLogEntry,
  serializeAgencyTeamMember,
  type ActivityLogEntry,
  type AgencyTeamMember,
} from "../db/schemas/agency-team";
import {serializeApproval, type Approval} from "../db/schemas/approvals";
import {
  serializeBrandAsset,
  serializeBrandPalette,
  serializeBrandVoice,
  serializeBrandedDomain,
  type BrandAsset,
  type BrandPalette,
  type BrandVoice,
  type BrandedDomain,
} from "../db/schemas/branding";
import {serializeCustomer, type Customer} from "../db/schemas/customers";
import {serializeInvoiceAgency, type InvoiceAgency} from "../db/schemas/invoices";
import {serializeKeyword, type Keyword} from "../db/schemas/keywords";
import {
  serializeOnboardingFlow,
  serializeOnboardingStep,
  serializeServiceOption,
  type OnboardingCustomer,
  type OnboardingStep,
  type ServiceOption,
} from "../db/schemas/onboarding";
import {serializeSite, type Site} from "../db/schemas/sites";
import {serializeSocialPostAgency, type SocialPostAgency} from "../db/schemas/social-posts";
import {serializeWorkflow, type Workflow} from "../db/schemas/workflows";

export interface AgencyScope {
  agencyOrgId: string;
}

// ─── Customers ─────────────────────────────────────────────────────────────

export async function listCustomers(opts: AgencyScope & {limit?: number}): Promise<Customer[]> {
  const c = await collections.customers();
  const docs = await c
    .find({agencyOrgId: opts.agencyOrgId})
    .sort({mrrCents: -1})
    .limit(opts.limit ?? 500)
    .toArray();

  return docs.map(serializeCustomer);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  if (!isValidId(id)) return null;
  const c = await collections.customers();
  const {ObjectId} = await import("mongodb");
  const doc = await c.findOne({_id: new ObjectId(id)});

  return doc ? serializeCustomer(doc) : null;
}

export async function countActiveCustomers(opts: AgencyScope): Promise<number> {
  const c = await collections.customers();

  return c.countDocuments({agencyOrgId: opts.agencyOrgId, status: "Active"});
}

// ─── Sites ─────────────────────────────────────────────────────────────────

export async function listSites(opts: AgencyScope): Promise<Site[]> {
  const c = await collections.sites();
  const docs = await c.find({agencyOrgId: opts.agencyOrgId}).limit(500).toArray();

  return docs.map(serializeSite);
}

// ─── Keywords (agency-managed) ─────────────────────────────────────────────

export async function listAgencyKeywords(opts: AgencyScope): Promise<Keyword[]> {
  const c = await collections.keywords();
  const docs = await c.find({agencyOrgId: opts.agencyOrgId}).limit(500).toArray();

  return docs.map(serializeKeyword);
}

// ─── Social posts (agency) ─────────────────────────────────────────────────

export async function listAgencySocialPosts(opts: AgencyScope): Promise<SocialPostAgency[]> {
  const c = await collections.socialPosts();
  const docs = await c
    .find({agencyOrgId: opts.agencyOrgId})
    .sort({scheduledFor: -1})
    .limit(200)
    .toArray();

  return docs.map(serializeSocialPostAgency);
}

export async function listAgencyBrandVoices(opts: AgencyScope): Promise<BrandVoice[]> {
  const c = await collections.brandVoices();
  const docs = await c.find({agencyOrgId: opts.agencyOrgId}).toArray();

  return docs.map(serializeBrandVoice);
}

// ─── Workflows ─────────────────────────────────────────────────────────────

export async function listWorkflows(opts: AgencyScope): Promise<Workflow[]> {
  const c = await collections.workflows();
  const docs = await c
    .find({agencyOrgId: opts.agencyOrgId})
    .sort({updatedAt: -1})
    .limit(200)
    .toArray();

  return docs.map(serializeWorkflow);
}

// ─── Revenue ───────────────────────────────────────────────────────────────

export interface RevenuePoint {
  month: string;
  mrr: number;
  expansion: number;
  churn: number;
}

export async function getRevenueSeries(opts: AgencyScope): Promise<RevenuePoint[]> {
  const c = await collections.revenueEvents();
  const docs = await c
    .aggregate<RevenuePoint>([
      {$match: {orgId: opts.agencyOrgId}},
      {
        $group: {
          _id: {$dateToString: {format: "%Y-%m", date: "$occurredAt"}},
          mrr: {$sum: {$cond: [{$eq: ["$kind", "subscription"]}, "$amountCents", 0]}},
          expansion: {$sum: {$cond: [{$eq: ["$kind", "expansion"]}, "$amountCents", 0]}},
          churn: {$sum: {$cond: [{$eq: ["$kind", "churn"]}, "$amountCents", 0]}},
        },
      },
      {$sort: {_id: 1}},
      {
        $project: {
          _id: 0,
          month: "$_id",
          mrr: {$divide: ["$mrr", 100]},
          expansion: {$divide: ["$expansion", 100]},
          churn: {$divide: [{$abs: "$churn"}, 100]},
        },
      },
    ])
    .toArray();

  return docs;
}

export async function getRevenueThisMonth(opts: AgencyScope): Promise<number> {
  const c = await collections.revenueEvents();
  const start = new Date();

  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await c
    .aggregate<{total: number}>([
      {$match: {orgId: opts.agencyOrgId, occurredAt: {$gte: start}}},
      {$group: {_id: null, total: {$sum: "$amountCents"}}},
    ])
    .toArray();

  return row ? Math.round(row.total / 100) : 0;
}

// ─── AI activity ───────────────────────────────────────────────────────────

export async function listAiActivity(opts: AgencyScope & {limit?: number}): Promise<AiActivity[]> {
  const c = await collections.aiActivity();
  const docs = await c
    .find({orgId: opts.agencyOrgId})
    .sort({occurredAt: -1})
    .limit(opts.limit ?? 50)
    .toArray();

  return docs.map(serializeAiActivity);
}

// ─── Approvals ─────────────────────────────────────────────────────────────

export async function listPendingApprovals(opts: AgencyScope): Promise<Approval[]> {
  const c = await collections.approvals();
  const docs = await c
    .find({orgId: opts.agencyOrgId, status: "pending"})
    .sort({dueAt: 1})
    .limit(50)
    .toArray();

  return docs.map(serializeApproval);
}

// ─── Agency team ───────────────────────────────────────────────────────────

export async function listAgencyTeam(opts: AgencyScope): Promise<AgencyTeamMember[]> {
  const c = await collections.agencyTeam();
  const docs = await c.find({agencyOrgId: opts.agencyOrgId}).toArray();

  return docs.map(serializeAgencyTeamMember);
}

export async function listAgencyActivityLog(opts: AgencyScope): Promise<ActivityLogEntry[]> {
  const c = await collections.activityLog();
  const docs = await c
    .find({agencyOrgId: opts.agencyOrgId})
    .sort({occurredAt: -1})
    .limit(50)
    .toArray();

  return docs.map(serializeActivityLogEntry);
}

// ─── Invoices (agency-facing) ──────────────────────────────────────────────

export async function listAgencyInvoices(opts: AgencyScope): Promise<InvoiceAgency[]> {
  const c = await collections.invoices();
  const docs = await c
    .find({orgId: opts.agencyOrgId})
    .sort({issuedAt: -1})
    .limit(200)
    .toArray();

  return docs.map(serializeInvoiceAgency);
}

// ─── Branding ──────────────────────────────────────────────────────────────

export async function listBrandPalettes(opts: AgencyScope): Promise<BrandPalette[]> {
  const c = await collections.brandPalettes();
  const docs = await c.find({agencyOrgId: opts.agencyOrgId}).toArray();

  return docs.map(serializeBrandPalette);
}

export async function listBrandAssets(opts: AgencyScope): Promise<BrandAsset[]> {
  const c = await collections.brandAssets();
  const docs = await c.find({agencyOrgId: opts.agencyOrgId}).toArray();

  return docs.map(serializeBrandAsset);
}

export async function listBrandedDomains(opts: AgencyScope): Promise<BrandedDomain[]> {
  const c = await collections.brandedDomains();
  const docs = await c.find({agencyOrgId: opts.agencyOrgId}).toArray();

  return docs.map(serializeBrandedDomain);
}

// ─── Onboarding ────────────────────────────────────────────────────────────

export async function listOnboardingSteps(opts: AgencyScope): Promise<OnboardingStep[]> {
  const c = await collections.onboardingSteps();
  const docs = await c
    .find({agencyOrgId: opts.agencyOrgId})
    .sort({position: 1})
    .toArray();

  return docs.map(serializeOnboardingStep);
}

export async function listOnboardingFlows(opts: AgencyScope): Promise<OnboardingCustomer[]> {
  const c = await collections.onboardingFlows();
  const docs = await c.find({agencyOrgId: opts.agencyOrgId}).limit(100).toArray();

  return docs.map(serializeOnboardingFlow);
}

export async function listServiceOptions(opts: AgencyScope): Promise<ServiceOption[]> {
  const c = await collections.serviceOptions();
  const docs = await c
    .find({agencyOrgId: opts.agencyOrgId})
    .sort({position: 1})
    .toArray();

  return docs.map(serializeServiceOption);
}

// ─── helpers ───────────────────────────────────────────────────────────────

const HEX24 = /^[0-9a-fA-F]{24}$/;

function isValidId(id: string): boolean {
  return HEX24.test(id);
}
