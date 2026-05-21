import "server-only";

import {z} from "zod";

import {GOOGLE_AUTH_PERSONAS, OAUTH_STATE_MAX_AGE_SECONDS} from "./constants";
import {getAuthSecret, sealJson, unsealJson} from "./crypto";

const oauthStateSchema = z.object({
  persona: z.enum(GOOGLE_AUTH_PERSONAS),
  returnTo: z.string().optional(),
  mode: z.enum(["sign-in", "sign-up"]).optional(),
  nonce: z.string(),
  exp: z.number(),
});

export type OAuthStatePayload = z.infer<typeof oauthStateSchema>;

export function createOAuthState(
  input: Omit<OAuthStatePayload, "nonce" | "exp"> & {nonce?: string},
): string {
  const payload: OAuthStatePayload = {
    ...input,
    nonce: input.nonce ?? crypto.randomUUID(),
    exp: Math.floor(Date.now() / 1000) + OAUTH_STATE_MAX_AGE_SECONDS,
  };
  return sealJson(payload, getAuthSecret());
}

export function parseOAuthState(token: string): OAuthStatePayload | null {
  const raw = unsealJson<OAuthStatePayload>(token, getAuthSecret());
  const parsed = oauthStateSchema.safeParse(raw);
  if (!parsed.success) return null;
  if (parsed.data.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed.data;
}
