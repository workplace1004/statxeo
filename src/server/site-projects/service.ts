import "server-only";

import {ObjectId} from "mongodb";

import {runGenerationJob} from "@/lib/statxai/orchestrator";
import {reconcileResolvedChangeRequests} from "./reconcile-change-requests";
import {idToString} from "@/server/db/schemas/_helpers";

import {MAX_STAGE_ATTEMPTS} from "./auth";
import type {SiteProjectsContext} from "./context";
import {featureDisabled, forbidden, notFound, validationError} from "./errors";
import {appendGenerationEvent} from "./events";
import {appendLedgerEvent} from "./ledger";
import {insertOutbox} from "./outbox";
import {assertPermission} from "./permissions";
import {
  assertProjectAccess,
  createGenerationJob,
  findActiveJob,
  findJobById,
  findProjectById,
  getProjectWithRelations,
  insertChangeRequest,
  insertMedia,
  listMedia,
  listProjectsForCustomer,
  resolveLeadIds,
  updateProject,
} from "./repositories";
import {siteProjectCollections} from "./collections";
import {toSiteProjectPublic, patchProjectInputSchema, createChangeRequestInputSchema} from "./schemas";
import {
  isSiteProjectsMongoEnabled,
  isAiGenerationMongoEnabled,
  isReconcileMongoEnabled,
  isSocialCallbackMongoEnabled,
} from "./flags";
import {markJobDeadLettered, cancelJob} from "./cancellation";
import {logInfo} from "./redaction";

const STATUS_TO_JOB_TYPE: Record<string, string> = {
  ready_for_generation: "initial",
  assets_pending: "initial",
  changes_requested: "revision",
  failed: "regenerate",
};

const EDITABLE_STATUSES = ["awaiting_preferences", "assets_pending", "changes_requested", "failed"];

export async function listProjects(ctx: SiteProjectsContext) {
  if (!isSiteProjectsMongoEnabled()) throw featureDisabled("SITE_PROJECTS_MONGO");
  assertPermission(ctx, "project.read");
  const docs = await listProjectsForCustomer(ctx);
  return {projects: docs.map(toSiteProjectPublic)};
}

export async function getProject(ctx: SiteProjectsContext, projectId: string) {
  if (!isSiteProjectsMongoEnabled()) throw featureDisabled("SITE_PROJECTS_MONGO");
  assertPermission(ctx, "project.read");
  const data = await getProjectWithRelations(projectId);
  await assertProjectAccess(ctx, data.project);

  if (isReconcileMongoEnabled()) {
    await reconcileResolvedChangeRequests(projectId);
  }

  return {
    project: serializeProjectDetail(data),
    previewPages: data.previewPages,
    pageCount: data.pageCount,
    sitemapRoutes: data.sitemapRoutes,
  };
}

export async function patchProject(ctx: SiteProjectsContext, projectId: string, body: unknown) {
  if (!isSiteProjectsMongoEnabled()) throw featureDisabled("SITE_PROJECTS_MONGO");
  assertPermission(ctx, "project.update");
  const parsed = patchProjectInputSchema.parse(body);
  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  if (!EDITABLE_STATUSES.includes(project.status)) {
    throw validationError(`Cannot edit project in '${project.status}' status`);
  }

  const updated = await updateProject(projectId, {
    businessName: parsed.businessName ?? project.businessName,
    brandTone: parsed.brandTone ?? project.brandTone,
    primaryColor: parsed.primaryColor ?? project.primaryColor,
    secondaryColor: parsed.secondaryColor ?? project.secondaryColor,
    domainName: parsed.domainName ?? project.domainName,
  });

  return {project: {id: idToString(updated._id), status: updated.status, updatedAt: updated.updatedAt}};
}

