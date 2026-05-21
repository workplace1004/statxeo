import "server-only";

import {idToString} from "@/server/db/schemas/_helpers";

import type {SiteProjectsContext} from "./context";
import {forbidden, notFound, validationError} from "./errors";
import {appendGenerationEvent} from "./events";
import {insertOutbox} from "./outbox";
import {assertProjectAccess, findProjectById, updateProject} from "./repositories";
import {assertPermission} from "./permissions";
import {assertRevisionTransition} from "./state-machine";
import {siteProjectCollections} from "./collections";
import type {SiteRevisionDoc} from "./schemas";

export async function executePublish(
  ctx: SiteProjectsContext,
  projectId: string,
  approvedRevisionId: string,
  reason: string,
): Promise<void> {
  assertPermission(ctx, "publish.execute");
  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  const revisions = await siteProjectCollections.siteRevisions();
  const revision = await revisions.findOne({
    _id: approvedRevisionId as never,
    projectId,
    status: "approved_revision",
  });
  if (!revision) {
    throw validationError("Approved revision required before publish");
  }

  const previousPublished = project.publishedRevisionId;
  await updateProject(projectId, {
    publishedRevisionId: approvedRevisionId,
    previousPublishedRevisionId: previousPublished,
    publishedBy: ctx.userId,
    publishedAt: new Date(),
    publishReason: reason,
    rollbackAvailable: true,
    status: "live",
  });

  await insertOutbox({
    orgId: project.orgId,
    type: "PUBLISH_COMPLETED",
    payload: {projectId, revisionId: approvedRevisionId},
    idempotencyKey: `publish:${projectId}:${approvedRevisionId}`,
  });
}

export async function rollbackPublish(
  ctx: SiteProjectsContext,
  projectId: string,
  reason: string,
): Promise<void> {
  assertPermission(ctx, "publish.rollback");
  const project = await findProjectById(projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  if (!project.rollbackAvailable || !project.previousPublishedRevisionId) {
    throw validationError("Rollback not available for this project");
  }

  const current = project.publishedRevisionId;
  const restore = project.previousPublishedRevisionId;

  await updateProject(projectId, {
    publishedRevisionId: restore,
    previousPublishedRevisionId: current,
    publishReason: reason,
    publishedAt: new Date(),
    publishedBy: ctx.userId,
  });

  await insertOutbox({
    orgId: project.orgId,
    type: "PUBLISH_ROLLBACK",
    payload: {projectId, reason},
    idempotencyKey: `rollback:${projectId}:${Date.now()}`,
  });
}

export async function promoteToApprovedRevision(
  projectId: string,
  revisionId: string,
  orgId: string,
): Promise<SiteRevisionDoc> {
  const revisions = await siteProjectCollections.siteRevisions();
  const rev = await revisions.findOne({_id: revisionId as never, projectId});
  if (!rev) throw notFound("Revision not found");

  assertRevisionTransition(rev.status, "approved_revision");
  await revisions.updateOne(
    {_id: rev._id},
    {$set: {status: "approved_revision", updatedAt: new Date()}},
  );
  await updateProject(projectId, {approvedRevisionId: idToString(rev._id)});

  return {...rev, status: "approved_revision"};
}
