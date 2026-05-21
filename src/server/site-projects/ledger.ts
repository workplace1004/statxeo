import "server-only";

import {siteProjectCollections} from "./collections";
import type {CreditLedgerEventDoc, CreditLedgerEventType} from "./schemas";

export async function appendLedgerEvent(input: {
  orgId: string;
  projectId?: string | null;
  jobId?: string | null;
  eventType: CreditLedgerEventType;
  amountCents?: number | null;
  tokenCount?: number | null;
  stage?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<CreditLedgerEventDoc> {
  const now = new Date();
  const doc: Omit<CreditLedgerEventDoc, "_id"> = {
    orgId: input.orgId,
    projectId: input.projectId ?? null,
    jobId: input.jobId ?? null,
    eventType: input.eventType,
    amountCents: input.amountCents ?? null,
    tokenCount: input.tokenCount ?? null,
    stage: input.stage ?? null,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
  const coll = await siteProjectCollections.creditLedgerEvents();
  const res = await coll.insertOne(doc as CreditLedgerEventDoc);
  return {...doc, _id: res.insertedId} as CreditLedgerEventDoc;
}
