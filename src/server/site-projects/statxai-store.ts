import "server-only";

import {ObjectId} from "mongodb";

import {idToString} from "@/server/db/schemas/_helpers";

import {parseProjectId} from "./auth";
import {siteProjectCollections} from "./collections";
import type {SiteGenerationJobDoc, SiteProjectDoc} from "./schemas";

/** Snake_case project shape expected by generation agents. */
export type PipelineProjectRow = Record<string, unknown>;

function projectToRow(doc: SiteProjectDoc): PipelineProjectRow {
  return {
    id: idToString(doc._id),
    lead_id: doc.leadId,
    package_tier: doc.packageTier,
    template_id: doc.templateId,
    business_name: doc.businessName,
    owner_full_name: doc.ownerFullName,
    brand_tone: doc.brandTone,
    primary_color: doc.primaryColor,
    secondary_color: doc.secondaryColor,
    target_audience: doc.targetAudience,
    unique_selling_points: doc.uniqueSellingPoints,
    service_areas: doc.serviceAreas,
    cta_preference: doc.ctaPreference,
    business_hours: doc.businessHours,
    social_links: doc.socialLinks,
    domain_name: doc.domainName,
    site_token: doc.siteToken,
    preview_url: doc.previewUrl,
    production_url: doc.productionUrl,
    email: (doc as SiteProjectDoc & {email?: string | null}).email ?? null,
    phone: (doc as SiteProjectDoc & {phone?: string | null}).phone ?? null,
  };
}

export async function getPipelineProject(projectId: string): Promise<PipelineProjectRow | null> {
  const coll = await siteProjectCollections.siteProjects();
  const doc = await coll.findOne({_id: parseProjectId(projectId), deletedAt: null});
  return doc ? projectToRow(doc) : null;
}

export async function updateProjectFields(
  projectId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const coll = await siteProjectCollections.siteProjects();
  const $set: Record<string, unknown> = {updatedAt: new Date()};
  const map: Record<string, string> = {
    status: "status",
    preview_url: "previewUrl",
    production_url: "productionUrl",
    site_token: "siteToken",
    template_id: "templateId",
    vercel_deployment_id: "vercelDeploymentId",
  };
  for (const [snake, camel] of Object.entries(map)) {
    if (snake in fields) $set[camel] = fields[snake];
  }
  await coll.updateOne({_id: parseProjectId(projectId)}, {$set});
}

export async function updateJob(
  jobId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const coll = await siteProjectCollections.siteGenerationJobs();
  const $set: Record<string, unknown> = {updatedAt: new Date()};
  const map: Record<string, string> = {
    status: "status",
    stage: "stage",
    error_message: "errorMessage",
    started_at: "startedAt",
    completed_at: "completedAt",
    duration_ms: "durationMs",
    token_usage_input: "tokenUsageInput",
    token_usage_output: "tokenUsageOutput",
    model_used: "modelUsed",
  };
  for (const [snake, camel] of Object.entries(map)) {
    if (snake in fields) {
      const v = fields[snake];
      $set[camel] =
        snake.endsWith("_at") && typeof v === "string" ? new Date(v) : v;
    }
  }
  await coll.updateOne({_id: new ObjectId(jobId)}, {$set});
}

export async function getJobProjectId(jobId: string): Promise<string | null> {
  const coll = await siteProjectCollections.siteGenerationJobs();
  const job = await coll.findOne({_id: new ObjectId(jobId)});
  return job?.projectId ?? null;
}

export async function markArtifactsNotCurrent(
  projectId: string,
  artifactType: string,
): Promise<void> {
  const coll = await siteProjectCollections.generationArtifacts();
  await coll.updateMany(
    {projectId, artifactType, isCurrent: true},
    {$set: {isCurrent: false, updatedAt: new Date()}},
  );
}

export async function insertArtifact(input: {
  jobId: string;
  projectId: string;
  orgId: string;
  artifactType: string;
  payload: unknown;
  schemaVersion?: string;
}): Promise<void> {
  const coll = await siteProjectCollections.generationArtifacts();
  const now = new Date();
  await coll.insertOne({
    schemaVersion: 1,
    projectId: input.projectId,
    jobId: input.jobId,
    orgId: input.orgId,
    artifactType: input.artifactType,
    storageKey: null,
    mimeType: null,
    sizeBytes: null,
    checksum: null,
    payloadInline: null,
    payload: input.payload as Record<string, unknown>,
    isCurrent: true,
    schemaVersionLabel: input.schemaVersion ?? "1.0",
    createdAt: now,
    updatedAt: now,
  } as never);
}

export async function readArtifactPayload<T = unknown>(
  projectId: string,
  artifactType: string,
): Promise<T> {
  const coll = await siteProjectCollections.generationArtifacts();
  const doc = await coll.findOne({projectId, artifactType, isCurrent: true});
  if (!doc?.payload && !doc?.payloadInline) {
    throw new Error(`Artifact '${artifactType}' not found for project ${projectId}`);
  }
  return (doc.payload ?? doc.payloadInline) as T;
}

export async function getLatestIntake(projectId: string) {
  const coll = await siteProjectCollections.siteIntakeSubmissions();
  const doc = await coll.find({projectId}).sort({version: -1}).limit(1).next();
  if (!doc) return null;
  return {
    version: doc.version,
    normalized_payload: doc.normalizedPayload,
    raw_payload: doc.rawPayload,
    created_at: doc.createdAt.toISOString(),
  };
}

export async function listMediaForPipeline(projectId: string) {
  const coll = await siteProjectCollections.siteMediaAssets();
  const rows = await coll.find({projectId}).sort({sortOrder: 1}).toArray();
  return rows.map((m) => ({
    id: idToString(m._id),
    asset_type: m.assetType,
    storage_path: m.storagePath,
    placement_hint: m.placementHint,
    sort_order: m.sortOrder,
    original_filename: m.originalFilename,
  }));
}

