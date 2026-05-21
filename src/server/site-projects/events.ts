import "server-only";

import {ObjectId} from "mongodb";

import {idToString} from "@/server/db/schemas/_helpers";

import {siteProjectCollections} from "./collections";
import type {GenerationEventType, SiteGenerationEventDoc} from "./schemas";

export async function appendGenerationEvent(input: {
  projectId: string;
  jobId: string;
  orgId: string;
  eventType: GenerationEventType;
  stage?: string | null;
  payload?: Record<string, unknown>;
  actorUserId?: string | null;
  model?: string;
  promptVersion?: string;
  toolVersion?: string;
  inputChecksum?: string;
  outputChecksum?: string;
}): Promise<SiteGenerationEventDoc> {
  const now = new Date();
  const doc: Omit<SiteGenerationEventDoc, "_id"> = {
    schemaVersion: 1,
    projectId: input.projectId,
    jobId: input.jobId,
    orgId: input.orgId,
    eventType: input.eventType,
    stage: input.stage ?? null,
    payload: input.payload ?? {},
    actorUserId: input.actorUserId ?? null,
    model: input.model,
    promptVersion: input.promptVersion,
    toolVersion: input.toolVersion,
    inputChecksum: input.inputChecksum,
    outputChecksum: input.outputChecksum,
    createdAt: now,
    updatedAt: now,
  };
  const coll = await siteProjectCollections.siteGenerationEvents();
  const res = await coll.insertOne(doc as SiteGenerationEventDoc);
  return {...doc, _id: res.insertedId} as SiteGenerationEventDoc;
}

export async function listJobEvents(jobId: string): Promise<SiteGenerationEventDoc[]> {
  const coll = await siteProjectCollections.siteGenerationEvents();
  return coll.find({jobId}).sort({createdAt: 1}).toArray();
}

export function jobIdString(jobId: ObjectId | string): string {
  return typeof jobId === "string" ? jobId : idToString(jobId);
}
