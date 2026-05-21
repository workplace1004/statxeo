import "server-only";

import {ObjectId} from "mongodb";

import {idToString} from "@/server/db/schemas/_helpers";

import {parseProjectId} from "./auth";
import {hasApiKeyProjectAccess} from "./access";
import type {SiteProjectsContext} from "./context";
import {forbidden, notFound} from "./errors";
import {siteProjectCollections} from "./collections";
import type {
  SiteChangeRequestDoc,
  SiteGenerationJobDoc,
  SiteMediaAssetDoc,
  SiteProjectDoc,
} from "./schemas";

export async function resolveLeadIds(userId: string, email: string): Promise<string[]> {
  const ids = new Set<string>();
  const links = await siteProjectCollections.customerLeadLinks();
  const linkRows = await links.find({userId}).toArray();
  for (const row of linkRows) ids.add(row.leadId);

  if (email) {
    const leads = await siteProjectCollections.siteLeads();
    const emailLeads = await leads
      .find({contactEmail: {$regex: new RegExp(`^${escapeRegex(email)}$`, "i")}})
      .toArray();
    for (const lead of emailLeads) ids.add(idToString(lead._id));
  }

  return Array.from(ids);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function findProjectById(projectId: string): Promise<SiteProjectDoc | null> {
  const coll = await siteProjectCollections.siteProjects();
  return coll.findOne({_id: parseProjectId(projectId), deletedAt: null});
}

export async function assertProjectAccess(
  ctx: SiteProjectsContext,
  project: SiteProjectDoc,
): Promise<void> {
  if (ctx.principal === "system_worker" || ctx.principal === "wl_admin") return;
  if (ctx.principal === "api_key") {
    if (hasApiKeyProjectAccess(ctx.orgId, project.orgId)) return;
    throw forbidden("API key is not authorized for this project org");
  }

  if (!ctx.userId) throw forbidden();

  const leadIds = await resolveLeadIds(ctx.userId, ctx.email ?? "");
  if (project.leadId && leadIds.includes(project.leadId)) return;

  if (ctx.orgId && project.orgId === ctx.orgId && ctx.principal === "agency") return;

  throw forbidden("Not authorized for this project");
}

export async function listProjectsForCustomer(ctx: SiteProjectsContext) {
  const leadIds = await resolveLeadIds(ctx.userId ?? "", ctx.email ?? "");
  if (leadIds.length === 0) return [];

  const coll = await siteProjectCollections.siteProjects();
  const docs = await coll
    .find({leadId: {$in: leadIds}, deletedAt: null})
    .sort({createdAt: -1})
    .toArray();
  return docs;
}

export async function getProjectWithRelations(projectId: string) {
  const project = await findProjectById(projectId);
  if (!project) throw notFound("Project not found");

  const jobs = await siteProjectCollections.siteGenerationJobs();
  const changeRequests = await siteProjectCollections.siteChangeRequests();
  const media = await siteProjectCollections.siteMediaAssets();
  const artifacts = await siteProjectCollections.generationArtifacts();

  const [jobRows, crRows, mediaRows, previewArtifact] = await Promise.all([
    jobs.find({projectId}).sort({createdAt: -1}).toArray(),
    changeRequests.find({projectId}).sort({createdAt: -1}).toArray(),
    media.find({projectId}).sort({sortOrder: 1}).toArray(),
    artifacts.findOne({projectId, artifactType: "preview_deployment", isCurrent: true}),
  ]);

  let previewPages: string[] | null = null;
  let pageCount: number | null = null;
  let sitemapRoutes: string[] | null = null;
  const payload = previewArtifact?.payload ?? previewArtifact?.payloadInline;
  if (payload) {
    previewPages = Array.isArray(payload.previewPages) ? (payload.previewPages as string[]) : null;
    pageCount = typeof payload.pageCount === "number" ? payload.pageCount : null;
    sitemapRoutes = Array.isArray(payload.sitemapRoutes) ? (payload.sitemapRoutes as string[]) : null;
  }

  return {project, jobs: jobRows, changeRequests: crRows, media: mediaRows, previewPages, pageCount, sitemapRoutes};
}

export async function updateProject(
  projectId: string,
  updates: Partial<SiteProjectDoc>,
): Promise<SiteProjectDoc> {
  const coll = await siteProjectCollections.siteProjects();
  const result = await coll.findOneAndUpdate(
    {_id: parseProjectId(projectId)},
    {$set: {...updates, updatedAt: new Date()}},
    {returnDocument: "after"},
  );
  if (!result) throw notFound("Project not found");
  return result;
}

export async function createGenerationJob(input: {
  projectId: string;
  orgId: string;
  jobType: string;
  idempotencyKey: string;
}): Promise<SiteGenerationJobDoc> {
  const now = new Date();
  const doc: Omit<SiteGenerationJobDoc, "_id"> = {
    schemaVersion: 1,
    projectId: input.projectId,
    orgId: input.orgId,
    jobType: input.jobType,
    status: "queued",
    stage: "queued",
    errorMessage: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    lastHeartbeatAt: null,
    attemptCount: 0,
    idempotencyKey: input.idempotencyKey,
    startedAt: null,
    completedAt: null,
    durationMs: null,
    tokenUsageInput: null,
    tokenUsageOutput: null,
    modelUsed: null,
    createdAt: now,
    updatedAt: now,
  };
  const coll = await siteProjectCollections.siteGenerationJobs();
  const res = await coll.insertOne(doc as SiteGenerationJobDoc);
  return {...doc, _id: res.insertedId} as SiteGenerationJobDoc;
}

export async function findActiveJob(projectId: string): Promise<SiteGenerationJobDoc | null> {
  const coll = await siteProjectCollections.siteGenerationJobs();
  return coll.findOne({projectId, status: {$in: ["queued", "running"]}});
}

export async function findJobById(jobId: string): Promise<SiteGenerationJobDoc | null> {
  const coll = await siteProjectCollections.siteGenerationJobs();
  if (!ObjectId.isValid(jobId)) return null;
  return coll.findOne({_id: new ObjectId(jobId)});
}

export async function insertChangeRequest(
  input: Omit<SiteChangeRequestDoc, "_id" | "createdAt" | "updatedAt">,
): Promise<SiteChangeRequestDoc> {
  const now = new Date();
  const coll = await siteProjectCollections.siteChangeRequests();
  const doc = {...input, createdAt: now, updatedAt: now};
  const res = await coll.insertOne(doc as SiteChangeRequestDoc);
  return {...doc, _id: res.insertedId} as SiteChangeRequestDoc;
}

export async function listMedia(projectId: string): Promise<SiteMediaAssetDoc[]> {
  const coll = await siteProjectCollections.siteMediaAssets();
  return coll.find({projectId}).sort({sortOrder: 1}).toArray();
}

export async function insertMedia(
  input: Omit<SiteMediaAssetDoc, "_id" | "createdAt" | "updatedAt">,
): Promise<SiteMediaAssetDoc> {
  const now = new Date();
  const coll = await siteProjectCollections.siteMediaAssets();
  const doc = {...input, createdAt: now, updatedAt: now};
  const res = await coll.insertOne(doc as SiteMediaAssetDoc);
  return {...doc, _id: res.insertedId} as SiteMediaAssetDoc;
}
