import "server-only";

import {randomBytes} from "node:crypto";

import type {z} from "zod";

import {hashApiKey} from "./auth";
import {siteProjectCollections} from "./collections";
import type {SiteProjectsContext} from "./context";
import {validationError, notFound} from "./errors";
import {createApiKeyInputSchema, updateApiKeyInputSchema} from "./api-key-schemas";
import type {ApiKeyDoc} from "./schemas";

function normalizeScopes(scopes: string[]): string[] {
  const unique = Array.from(new Set(scopes));
  if (unique.includes("*") && unique.length > 1) {
    throw validationError("Wildcard API key scope cannot be combined with other scopes");
  }
  return unique;
}

export async function createScopedApiKey(
  ctx: SiteProjectsContext,
  input: z.infer<typeof createApiKeyInputSchema>,
) {
  const coll = await siteProjectCollections.apiKeys();
  const now = new Date();
  const plaintextSecret = randomBytes(32).toString("hex");
  const keyId = `sk_${randomBytes(8).toString("hex")}`;
  const scopes = normalizeScopes(input.scopes);
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

  await coll.insertOne({
    keyId,
    hashedSecret: hashApiKey(plaintextSecret),
    orgId: input.orgId,
    scopes,
    createdBy: input.createdBy ?? ctx.apiKeyId ?? null,
    lastUsedAt: null,
    expiresAt,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  } as ApiKeyDoc);

  return {
    apiKey: {
      keyId,
      secret: plaintextSecret,
      orgId: input.orgId,
      scopes,
      expiresAt: expiresAt?.toISOString() ?? null,
      createdAt: now.toISOString(),
    },
  };
}

export async function updateScopedApiKey(
  _ctx: SiteProjectsContext,
  keyId: string,
  input: z.infer<typeof updateApiKeyInputSchema>,
) {
  const coll = await siteProjectCollections.apiKeys();
  const doc = await coll.findOne({keyId, revokedAt: null});
  if (!doc) throw notFound("API key not found");

  const nextScopes = input.scopes ? normalizeScopes(input.scopes) : undefined;
  const nextOrgId = input.orgId ?? doc.orgId;
  if (!nextOrgId && !input.revoke) {
    throw validationError("orgId is required for active API keys");
  }

  const expiresAt =
    input.expiresAt === undefined
      ? undefined
      : input.expiresAt === null
        ? null
        : new Date(input.expiresAt);

  const result = await coll.findOneAndUpdate(
    {keyId, revokedAt: null},
    {
      $set: {
        ...(input.orgId !== undefined ? {orgId: input.orgId} : {}),
        ...(nextScopes ? {scopes: nextScopes} : {}),
        ...(expiresAt !== undefined ? {expiresAt} : {}),
        ...(input.revoke ? {revokedAt: new Date()} : {}),
        updatedAt: new Date(),
      },
    },
    {returnDocument: "after"},
  );

  if (!result) throw notFound("API key not found");

  return {
    apiKey: {
      keyId: result.keyId,
      orgId: result.orgId,
      scopes: result.scopes,
      expiresAt: result.expiresAt?.toISOString() ?? null,
      revokedAt: result.revokedAt?.toISOString() ?? null,
      updatedAt: result.updatedAt.toISOString(),
    },
  };
}