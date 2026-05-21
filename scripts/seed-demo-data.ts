/**
 * Seed demo users and organizations into MongoDB.
 *
 * Creates three demo accounts (agency owner, customer owner, affiliate) and
 * their corresponding organizations, plus a minimal set of sample documents so
 * every dashboard view has something to render.
 *
 * Usage:
 *   pnpm tsx scripts/seed-demo-data.ts          # dry-run (no writes)
 *   pnpm tsx scripts/seed-demo-data.ts --write   # write to DB
 *
 * The script is idempotent — re-running with --write will not create duplicates.
 * Existing documents are skipped.
 *
 * After seeding, sign in via Google using the demo email addresses to access
 * each dashboard persona. The OAuth callback will find the pre-seeded user by
 * email and bind the googleSub to that record.
 */

import "dotenv/config";

import {MongoClient, ObjectId} from "mongodb";

const WRITE = process.argv.includes("--write");
const DB_NAME = process.env.MONGODB_DB ?? "statxeo";
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI env var is required. Add it to .env.local.");
  process.exit(1);
}

// ─── Stable seed IDs ─────────────────────────────────────────────────────────
// Using fixed hex strings so references remain consistent across re-runs.

const DEMO_AGENCY_ORG_ID = new ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa");
const DEMO_CUSTOMER_ORG_ID = new ObjectId("bbbbbbbbbbbbbbbbbbbbbbbb");

const DEMO_AGENCY_USER_ID = new ObjectId("111111111111111111111111");
const DEMO_CUSTOMER_USER_ID = new ObjectId("222222222222222222222222");
const DEMO_AFFILIATE_USER_ID = new ObjectId("333333333333333333333333");

const now = new Date();

// ─── Documents ───────────────────────────────────────────────────────────────

const orgs = [
  {
    _id: DEMO_AGENCY_ORG_ID,
    type: "agency",
    name: "Demo Agency",
    ownerUserId: DEMO_AGENCY_USER_ID.toHexString(),
    brand: {
      logoLightUrl: null,
      logoDarkUrl: null,
      primaryColor: "#6366f1",
      secondaryColor: null,
      accentColor: null,
      customDomain: null,
      emailFrom: null,
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: DEMO_CUSTOMER_ORG_ID,
    type: "customer",
    name: "Demo Customer Co.",
    ownerUserId: DEMO_CUSTOMER_USER_ID.toHexString(),
    brand: {
      logoLightUrl: null,
      logoDarkUrl: null,
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
      customDomain: null,
      emailFrom: null,
    },
    createdAt: now,
    updatedAt: now,
  },
];

const users = [
  {
    _id: DEMO_AGENCY_USER_ID,
    googleSub: null, // bound on first Google sign-in
    email: "demo-agency@statxeo.dev",
    name: "Demo Agency Owner",
    avatarUrl: null,
    role: "agency_owner",
    accountType: "agency",
    organizationId: DEMO_AGENCY_ORG_ID.toHexString(),
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: DEMO_CUSTOMER_USER_ID,
    googleSub: null,
    email: "demo-customer@statxeo.dev",
    name: "Demo Customer Owner",
    avatarUrl: null,
    role: "customer_owner",
    accountType: "customer",
    organizationId: DEMO_CUSTOMER_ORG_ID.toHexString(),
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: DEMO_AFFILIATE_USER_ID,
    googleSub: null,
    email: "demo-affiliate@statxeo.dev",
    name: "Demo Affiliate",
    avatarUrl: null,
    role: "affiliate",
    accountType: "affiliate",
    organizationId: null,
    createdAt: now,
    updatedAt: now,
  },
];

// Sample customers linked to the demo agency
const customers = [
  {
    _id: new ObjectId(),
    agencyOrgId: DEMO_AGENCY_ORG_ID.toHexString(),
    name: "Acme Plumbing",
    status: "active",
    mrrCents: 49900,
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: new ObjectId(),
    agencyOrgId: DEMO_AGENCY_ORG_ID.toHexString(),
    name: "Sunrise Dental",
    status: "active",
    mrrCents: 29900,
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: new ObjectId(),
    agencyOrgId: DEMO_AGENCY_ORG_ID.toHexString(),
    name: "Riverfront HVAC",
    status: "trial",
    mrrCents: 0,
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

// Business profile for demo customer
const businessProfile = {
  _id: new ObjectId(),
  customerOrgId: DEMO_CUSTOMER_ORG_ID.toHexString(),
  businessName: "Demo Customer Co.",
  industry: "Professional Services",
  websiteUrl: "https://example.com",
  phone: null,
  address: null,
  createdAt: now,
  updatedAt: now,
};

// ─── Runner ──────────────────────────────────────────────────────────────────

async function upsertDocs(
  db: ReturnType<MongoClient["db"]>,
  collectionName: string,
  docs: Array<{_id: ObjectId}>,
) {
  let inserted = 0;
  let skipped = 0;
  const collection = db.collection(collectionName);
  for (const doc of docs) {
    const exists = await collection.findOne({_id: doc._id});
    if (exists) {
      skipped++;
      continue;
    }
    if (WRITE) {
      await collection.insertOne(doc as never);
    }
    inserted++;
  }
  const action = WRITE ? "inserted" : "would insert";
  console.log(`  ${collectionName}: ${action} ${inserted}, skipped ${skipped}`);
}

async function main() {
  console.log(`\nMode: ${WRITE ? "WRITE" : "DRY RUN"} (use --write to commit)\n`);

  const client = new MongoClient(MONGODB_URI as string);
  await client.connect();
  const db = client.db(DB_NAME);

  console.log("Seeding demo data…");
  await upsertDocs(db, "organizations", orgs as Array<{_id: ObjectId}>);
  await upsertDocs(db, "users", users as Array<{_id: ObjectId}>);
  await upsertDocs(db, "customers", customers as Array<{_id: ObjectId}>);
  await upsertDocs(db, "businessProfiles", [businessProfile as {_id: ObjectId}]);

  await client.close();

  console.log("\nDemo accounts:");
  console.log("  Agency owner  → sign in with: demo-agency@statxeo.dev");
  console.log("  Customer owner→ sign in with: demo-customer@statxeo.dev");
  console.log("  Affiliate     → sign in with: demo-affiliate@statxeo.dev");
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
