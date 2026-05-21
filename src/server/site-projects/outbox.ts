import "server-only";

import {siteProjectCollections} from "./collections";
import type {OutboxEventDoc} from "./schemas";

export async function insertOutbox(input: {
  orgId: string | null;
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
}): Promise<OutboxEventDoc> {
  const now = new Date();
  const doc: Omit<OutboxEventDoc, "_id"> = {
    orgId: input.orgId,
    type: input.type,
    payload: input.payload,
    idempotencyKey: input.idempotencyKey,
    status: "pending",
    deliveredAt: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
  const coll = await siteProjectCollections.outboxEvents();
  const res = await coll.insertOne(doc as OutboxEventDoc);
  return {...doc, _id: res.insertedId} as OutboxEventDoc;
}

/** Processes pending outbox rows — no external HTTP in v1; marks delivered after log. */
export async function processOutboxBatch(limit = 50): Promise<number> {
  const coll = await siteProjectCollections.outboxEvents();
  const pending = await coll.find({status: "pending"}).limit(limit).toArray();
  let processed = 0;
  for (const row of pending) {
    await coll.updateOne(
      {_id: row._id},
      {$set: {status: "delivered", deliveredAt: new Date(), updatedAt: new Date()}},
    );
    processed += 1;
  }
  return processed;
}
