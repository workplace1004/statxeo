import "server-only";

import type {ObjectId} from "mongodb";

import {z} from "zod";

import type {BaseDoc} from "@/server/db/schemas/_helpers";
import {dateToIso, idToString, zDate} from "@/server/db/schemas/_helpers";

import type {JobStatus, RevisionStatus} from "./state-machine";
import {JOB_STATUSES, REVISION_STATUSES} from "./state-machine";

export const DOMAIN_SCHEMA_VERSION = 1;

export const GENERATION_EVENT_TYPES = [
  "JOB_CREATED",
  "STAGE_STARTED",
  "STAGE_COMPLETED",
  "ARTIFACT_WRITTEN",
  "STAGE_FAILED",
  "JOB_RECOVERED",
  "JOB_CANCELLED",
  "DEAD_LETTERED",
] as const;

export type GenerationEventType = (typeof GENERATION_EVENT_TYPES)[number];

export const CREDIT_LEDGER_EVENT_TYPES = [
  "CREDIT_RESERVED",
  "CREDIT_CONSUMED",
  "CREDIT_RELEASED",
  "TOKEN_USAGE_RECORDED",
  "GENERATION_COST_RECORDED",
] as const;

export type CreditLedgerEventType = (typeof CREDIT_LEDGER_EVENT_TYPES)[number];