export async function resolvePendingChangeRequestsForProject(
  projectId: string,
  fulfilledByJobId: string,
): Promise<void> {
  const {reconcileResolvedChangeRequests} = await import("./reconcile-change-requests");
  await reconcileResolvedChangeRequests(projectId);
  const cr = await siteProjectCollections.siteChangeRequests();
  await cr.updateMany(
    {projectId, status: {$in: ["pending", "in_progress"]}},
    {
      $set: {
        status: "resolved",
        resolvedAt: new Date(),
        generationJobId: fulfilledByJobId,
        updatedAt: new Date(),
      },
    },
  );
}

export async function getActiveTemplate(templateId: string) {
  const coll = await siteProjectCollections.siteTemplateRegistry();
  if (!ObjectId.isValid(templateId)) return null;
  const doc = await coll.findOne({_id: new ObjectId(templateId), isActive: true});
  if (!doc) return null;
  return {
    id: idToString(doc._id),
    name: doc.name,
    slot_schema: doc.slotSchema,
    pages: doc.pages,
    renderer_version: doc.rendererVersion,
  };
}

export async function findTemplateByName(name: string, packageTier?: string) {
  const coll = await siteProjectCollections.siteTemplateRegistry();
  const doc = await coll.findOne({isActive: true, name});
  if (!doc) return null;
  return {
    id: idToString(doc._id),
    name: doc.name,
    slot_schema: doc.slotSchema,
    pages: doc.pages,
    renderer_version: doc.rendererVersion,
  };
}

export async function listPaidLeadsNeedingProjects(limit = 50) {
  const leads = await siteProjectCollections.siteLeads();
  const projects = await siteProjectCollections.siteProjects();
  const tiers = ["statxeo_lander", "statxeo_core", "statxeo_titan"];
  const paidLeads = await leads
    .find({
      status: "paid",
      packageTier: {$in: tiers},
      purchasedAt: {$ne: null},
    })
    .sort({createdAt: 1})
    .limit(limit)
    .toArray();

  if (!paidLeads.length) return [];

  const leadIds = paidLeads.map((l) => idToString(l._id));
  const existing = await projects.find({leadId: {$in: leadIds}}).toArray();
  const existingSet = new Set(existing.map((p) => p.leadId));
  return paidLeads.filter((l) => !existingSet.has(idToString(l._id)));
}

export async function createProjectFromPaidLead(lead: {
  _id: ObjectId;
  orgId: string;
  packageTier: string | null;
  businessName: string | null;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  intakeJson: Record<string, unknown> | null;
}): Promise<string> {
  const intake = lead.intakeJson ?? {};
  const projects = await siteProjectCollections.siteProjects();
  const now = new Date();
  const res = await projects.insertOne({
    schemaVersion: 1,
    orgId: lead.orgId,
    customerId: null,
    leadId: idToString(lead._id),
    ownerUserId: "",
    packageTier: lead.packageTier ?? "statxeo_lander",
    businessName: stringOrNull(intake.businessName) ?? lead.businessName,
    ownerFullName: stringOrNull(intake.ownerFullName) ?? lead.contactName,
    status: "awaiting_preferences",
    previewUrl: null,
    productionUrl: null,
    domainName: null,
    templateId: null,
    brandTone: null,
    primaryColor: null,
    secondaryColor: null,
    draftRevisionId: null,
    previewRevisionId: null,
    approvedRevisionId: null,
    publishedRevisionId: null,
    previousPublishedRevisionId: null,
    publishedBy: null,
    publishedAt: null,
    publishReason: null,
    rollbackAvailable: false,
    deletedAt: null,
    siteToken: null,
    targetAudience: null,
    uniqueSellingPoints: null,
    offeredServices: null,
    serviceAreas: null,
    ctaPreference: null,
    businessHours: null,
    socialLinks: null,
    vercelDeploymentId: null,
    purchaseId: null,
    createdAt: now,
    updatedAt: now,
  } as SiteProjectDoc);

  const projectId = idToString(res.insertedId);
  const intakeColl = await siteProjectCollections.siteIntakeSubmissions();
  await intakeColl.insertOne({
    projectId,
    orgId: lead.orgId,
    version: 1,
    normalizedPayload: {
      businessName: stringOrNull(intake.businessName) ?? lead.businessName,
      ownerFullName: stringOrNull(intake.ownerFullName) ?? lead.contactName,
      email: stringOrNull(intake.email) ?? lead.contactEmail,
      phone: stringOrNull(intake.phone) ?? lead.contactPhone,
      packageTier: lead.packageTier,
    },
    rawPayload: intake,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  } as never);

  const images = await siteProjectCollections.leadImages();
  const leadImages = await images.find({leadId: idToString(lead._id)}).sort({sortOrder: 1}).toArray();
  if (leadImages.length) {
    const media = await siteProjectCollections.siteMediaAssets();
    await media.insertMany(
      leadImages
        .filter((img) => img.storagePath)
        .map((img, idx) => ({
          projectId,
          orgId: lead.orgId,
          assetType: "photo",
          storagePath: img.storagePath,
          originalFilename: null,
          mimeType: null,
          placementHint: null,
          sortOrder: img.sortOrder ?? idx,
          createdAt: now,
          updatedAt: now,
        })) as never[],
    );
  }

  return projectId;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return null;
}

export async function getJobOrgId(jobId: string): Promise<string> {
  const coll = await siteProjectCollections.siteGenerationJobs();
  const job = await coll.findOne({_id: new ObjectId(jobId)});
  if (!job) throw new Error(`Job not found: ${jobId}`);
  return job.orgId;
}
