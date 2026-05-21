import "server-only";

import {createHmac, timingSafeEqual} from "node:crypto";

export const WHITE_LABELER_SOCIAL_PROVIDERS = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
] as const;

export type WhiteLabelerSocialProvider = (typeof WHITE_LABELER_SOCIAL_PROVIDERS)[number];

type WhiteLabelerSocialStatePayload = {
  whiteLabelerId: string;
  userId: string;
  provider: WhiteLabelerSocialProvider;
  issuedAt: number;
};

const DEFAULT_MAX_STATE_AGE_MS = 10 * 60 * 1000;

function getStateSecret(): string {
  const secret =
    process.env.WHITE_LABELER_SOCIAL_STATE_SECRET?.trim() ??
    process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("WHITE_LABELER_SOCIAL_STATE_SECRET or AUTH_SESSION_SECRET is required.");
  }
  return secret;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getStateSecret()).update(encodedPayload).digest("base64url");
}

export function isWhiteLabelerSocialProvider(value: unknown): value is WhiteLabelerSocialProvider {
  return (
    typeof value === "string" &&
    WHITE_LABELER_SOCIAL_PROVIDERS.includes(value as WhiteLabelerSocialProvider)
  );
}

export function createWhiteLabelerSocialAuthState(input: {
  whiteLabelerId: string;
  userId: string;
  provider: WhiteLabelerSocialProvider;
  issuedAt?: number;
}): string {
  const payload: WhiteLabelerSocialStatePayload = {
    whiteLabelerId: input.whiteLabelerId,
    userId: input.userId,
    provider: input.provider,
    issuedAt: input.issuedAt ?? Date.now(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function parseWhiteLabelerSocialAuthState(
  token: string,
  options?: {now?: number; maxAgeMs?: number},
): WhiteLabelerSocialStatePayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const payload = parsed as Partial<WhiteLabelerSocialStatePayload>;
  if (
    typeof payload.whiteLabelerId !== "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.issuedAt !== "number" ||
    !isWhiteLabelerSocialProvider(payload.provider)
  ) {
    return null;
  }

  const now = options?.now ?? Date.now();
  const maxAgeMs = options?.maxAgeMs ?? DEFAULT_MAX_STATE_AGE_MS;
  if (payload.issuedAt > now || now - payload.issuedAt > maxAgeMs) return null;

  return payload as WhiteLabelerSocialStatePayload;
}
