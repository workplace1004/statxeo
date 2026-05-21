import "server-only";

import {ObjectId} from "mongodb";

import {parseProjectId} from "./auth";
import {siteProjectCollections} from "./collections";
import {appendGenerationEvent} from "./events";
import {assertJobTransition} from "./state-machine";
import type {JobStatus} from "./state-machine";

const DEFAULT_LEASE_MS = 5 * 60 * 1000;

export async function acquireJobLease(
  jobId: string,
  owner: string,
  leaseMs = DEFAULT_LEASE_MS,
): Promise<boolean> {
  const coll = await siteProjectCollections.siteGenerationJobs();
  const now = new Date();
  const expires = new Date(now.getTime() + leaseMs);
  const res = await coll.findOneAndUpdate(
    {
      _id: new ObjectId(jobId),
      $or: [{leaseExpiresAt: null}, {leaseExpiresAt: {$lt: now}}],
    },
    {
      $set: {
        leaseOwner: owner,
        leaseExpiresAt: expires,
        lastHeartbeatAt: now,
        updatedAt: now,
      },
    },
    {returnDocument: "after"},
  );
  return Boolean(res);
}

export async function heartbeatJobLease(jobId: string, owner: string): Promise<void> {
  const coll = await siteProjectCollections.siteGenerationJobs();
  const now = new Date();
  await coll.updateOne(
    {_id: new ObjectId(jobId), leaseOwner: owner},
    {$set: {lastHeartbeatAt: now, leaseExpiresAt: new Date(now.getTime() + DEFAULT_LEASE_MS)}},
  );
}

export async function releaseJobLease(jobId: string, owner: string): Promise<void> {
  const coll = await siteProjectCollections.siteGenerationJobs();
  await coll.updateOne(
    {_id: new ObjectId(jobId), leaseOwner: owner},
    {$set: {leaseOwner: null, leaseExpiresAt: null, updatedAt: new Date()}},
  );
}

export async function transitionJobStatus(
  jobId: string,
  from: JobStatus,
  to: JobStatus,
  extra?: Record<string, unknown>,
): Promise<void> {
  assertJobTransition(from, to);
  const coll = await siteProjectCollections.siteGenerationJobs();
  await coll.updateOne(
    {_id: new ObjectId(jobId), status: from},
    {$set: {status: to, updatedAt: new Date(), ...extra}},
  );
}

export async function checkIdempotencyKey(
  key: string,
  route: string,
): Promise<{hit: boolean; snapshot?: unknown}> {
  const coll = await siteProjectCollections.idempotencyKeys();
  const existing = await coll.findOne({key, route});
  if (!existing) return {hit: false};
  if (existing.status === "completed" && existing.responseSnapshot) {
    return {hit: true, snapshot: existing.responseSnapshot};
  }
  return {hit: true};
}

export async function storeIdempotencyResult(
  key: string,
  route: string,
  snapshot: unknown,
): Promise<void> {
  const coll = await siteProjectCollections.idempotencyKeys();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await coll.updateOne(
    {key, route},
    {
      $set: {
        status: "completed",
        responseSnapshot: snapshot,
        updatedAt: new Date(),
        expiresAt,
      },
    },
    {upsert: true},
  );
}

export async function claimIdempotencyKey(key: string, route: string): Promise<boolean> {
  const coll = await siteProjectCollections.idempotencyKeys();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  try {
    await coll.insertOne({
      key,
      route,
      status: "pending",
      resultHash: null,
      responseSnapshot: null,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      schemaVersion: 1,
    } as never);
    return true;
  } catch {
    return false;
  }
}

export {parseProjectId};