export const OUTBOX_STATUSES = ["pending", "delivered", "failed"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export interface SiteProjectDoc extends BaseDoc {
  schemaVersion: number;
  orgId: string;
  customerId: string | null;
  leadId: string | null;
  ownerUserId: string;
  packageTier: string;
  businessName: string | null;
  ownerFullName: string | null;
  status: string;
  previewUrl: string | null;
  productionUrl: string | null;
  domainName: string | null;
  templateId: string | null;
  brandTone: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  draftRevisionId: string | null;
  previewRevisionId: string | null;
  approvedRevisionId: string | null;
  publishedRevisionId: string | null;
  previousPublishedRevisionId: string | null;
  publishedBy: string | null;
  publishedAt: Date | null;
  publishReason: string | null;
  rollbackAvailable: boolean;
  deletedAt: Date | null;
  siteToken: string | null;
  targetAudience: string | null;
  uniqueSellingPoints: string | null;
  offeredServices: string[] | null;
  serviceAreas: string | null;
  ctaPreference: string | null;
  businessHours: string | null;
  socialLinks: Record<string, string> | null;
  vercelDeploymentId: string | null;
  purchaseId: string | null;
}

export interface SiteRevisionDoc extends BaseDoc {
  schemaVersion: number;
  projectId: string;
  orgId: string;
  status: RevisionStatus;
  contentRef: string | null;
  storageKey: string | null;
}

export interface SiteGenerationJobDoc extends BaseDoc {
  schemaVersion: number;
  projectId: string;
  orgId: string;
  jobType: string;
  status: JobStatus;
  stage: string | null;
  errorMessage: string | null;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  lastHeartbeatAt: Date | null;
  attemptCount: number;
  idempotencyKey: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  tokenUsageInput: number | null;
  tokenUsageOutput: number | null;
  modelUsed: string | null;
}

export interface SiteGenerationEventDoc extends BaseDoc {
  schemaVersion: number;
  projectId: string;
  jobId: string;
  orgId: string;
  eventType: GenerationEventType;
  stage: string | null;
  payload: Record<string, unknown>;
  actorUserId: string | null;
  model?: string;
  promptVersion?: string;
  toolVersion?: string;
  inputChecksum?: string;
  outputChecksum?: string;
}

export interface GenerationArtifactDoc extends BaseDoc {
  schemaVersion: number;
  projectId: string;
  jobId: string;
  orgId: string;
  artifactType: string;
  storageKey: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  checksum: string | null;
  payloadInline: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  isCurrent: boolean;
  schemaVersionLabel: string | null;
}

export interface SiteChangeRequestDoc extends BaseDoc {
  projectId: string;
  orgId: string;
  scopeType: string;
  pageKey: string | null;
  sectionKey: string | null;
  description: string;
  status: string;
  resolvedAt: Date | null;
  generationJobId: string | null;
}

export interface SiteMediaAssetDoc extends BaseDoc {
  projectId: string;
  orgId: string;
  assetType: string;
  storagePath: string;
  originalFilename: string | null;
  mimeType: string | null;
  placementHint: string | null;
  sortOrder: number;
}

export interface CustomerLeadLinkDoc extends BaseDoc {
  userId: string;
  leadId: string;
  orgId: string;
}

export interface SiteLeadDoc extends BaseDoc {
  orgId: string;
  contactEmail: string;
  contactName: string | null;
  contactPhone: string | null;
  status: string;
  packageTier: string | null;
  businessName: string | null;
  ownerFullName: string | null;
  intakeJson: Record<string, unknown> | null;
  purchasedAt: Date | null;
}

export interface WhiteLabelerSocialAccountDoc extends BaseDoc {
  whiteLabelerId: string;
  outstandAccountId: string;
  provider: string;
  displayName: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  connectedByUserId: string | null;
}

export interface SiteIntakeSubmissionDoc extends BaseDoc {
  projectId: string;
  orgId: string;
  version: number;
  normalizedPayload: Record<string, unknown> | null;
  rawPayload: Record<string, unknown> | null;
}

export interface SiteTemplateRegistryDoc extends BaseDoc {
  name: string;
  slotSchema: Record<string, unknown>;
  pages: unknown[];
  rendererVersion: string;
  isActive: boolean;
}

export interface LeadImageDoc extends BaseDoc {
  leadId: string;
  storageBucket: string;
  storagePath: string;
  publicUrl: string | null;
  sortOrder: number;
}

export interface IdempotencyKeyDoc extends BaseDoc {
  key: string;
  route: string;
  status: "pending" | "completed" | "failed";
  resultHash: string | null;
  responseSnapshot: unknown;
  expiresAt: Date;
}

export interface OutboxEventDoc extends BaseDoc {
  orgId: string | null;
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  status: OutboxStatus;
  deliveredAt: Date | null;
  lastError: string | null;
}

export interface CreditLedgerEventDoc extends BaseDoc {
  orgId: string;
  projectId: string | null;
  jobId: string | null;
  eventType: CreditLedgerEventType;
  amountCents: number | null;
  tokenCount: number | null;
  stage: string | null;
  metadata: Record<string, unknown>;
}

export interface ApiKeyDoc extends BaseDoc {
  keyId: string;
  hashedSecret: string;
  orgId: string | null;
  scopes: string[];
  createdBy: string | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

export const siteProjectPublicSchema = z.object({
  id: z.string(),
  leadId: z.string().nullable(),
  packageTier: z.string(),
  businessName: z.string().nullable(),
  ownerFullName: z.string().nullable(),
  status: z.string(),
  previewUrl: z.string().nullable(),
  productionUrl: z.string().nullable(),
  domainName: z.string().nullable(),
  templateId: z.string().nullable(),
  brandTone: z.string().nullable(),
  primaryColor: z.string().nullable(),
  secondaryColor: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number(),
});

export type SiteProjectPublic = z.infer<typeof siteProjectPublicSchema>;

export function toSiteProjectPublic(doc: SiteProjectDoc): SiteProjectPublic {
  return siteProjectPublicSchema.parse({
    id: idToString(doc._id),
    leadId: doc.leadId,
    packageTier: doc.packageTier,
    businessName: doc.businessName,
    ownerFullName: doc.ownerFullName,
    status: doc.status,
    previewUrl: doc.previewUrl,
    productionUrl: doc.productionUrl,
    domainName: doc.domainName,
    templateId: doc.templateId,
    brandTone: doc.brandTone,
    primaryColor: doc.primaryColor,
    secondaryColor: doc.secondaryColor,
    createdAt: dateToIso(doc.createdAt),
    updatedAt: dateToIso(doc.updatedAt),
    schemaVersion: doc.schemaVersion,
  });
}

export const createProjectInputSchema = z.object({
  packageTier: z.string().min(1),
  businessName: z.string().optional(),
  ownerFullName: z.string().optional(),
  domainName: z.string().optional(),
});

export const patchProjectInputSchema = z.object({
  businessName: z.string().optional(),
  brandTone: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  domainName: z.string().optional(),
});

export const createChangeRequestInputSchema = z.object({
  scopeType: z.string().min(1),
  pageKey: z.string().optional(),
  sectionKey: z.string().optional(),
  description: z.string().min(1),
});

export const enqueueGenerationInputSchema = z.object({
  jobType: z.string().default("full_generation"),
  idempotencyKey: z.string().optional(),
});

export {zDate, REVISION_STATUSES, JOB_STATUSES};
