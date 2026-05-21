import "server-only";

import {ObjectId} from "mongodb";

import type {SiteProjectsContext} from "./context";
import {notFound, validationError} from "./errors";
import {appendGenerationEvent} from "./events";
import {appendLedgerEvent} from "./ledger";
import {releaseJobLease, transitionJobStatus} from "./locks";
import {assertProjectAccess, findJobById, findProjectById, updateProject} from "./repositories";
import {assertPermission} from "./permissions";
import {siteProjectCollections} from "./collections";

export async function cancelJob(ctx: SiteProjectsContext, jobId: string): Promise<void> {
  assertPermission(ctx, "generation.cancel");
  const job = await findJobById(jobId);
  if (!job) throw notFound("Job not found");

  const project = await findProjectById(job.projectId);
  if (!project) throw notFound();
  await assertProjectAccess(ctx, project);

  if (!["queued", "running", "retrying"].includes(job.status)) {
    throw validationError(`Cannot cancel job in status ${job.status}`);
  }

  if (job.leaseOwner) {
    await releaseJobLease(jobId, job.leaseOwner);
  }

  await transitionJobStatus(jobId, job.status as "queued" | "running" | "retrying", "cancelled", {
    completedAt: new Date(),
  });

  await appendGenerationEvent({
    projectId: job.projectId,
    jobId,
    orgId: job.orgId,
    eventType: "JOB_CANCELLED",
    actorUserId: ctx.userId,
    payload: {reason: "user_cancelled"},
  });

  await appendLedgerEvent({
    orgId: job.orgId,
    projectId: job.projectId,
    jobId,
    eventType: "CREDIT_RELEASED",
    metadata: {reason: "cancelled"},
  });

  if (project.status === "generating") {
    await updateProject(job.projectId, {status: "changes_requested"});
  }
}

export async function markJobDeadLettered(jobId: string, orgId: string, projectId: string): Promise<void> {
  const coll = await siteProjectCollections.siteGenerationJobs();
  await coll.updateOne(
    {_id: new ObjectId(jobId)},
    {$set: {status: "dead_lettered", updatedAt: new Date(), completedAt: new Date()}},
  );
  await appendGenerationEvent({
    projectId,
    jobId,
    orgId,
    eventType: "DEAD_LETTERED",
    payload: {},
  });
  await appendLedgerEvent({
    orgId,
    projectId,
    jobId,
    eventType: "CREDIT_RELEASED",
    metadata: {reason: "dead_letter"},
  });
}
