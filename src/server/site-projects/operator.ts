import "server-only";

import {ObjectId} from "mongodb";

import {idToString} from "@/server/db/schemas/_helpers";

import type {SiteProjectsContext} from "./context";
import {notFound} from "./errors";
import {appendGenerationEvent} from "./events";
import {releaseJobLease, transitionJobStatus} from "./locks";
import {assertPermission} from "./permissions";
import {findJobById, findProjectById} from "./repositories";
import {siteProjectCollections} from "./collections";
import {listJobEvents} from "./events";

export async function getJobTimeline(ctx: SiteProjectsContext, jobId: string) {
  assertPermission(ctx, "operator.retry");
  const events = await listJobEvents(jobId);
  return {
    events: events.map((e) => ({
      id: idToString(e._id),
      event_type: e.eventType,
      stage: e.stage,
      created_at: e.createdAt.toISOString(),
    })),
  };
}

export async function retryFromDeadLetter(ctx: SiteProjectsContext, jobId: string) {
  assertPermission(ctx, "operator.retry");
  const job = await findJobById(jobId);
  if (!job) throw notFound();
  if (job.status !== "dead_lettered") {
    throw new Error("Job is not dead lettered");
  }
  await transitionJobStatus(jobId, "dead_lettered", "retrying");
  await appendGenerationEvent({
    projectId: job.projectId,
    jobId,
    orgId: job.orgId,
    eventType: "JOB_RECOVERED",
    actorUserId: ctx.userId,
    payload: {},
  });
  return {jobId, status: "retrying"};
}

export async function operatorReleaseLease(ctx: SiteProjectsContext, jobId: string) {
  assertPermission(ctx, "operator.releaseLease");
  const job = await findJobById(jobId);
  if (!job?.leaseOwner) throw notFound();
  await releaseJobLease(jobId, job.leaseOwner);
  return {released: true};
}

export async function inspectLedger(ctx: SiteProjectsContext, orgId: string) {
  assertPermission(ctx, "operator.retry");
  const coll = await siteProjectCollections.creditLedgerEvents();
  const rows = await coll.find({orgId}).sort({createdAt: -1}).limit(100).toArray();
  return {
    events: rows.map((r) => ({
      id: idToString(r._id),
      event_type: r.eventType,
      project_id: r.projectId,
      job_id: r.jobId,
      created_at: r.createdAt.toISOString(),
    })),
  };
}

export async function rederiveJobSnapshot(jobId: string) {
  const job = await findJobById(jobId);
  if (!job) throw notFound();
  const events = await listJobEvents(jobId);
  const lastStage = [...events].reverse().find((e) => e.stage)?.stage ?? job.stage;
  const coll = await siteProjectCollections.siteGenerationJobs();
  await coll.updateOne(
    {_id: new ObjectId(jobId)},
    {$set: {stage: lastStage, updatedAt: new Date()}},
  );
  return {jobId, stage: lastStage};
}
