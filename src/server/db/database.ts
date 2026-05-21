import "server-only";

import type {Db} from "mongodb";

import {getMongoClient} from "./client";

export const DATABASE_NAME = "statxeo";

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();

  return client.db(DATABASE_NAME);
}