export async function triggerGeneration(ctx: SiteProjectsContext, projectId: string) {
  if (!isAiGenerationMongoEnabled()) throw featureDisabled("AI_GENERATION_MONGO");
  assertPermission(ctx, "generation.enqueue");

  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  const jobType = STATUS_TO_JOB_TYPE[project.status];
  if (!jobType) {
    throw validationError(`Cannot trigger generation when project is in '${project.status}' status`);
  }

  const active = await findActiveJob(projectId);
  if (active) throw validationError("A generation job is already in progress");

  const idempotencyKey = `${projectId}_${jobType}_${Date.now()}`;
  const job = await createGenerationJob({
    projectId,
    orgId: project.orgId,
    jobType,
    idempotencyKey,
  });

  await updateProject(projectId, {status: "generating"});
  await appendGenerationEvent({
    projectId,
    jobId: idToString(job._id),
    orgId: project.orgId,
    eventType: "JOB_CREATED",
    actorUserId: ctx.userId,
    payload: {jobType},
  });
  await appendLedgerEvent({
    orgId: project.orgId,
    projectId,
    jobId: idToString(job._id),
    eventType: "CREDIT_RESERVED",
    metadata: {jobType},
  });
  await insertOutbox({
    orgId: project.orgId,
    type: "GENERATION_ENQUEUED",
    payload: {projectId, jobId: idToString(job._id)},
    idempotencyKey: `enqueue:${idempotencyKey}`,
  });

  const jobId = idToString(job._id);
  runGenerationJob({jobId, projectId, jobType}).catch((err) => {
    logInfo("generation.background_failed", {projectId, jobId});
  });

  return {
    job: {
      id: jobId,
      job_type: job.jobType,
      status: job.status,
      stage: job.stage,
      created_at: job.createdAt.toISOString(),
    },
  };
}

export async function approvePreview(ctx: SiteProjectsContext, projectId: string) {
  if (!isAiGenerationMongoEnabled()) throw featureDisabled("AI_GENERATION_MONGO");
  assertPermission(ctx, "generation.approve");

  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  if (project.status !== "preview_ready") {
    throw validationError(`Cannot approve when project is in '${project.status}' status`);
  }

  await updateProject(projectId, {status: "production_deploying"});
  const idempotencyKey = `${projectId}_deploy_production_${Date.now()}`;
  const job = await createGenerationJob({
    projectId,
    orgId: project.orgId,
    jobType: "deploy_production",
    idempotencyKey,
  });

  const jobId = idToString(job._id);
  runGenerationJob({jobId, projectId, jobType: "deploy_production"}).catch(async () => {
    await updateProject(projectId, {status: "preview_ready"});
  });

  return {
    job: {
      id: jobId,
      job_type: job.jobType,
      status: job.status,
      stage: job.stage,
      created_at: job.createdAt.toISOString(),
    },
  };
}

export async function runGenerationInternal(
  jobId: string,
  projectId: string,
  jobType: string,
): Promise<{success: boolean; error?: string}> {
  const job = await findJobById(jobId);
  if (!job) throw notFound("Job not found");
  if (!["queued", "running"].includes(job.status)) {
    throw validationError(`Job is in '${job.status}' status — cannot re-run`);
  }

  try {
    await runGenerationJob({jobId, projectId, jobType});
    return {success: true};
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (job.attemptCount >= MAX_STAGE_ATTEMPTS) {
      await markJobDeadLettered(jobId, job.orgId, projectId);
    }
    return {success: false, error: message};
  }
}

export async function getAiStatus(ctx: SiteProjectsContext, projectId: string) {
  assertPermission(ctx, "project.read");
  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  const data = await getProjectWithRelations(projectId);
  const latestJob = data.jobs[0] ?? null;
  return {
    project: {id: idToString(project._id), status: project.status},
    job: latestJob
      ? {
          id: idToString(latestJob._id),
          status: latestJob.status,
          stage: latestJob.stage,
          error_message: latestJob.errorMessage,
        }
      : null,
  };
}

export async function listChangeRequests(ctx: SiteProjectsContext, projectId: string) {
  assertPermission(ctx, "project.read");
  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);
  const coll = await import("./collections").then((m) => m.siteProjectCollections.siteChangeRequests());
  const rows = await coll.find({projectId}).sort({createdAt: -1}).toArray();
  return {
    changeRequests: rows.map((cr) => ({
      id: idToString(cr._id),
      scope_type: cr.scopeType,
      page_key: cr.pageKey,
      section_key: cr.sectionKey,
      description: cr.description,
      status: cr.status,
      created_at: cr.createdAt.toISOString(),
      resolved_at: cr.resolvedAt?.toISOString() ?? null,
    })),
  };
}

