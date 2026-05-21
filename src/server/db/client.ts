import "server-only";

import {MongoClient} from "mongodb";
import type {MongoClientOptions} from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Set it in .env.local (see .env.example).",
  );
}

const OPTIONS: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 5000,
  retryReads: true,
  retryWrites: true,
};

declare global {
  // eslint-disable-next-line no-var
  var __statxeoMongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  return new MongoClient(MONGODB_URI as string, OPTIONS).connect();
}

const clientPromise: Promise<MongoClient> =
  process.env.NODE_ENV === "production"
    ? createClientPromise()
    : (globalThis.__statxeoMongoClientPromise ??= createClientPromise());

export function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}
