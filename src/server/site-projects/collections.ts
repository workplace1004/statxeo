import "server-only";

import type {Collection, Document} from "mongodb";

import {getDb} from "@/server/db/database";

import type {
  ApiKeyDoc,
  CreditLedgerEventDoc,
  CustomerLeadLinkDoc,
  GenerationArtifactDoc,
  IdempotencyKeyDoc,
  OutboxEventDoc,
  SiteChangeRequestDoc,
  SiteGenerationEventDoc,
  SiteGenerationJobDoc,
  LeadImageDoc,
  SiteIntakeSubmissionDoc,
  SiteLeadDoc,
  SiteMediaAssetDoc,
  SiteProjectDoc,
  SiteRevisionDoc,
  SiteTemplateRegistryDoc,
  WhiteLabelerSocialAccountDoc,
} from "./schemas";

export const SITE_PROJECT_COLLECTION_NAMES = {
  siteProjects: "siteProjects",
  siteRevisions: "siteRevisions",
  siteGenerationJobs: "siteGenerationJobs",
  siteGenerationEvents: "siteGenerationEvents",
  generationArtifacts: "generationArtifacts",
  siteChangeRequests: "siteChangeRequests",
  siteMediaAssets: "siteMediaAssets",
  customerLeadLinks: "customerLeadLinks",
  siteLeads: "siteLeads",
  idempotencyKeys: "idempotencyKeys",
  outboxEvents: "outboxEvents",
  creditLedgerEvents: "creditLedgerEvents",
  apiKeys: "apiKeys",
  siteIntakeSubmissions: "siteIntakeSubmissions",
  siteTemplateRegistry: "siteTemplateRegistry",
  leadImages: "leadImages",
  whiteLabelerSocialAccounts: "whiteLabelerSocialAccounts",
} as const;

async function coll<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

export const siteProjectCollections = {
  siteProjects: () => coll<SiteProjectDoc>(SITE_PROJECT_COLLECTION_NAMES.siteProjects),
  siteRevisions: () => coll<SiteRevisionDoc>(SITE_PROJECT_COLLECTION_NAMES.siteRevisions),
  siteGenerationJobs: () =>
    coll<SiteGenerationJobDoc>(SITE_PROJECT_COLLECTION_NAMES.siteGenerationJobs),
  siteGenerationEvents: () =>
    coll<SiteGenerationEventDoc>(SITE_PROJECT_COLLECTION_NAMES.siteGenerationEvents),
  generationArtifacts: () =>
    coll<GenerationArtifactDoc>(SITE_PROJECT_COLLECTION_NAMES.generationArtifacts),
  siteChangeRequests: () =>
    coll<SiteChangeRequestDoc>(SITE_PROJECT_COLLECTION_NAMES.siteChangeRequests),
  siteMediaAssets: () => coll<SiteMediaAssetDoc>(SITE_PROJECT_COLLECTION_NAMES.siteMediaAssets),
  customerLeadLinks: () =>
    coll<CustomerLeadLinkDoc>(SITE_PROJECT_COLLECTION_NAMES.customerLeadLinks),
  siteLeads: () => coll<SiteLeadDoc>(SITE_PROJECT_COLLECTION_NAMES.siteLeads),
  idempotencyKeys: () => coll<IdempotencyKeyDoc>(SITE_PROJECT_COLLECTION_NAMES.idempotencyKeys),
  outboxEvents: () => coll<OutboxEventDoc>(SITE_PROJECT_COLLECTION_NAMES.outboxEvents),
  creditLedgerEvents: () =>
    coll<CreditLedgerEventDoc>(SITE_PROJECT_COLLECTION_NAMES.creditLedgerEvents),
  apiKeys: () => coll<ApiKeyDoc>(SITE_PROJECT_COLLECTION_NAMES.apiKeys),
  siteIntakeSubmissions: () =>
    coll<SiteIntakeSubmissionDoc>(SITE_PROJECT_COLLECTION_NAMES.siteIntakeSubmissions),
  siteTemplateRegistry: () =>
    coll<SiteTemplateRegistryDoc>(SITE_PROJECT_COLLECTION_NAMES.siteTemplateRegistry),
  leadImages: () => coll<LeadImageDoc>(SITE_PROJECT_COLLECTION_NAMES.leadImages),
  whiteLabelerSocialAccounts: () =>
    coll<WhiteLabelerSocialAccountDoc>(
      SITE_PROJECT_COLLECTION_NAMES.whiteLabelerSocialAccounts,
    ),
} as const;
