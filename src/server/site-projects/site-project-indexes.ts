import "server-only";

import {siteProjectCollections, SITE_PROJECT_COLLECTION_NAMES} from "./collections";

export interface EnsureIndexesResult {
  created: Record<string, string[]>;
  errors: Array<{collection: string; message: string}>;
}

export async function ensureSiteProjectIndexes(): Promise<EnsureIndexesResult> {
  const created: Record<string, string[]> = {};
  const errors: EnsureIndexesResult["errors"] = [];

  async function safeCreate(name: string, fn: () => Promise<string[]>): Promise<void> {
    try {
      created[name] = await fn();
    } catch (e) {
      errors.push({collection: name, message: (e as Error).message});
    }
  }

  await safeCreate(SITE_PROJECT_COLLECTION_NAMES.siteProjects, async () => {
    const c = await siteProjectCollections.siteProjects();
    return c.createIndexes([
      {key: {orgId: 1, status: 1}, name: "site_projects_org_status"},
      {key: {leadId: 1}, name: "site_projects_lead"},
      {key: {ownerUserId: 1}, name: "site_projects_owner"},
      {key: {createdAt: -1}, name: "site_projects_created"},
    ]);
  });

  await safeCreate(SITE_PROJECT_COLLECTION_NAMES.siteGenerationJobs, async () => {
    const c = await siteProjectCollections.siteGenerationJobs();
    return c.createIndexes([
      {key: {projectId: 1, status: 1}, name: "gen_jobs_project_status"},
      {key: {leaseExpiresAt: 1}, name: "gen_jobs_lease_expires"},
      {key: {idempotencyKey: 1}, name: "gen_jobs_idempotency", sparse: true},
      {key: {createdAt: -1}, name: "gen_jobs_created"},
    ]);
  });

  await safeCreate(SITE_PROJECT_COLLECTION_NAMES.siteGenerationEvents, async () => {
    const c = await siteProjectCollections.siteGenerationEvents();
    return c.createIndexes([
      {key: {jobId: 1, createdAt: 1}, name: "gen_events_job_created"},
      {key: {projectId: 1}, name: "gen_events_project"},
    ]);
  });

  await safeCreate(SITE_PROJECT_COLLECTION_NAMES.generationArtifacts, async () => {
    const c = await siteProjectCollections.generationArtifacts();
    return c.createIndexes([
      {key: {projectId: 1, artifactType: 1, isCurrent: 1}, name: "artifacts_project_type_current"},
    ]);
  });

  await safeCreate(SITE_PROJECT_COLLECTION_NAMES.outboxEvents, async () => {
    const c = await siteProjectCollections.outboxEvents();
    return c.createIndexes([
      {key: {status: 1, createdAt: 1}, name: "outbox_status_created"},
      {key: {idempotencyKey: 1}, name: "outbox_idempotency", unique: true},
    ]);
  });

  await safeCreate(SITE_PROJECT_COLLECTION_NAMES.idempotencyKeys, async () => {
    const c = await siteProjectCollections.idempotencyKeys();
    return c.createIndexes([
      {key: {key: 1, route: 1}, name: "idempotency_key_route", unique: true},
      {key: {expiresAt: 1}, name: "idempotency_expires", expireAfterSeconds: 0},
    ]);
  });

  await safeCreate(SITE_PROJECT_COLLECTION_NAMES.customerLeadLinks, async () => {
    const c = await siteProjectCollections.customerLeadLinks();
    return c.createIndexes([
      {key: {userId: 1, leadId: 1}, name: "lead_links_user_lead", unique: true},
    ]);
  });

  await safeCreate(SITE_PROJECT_COLLECTION_NAMES.siteLeads, async () => {
    const c = await siteProjectCollections.siteLeads();
    return c.createIndexes([
      {key: {contactEmail: 1}, name: "site_leads_email"},
      {key: {orgId: 1, status: 1}, name: "site_leads_org_status"},
    ]);
  });

  await safeCreate(SITE_PROJECT_COLLECTION_NAMES.apiKeys, async () => {
    const c = await siteProjectCollections.apiKeys();
    return c.createIndexes([
      {key: {keyId: 1}, name: "api_keys_key_id", unique: true},
      {key: {orgId: 1, revokedAt: 1}, name: "api_keys_org_revoked"},
    ]);
  });

  return {created, errors};
}
