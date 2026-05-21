import "server-only";

import {invalidTransition} from "./errors";

export const JOB_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
  "retrying",
  "dead_lettered",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const REVISION_STATUSES = [
  "generated_draft",
  "preview_snapshot",
  "approved_revision",
  "published_revision",
] as const;

export type RevisionStatus = (typeof REVISION_STATUSES)[number];

const JOB_TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["completed", "failed", "cancelled"],
  completed: [],
  failed: ["retrying", "dead_lettered"],
  cancelled: [],
  retrying: ["running"],
  dead_lettered: ["retrying"],
};

const REVISION_TRANSITIONS: Record<RevisionStatus, readonly RevisionStatus[]> = {
  generated_draft: ["preview_snapshot"],
  preview_snapshot: ["approved_revision"],
  approved_revision: ["published_revision"],
  published_revision: ["published_revision"],
};

export function assertJobTransition(from: JobStatus, to: JobStatus): void {
  const allowed = JOB_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw invalidTransition(from, to);
  }
}

export function assertRevisionTransition(from: RevisionStatus, to: RevisionStatus): void {
  const allowed = REVISION_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw invalidTransition(from, to);
  }
}

/** Rollback restores previous published revision pointer — not a revision status enum hop. */
export function canRollbackPublish(): boolean {
  return true;
}
