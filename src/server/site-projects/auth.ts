import "server-only";

import type {NextRequest} from "next/server";
import {createHash, timingSafeEqual} from "node:crypto";
import {ObjectId} from "mongodb";

import type {SessionPayload} from "@/server/auth/session";
import {getSession} from "@/server/auth/session";
import {
  getCurrentAgencyOrgId,
  getCurrentAffiliateUserId,
  getCurrentCustomerOrgId,
} from "@/server/context";
import {collections} from "@/server/db/collections";
import {idToString} from "@/server/db/schemas/_helpers";

import {apiKeyContext, sessionContext, systemWorkerContext} from "./context";
import type {SiteProjectsContext} from "./context";
import {unauthorized} from "./errors";
import {siteProjectCollections} from "./collections";

const MAX_STAGE_ATTEMPTS = 5;
export {MAX_STAGE_ATTEMPTS};

export async function resolveRequestContext(
  request: NextRequest,
  requestId: string,
): Promise<SiteProjectsContext> {
  const apiKeyResult = await resolveApiKey(request, requestId);
  if (apiKeyResult) return apiKeyResult;

  const session = await getSession();
  if (!session) {
    throw unauthorized();
  }

  const orgId = await resolveOrgIdForSession(session);
  const userId = await resolveUserId(session);

  return sessionContext({
    requestId,
    userId,
    orgId,
    email: session.email,
    persona: session.persona,
  });
}

export async function resolveSessionContext(requestId: string): Promise<SiteProjectsContext> {
  const session = await getSession();
  if (!session) throw unauthorized();
  const orgId = await resolveOrgIdForSession(session);
  const userId = await resolveUserId(session);
  return sessionContext({requestId, userId, orgId, email: session.email, persona: session.persona});
}

export async function resolveInternalApiKey(
  request: NextRequest,
  requestId: string,
  requiredScope: string,
): Promise<SiteProjectsContext> {
  const apiKey = request.headers.get("x-statxai-api-key");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const envKey = process.env.STATXAI_API_KEY;
  const internalKey = process.env.STATXT_INTERNAL_API_KEY;

  const token = apiKey ?? bearer ?? "";
  const valid = Boolean(
    (envKey && safeEqual(token, envKey)) || (internalKey && safeEqual(token, internalKey)),
  );

  if (!valid) {
    throw unauthorized("Invalid internal API key");
  }

  return apiKeyContext({
    requestId,
    apiKeyId: "env",
    scopes: [requiredScope, "*"],
  });
}

async function resolveApiKey(
  request: NextRequest,
  requestId: string,
): Promise<SiteProjectsContext | null> {
  const keyId = request.headers.get("x-api-key-id");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return null;

  if (!keyId) {
    return null;
  }

  const apiKeys = await siteProjectCollections.apiKeys();
  const doc = await apiKeys.findOne({
    keyId,
    revokedAt: null,
  });
  if (!doc) return null;
  if (doc.expiresAt && doc.expiresAt < new Date()) return null;

  const hash = hashApiKey(bearer);
  if (!safeEqual(hash, doc.hashedSecret)) return null;

  await apiKeys.updateOne(
    {_id: doc._id},
    {$set: {lastUsedAt: new Date(), updatedAt: new Date()}},
  );

  return apiKeyContext({
    requestId,
    apiKeyId: doc.keyId,
    orgId: doc.orgId ?? null,
    scopes: doc.scopes,
  });
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

async function resolveOrgIdForSession(session: SessionPayload): Promise<string> {
  const users = await collections.users();
  const user = await users.findOne({email: session.email.toLowerCase()});
  if (user?.organizationId) return user.organizationId;

  if (session.persona === "customer") return getCurrentCustomerOrgId();
  if (session.persona === "white-label") return getCurrentAgencyOrgId();
  return getCurrentAffiliateUserId();
}

async function resolveUserId(session: SessionPayload): Promise<string> {
  const users = await collections.users();
  const user = await users.findOne({email: session.email.toLowerCase()});
  if (user) return idToString(user._id);
  return session.sub;
}

export function parseProjectId(projectId: string): ObjectId {
  if (!ObjectId.isValid(projectId)) {
    throw new Error("Invalid project id");
  }
  return new ObjectId(projectId);
}

export function workerContext(requestId: string): SiteProjectsContext {
  return systemWorkerContext(requestId);
}