export async function createChangeRequest(
  ctx: SiteProjectsContext,
  projectId: string,
  body: unknown,
) {
  assertPermission(ctx, "changeRequest.create");
  const parsed = createChangeRequestInputSchema.parse(body);
  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  const reviewableStatuses = ["preview_ready", "changes_requested"];
  if (!reviewableStatuses.includes(project.status)) {
    throw validationError(`Cannot request changes when project is in '${project.status}' status`);
  }

  const cr = await insertChangeRequest({
    projectId,
    orgId: project.orgId,
    scopeType: parsed.scopeType,
    pageKey: parsed.pageKey ?? null,
    sectionKey: parsed.sectionKey ?? null,
    description: parsed.description,
    status: "pending",
    resolvedAt: null,
    generationJobId: null,
  });

  if (project.status === "preview_ready") {
    await updateProject(projectId, {status: "changes_requested"});
  }

  return {
    changeRequest: {
      id: idToString(cr._id),
      scope_type: cr.scopeType,
      status: cr.status,
      created_at: cr.createdAt.toISOString(),
    },
  };
}

export async function listProjectMedia(ctx: SiteProjectsContext, projectId: string) {
  assertPermission(ctx, "project.read");
  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);
  const assets = await listMedia(projectId);
  return {
    assets: assets.map((a) => ({
      id: idToString(a._id),
      asset_type: a.assetType,
      storage_path: a.storagePath,
      original_filename: a.originalFilename,
    })),
  };
}

export async function signMediaUpload(
  ctx: SiteProjectsContext,
  projectId: string,
  body: {filename: string; mimeType: string; assetType: string},
) {
  assertPermission(ctx, "media.upload");
  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  const normalizedFilename = sanitizeUploadFilename(body.filename);
  const storagePath = `projects/${projectId}/media/${Date.now()}_${normalizedFilename}`;
  await insertMedia({
    projectId,
    orgId: project.orgId,
    assetType: body.assetType,
    storagePath,
    originalFilename: normalizedFilename,
    mimeType: body.mimeType,
    placementHint: null,
    sortOrder: 0,
  });

  return {
    uploadUrl: `/api/site-projects/${projectId}/media?storagePath=${encodeURIComponent(storagePath)}`,
    storagePath,
    expiresIn: 3600,
  };
}

/**
 * Asserts that the caller has permission to upload binary media for the given
 * project. Called by the PUT /media route after sign-upload has already
 * committed the DB record.
 */
export async function assertMediaUploadAccess(
  ctx: SiteProjectsContext,
  projectId: string,
) {
  assertPermission(ctx, "media.upload");
  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);
}

function sanitizeUploadFilename(filename: string): string {
  const trimmed = filename.trim();
  const normalized = trimmed.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/\s+/g, " ");
  const withoutDotSegments = normalized.replace(/^\.+/, "").replace(/\.\.+/g, ".");
  const collapsed = withoutDotSegments.replace(/[ ]+/g, " ").trim();

  if (!collapsed) {
    throw validationError("Filename is invalid");
  }

  return collapsed;
}

export async function runReconcile(ctx: SiteProjectsContext) {
  if (!isReconcileMongoEnabled()) throw featureDisabled("RECONCILE_MONGO");
  assertPermission(ctx, "reconcile.run");
  const {reconcilePaidOrders} = await import("@/lib/statxai/reconciler");
  const result = await reconcilePaidOrders();
  return result;
}

export async function saveIntake(
  ctx: SiteProjectsContext,
  projectId: string,
  body: unknown,
) {
  if (!isSiteProjectsMongoEnabled()) throw featureDisabled("SITE_PROJECTS_MONGO");
  assertPermission(ctx, "project.update");

  const {WebsitePreferencesSchema} = await import("@/lib/statxai/schemas/intake");
  const parsed = WebsitePreferencesSchema.parse(body);

  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  const editableStatuses = ["awaiting_preferences", "assets_pending"];
  if (!editableStatuses.includes(project.status)) {
    throw validationError(`Cannot save intake when project is in '${project.status}' status`);
  }

  const intakeColl = await import("./collections").then((m) =>
    m.siteProjectCollections.siteIntakeSubmissions(),
  );
  const latest = await intakeColl.find({projectId}).sort({version: -1}).limit(1).next();
  const version = (latest?.version ?? 0) + 1;
  const now = new Date();

  await intakeColl.insertOne({
    projectId,
    orgId: project.orgId,
    version,
    rawPayload: parsed,
    normalizedPayload: parsed,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  } as never);

  await updateProject(projectId, {
    brandTone: parsed.brandTone ?? project.brandTone,
    primaryColor: parsed.primaryColor ?? project.primaryColor,
    secondaryColor: parsed.secondaryColor ?? project.secondaryColor,
    targetAudience: parsed.targetAudience ?? project.targetAudience,
    offeredServices: parsed.offeredServices ?? project.offeredServices,
    serviceAreas: parsed.serviceAreas?.join(", ") ?? project.serviceAreas,
    ctaPreference: parsed.ctaPreference ?? project.ctaPreference,
    businessHours: parsed.businessHours ? JSON.stringify(parsed.businessHours) : project.businessHours,
    socialLinks: parsed.socialLinks ?? project.socialLinks,
    domainName: parsed.domainPreference ?? project.domainName,
    status: "assets_pending",
  });

  return {project: {id: projectId, status: "assets_pending", intakeVersion: version}};
}

