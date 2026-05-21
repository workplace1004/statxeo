import {MongoClient, ObjectId} from "mongodb";

type Resolution = {
  orgId: string | null;
  source: "createdBy-user-id" | "createdBy-email" | "default-org" | "unresolved";
};

type ApiKeyDoc = {
  _id: ObjectId;
  keyId: string;
  orgId?: string | null;
  createdBy?: string | null;
};

type UserDoc = {
  _id: ObjectId;
  email: string;
  organizationId: string | null;
};

const DATABASE_NAME = "statxeo";
const API_KEYS_COLLECTION = "apiKeys";
const USERS_COLLECTION = "users";

function parseArgs(argv: string[]) {
  const dryRun = !argv.includes("--write");
  const defaultOrgIdArg = argv.find((arg) => arg.startsWith("--default-org="));
  const defaultOrgId = defaultOrgIdArg?.slice("--default-org=".length) || null;
  return {dryRun, defaultOrgId};
}

async function resolveOrgIdForApiKey(
  client: MongoClient,
  createdBy: string | null,
  defaultOrgId: string | null,
): Promise<Resolution> {
  const users = client.db(DATABASE_NAME).collection<UserDoc>(USERS_COLLECTION);

  if (createdBy) {
    if (ObjectId.isValid(createdBy)) {
      const user = await users.findOne({_id: new ObjectId(createdBy)});
      if (user?.organizationId) {
        return {orgId: user.organizationId, source: "createdBy-user-id"};
      }
    }

    const normalized = createdBy.trim().toLowerCase();
    if (normalized) {
      const user = await users.findOne({email: normalized});
      if (user?.organizationId) {
        return {orgId: user.organizationId, source: "createdBy-email"};
      }
    }
  }

  if (defaultOrgId) {
    return {orgId: defaultOrgId, source: "default-org"};
  }

  return {orgId: null, source: "unresolved"};
}

async function main() {
  const {dryRun, defaultOrgId} = parseArgs(process.argv.slice(2));
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI. Load .env.local or export the variable before running.");
  }

  const client = await new MongoClient(mongoUri).connect();

  try {
    const apiKeys = client.db(DATABASE_NAME).collection<ApiKeyDoc>(API_KEYS_COLLECTION);
  const cursor = apiKeys.find({$or: [{orgId: {$exists: false}}, {orgId: null}]});

  let scanned = 0;
  let updated = 0;
  let unresolved = 0;

  for await (const doc of cursor) {
    scanned += 1;
    const resolved = await resolveOrgIdForApiKey(client, doc.createdBy ?? null, defaultOrgId);

    if (!resolved.orgId) {
      unresolved += 1;
      console.warn(`[unresolved] keyId=${doc.keyId} createdBy=${doc.createdBy ?? "null"}`);
      continue;
    }

    console.log(
      `[${dryRun ? "dry-run" : "write"}] keyId=${doc.keyId} orgId=${resolved.orgId} source=${resolved.source}`,
    );

    if (!dryRun) {
      await apiKeys.updateOne({_id: doc._id}, {$set: {orgId: resolved.orgId, updatedAt: new Date()}});
    }

    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        scanned,
        updated,
        unresolved,
        mode: dryRun ? "dry-run" : "write",
        defaultOrgId,
      },
      null,
      2,
    ),
  );

  if (unresolved > 0 && !defaultOrgId) {
    process.exitCode = 1;
  }
  } finally {
    await client.close();
  }
}

void main();