export async function seedDemoProject(ctx: SiteProjectsContext) {
  assertDevOnlyRoute();
  if (!ctx.userId || !ctx.email) throw forbidden();

  const leadLinks = await siteProjectCollections.customerLeadLinks();
  const existingLinks = await leadLinks.find({userId: ctx.userId}).toArray();
  if (existingLinks.length > 0) {
    const leadIds = existingLinks.map((l) => l.leadId);
    const projects = await siteProjectCollections.siteProjects();
    const existing = await projects.findOne({leadId: {$in: leadIds}});
    if (existing) {
      return {
        project: {id: idToString(existing._id), status: existing.status},
        message: "Demo project already exists",
      };
    }
  }

  const orgId = ctx.orgId ?? "demo-org";
  const leads = await siteProjectCollections.siteLeads();
  const now = new Date();
  const leadRes = await leads.insertOne({
    orgId,
    contactEmail: ctx.email,
    contactName: "Demo User",
    contactPhone: null,
    status: "paid",
    packageTier: "statxeo_core",
    businessName: "Demo Business",
    ownerFullName: "Demo User",
    intakeJson: {businessName: "Demo Business", ownerFullName: "Demo User"},
    purchasedAt: now,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  } as never);
  const leadId = idToString(leadRes.insertedId);

  await leadLinks.insertOne({
    userId: ctx.userId,
    leadId,
    orgId,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  } as never);

  const projectId = await import("./statxai-store").then((m) =>
    m.createProjectFromPaidLead({
      _id: leadRes.insertedId,
      orgId,
      packageTier: "statxeo_core",
      businessName: "Demo Business",
      contactName: "Demo User",
      contactEmail: ctx.email ?? "demo@example.com",
      contactPhone: null,
      intakeJson: {businessName: "Demo Business"},
    }),
  );

  return {project: {id: projectId, leadId, status: "awaiting_preferences"}};
}

export async function checkoutBypass(ctx: SiteProjectsContext, leadId: string) {
  assertDevOnlyRoute();
  if (!ObjectId.isValid(leadId)) {
    throw validationError("Lead not found");
  }

  const leads = await siteProjectCollections.siteLeads();
  const lead = await leads.findOne({_id: new ObjectId(leadId)});
  if (!lead) throw notFound("Lead not found");
  await assertLeadAccess(ctx, {leadId, orgId: lead.orgId});

  await leads.updateOne(
    {_id: lead._id},
    {$set: {status: "paid", purchasedAt: new Date(), updatedAt: new Date()}},
  );
  return {leadId, status: "paid"};
}

export async function completeSocialCallback(input: {
  sessionId: string;
  stateToken: string;
  agencyOrgId: string;
  userId: string;
}) {
  if (!isSocialCallbackMongoEnabled()) {
    throw featureDisabled("SOCIAL_CALLBACK_MONGO");
  }

  const {parseWhiteLabelerSocialAuthState} = await import("@/server/white-label/social-auth");
  const state = parseWhiteLabelerSocialAuthState(input.stateToken);
  if (!state) throw validationError("Invalid or expired callback state");
  if (state.whiteLabelerId !== input.agencyOrgId || state.userId !== input.userId) {
    throw forbidden("Social callback session mismatch");
  }

  const apiKey = process.env.OUSTAND_API_KEY?.trim();
  if (!apiKey) throw validationError("Social auth is not configured");

  const detailsRes = await fetch(
    `https://api.outstand.so/v1/social-accounts/pending?sessionId=${encodeURIComponent(input.sessionId)}`,
    {headers: {Authorization: `Bearer ${apiKey}`}, cache: "no-store"},
  );
  if (!detailsRes.ok) throw validationError("Failed to load pending social account details");

  const {data: pendingData} = await detailsRes.json();

  const finalizeRes = await fetch("https://api.outstand.so/v1/social-accounts/finalize", {
    method: "POST",
    headers: {Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json"},
    body: JSON.stringify({sessionId: input.sessionId}),
    cache: "no-store",
  });
  if (!finalizeRes.ok) throw validationError("Failed to finalize social connection");

  const {data: finalizedAccount} = await finalizeRes.json();
  const provider =
    typeof finalizedAccount?.provider === "string"
      ? finalizedAccount.provider
      : typeof pendingData?.provider === "string"
        ? pendingData.provider
        : state.provider;
  const displayName =
    typeof finalizedAccount?.name === "string" && finalizedAccount.name.trim()
      ? finalizedAccount.name.trim()
      : `${provider} account`;

  const coll = await siteProjectCollections.whiteLabelerSocialAccounts();
  const now = new Date();
  await coll.updateOne(
    {whiteLabelerId: input.agencyOrgId, outstandAccountId: String(finalizedAccount?.id ?? input.sessionId)},
    {
      $set: {
        provider,
        displayName,
        isActive: true,
        metadata: {pending: pendingData ?? null, finalized: finalizedAccount ?? null},
        connectedByUserId: input.userId,
        updatedAt: now,
      },
      $setOnInsert: {createdAt: now, schemaVersion: 1},
    },
    {upsert: true},
  );

  return {displayName, provider};
}

export {cancelJob};

function assertDevOnlyRoute() {
  if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
    throw validationError("Not available outside local development");
  }
}

async function assertLeadAccess(
  ctx: SiteProjectsContext,
  input: {leadId: string; orgId: string},
): Promise<void> {
  if (ctx.principal === "system_worker" || ctx.principal === "wl_admin") return;

  if (ctx.principal === "agency" && ctx.orgId && ctx.orgId === input.orgId) {
    return;
  }

  if (!ctx.userId) {
    throw forbidden("Not authorized for this lead");
  }

  const leadIds = await resolveLeadIds(ctx.userId, ctx.email ?? "");
  if (!leadIds.includes(input.leadId)) {
    throw forbidden("Not authorized for this lead");
  }
}

function serializeProjectDetail(data: Awaited<ReturnType<typeof getProjectWithRelations>>) {
  const p = data.project;
  return {
    id: idToString(p._id),
    lead_id: p.leadId,
    package_tier: p.packageTier,
    business_name: p.businessName,
    owner_full_name: p.ownerFullName,
    status: p.status,
    preview_url: p.previewUrl,
    production_url: p.productionUrl,
    domain_name: p.domainName,
    template_id: p.templateId,
    brand_tone: p.brandTone,
    primary_color: p.primaryColor,
    secondary_color: p.secondaryColor,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    statxeo_site_generation_jobs: data.jobs.map((j) => ({
      id: idToString(j._id),
      job_type: j.jobType,
      status: j.status,
      stage: j.stage,
      error_message: j.errorMessage,
      started_at: j.startedAt?.toISOString() ?? null,
      completed_at: j.completedAt?.toISOString() ?? null,
      created_at: j.createdAt.toISOString(),
    })),
    statxeo_site_change_requests: data.changeRequests.map((cr) => ({
      id: idToString(cr._id),
      scope_type: cr.scopeType,
      page_key: cr.pageKey,
      section_key: cr.sectionKey,
      description: cr.description,
      status: cr.status,
      created_at: cr.createdAt.toISOString(),
      resolved_at: cr.resolvedAt?.toISOString() ?? null,
    })),
    statxeo_site_media_assets: data.media.map((m) => ({
      id: idToString(m._id),
      asset_type: m.assetType,
      storage_path: m.storagePath,
      original_filename: m.originalFilename,
      mime_type: m.mimeType,
      placement_hint: m.placementHint,
      sort_order: m.sortOrder,
    })),
  };
}
