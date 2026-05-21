import "server-only";

import {cookies} from "next/headers";
import {z} from "zod";

import {
  GOOGLE_AUTH_PERSONAS,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type GoogleAuthPersona,
} from "./constants";
import {getAuthSecret, sealJson, unsealJson} from "./crypto";

const sessionSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().optional(),
  persona: z.enum(GOOGLE_AUTH_PERSONAS),
  iat: z.number(),
});

export type SessionPayload = z.infer<typeof sessionSchema>;

export function createSessionToken(input: {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  persona: GoogleAuthPersona;
}): string {
  const payload: SessionPayload = {
    ...input,
    iat: Math.floor(Date.now() / 1000),
  };
  return sealJson(payload, getAuthSecret());
}

export function parseSessionToken(token: string): SessionPayload | null {
  const raw = unsealJson<SessionPayload>(token, getAuthSecret());
  const parsed = sessionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!value) return null;
  return parseSessionToken(value);
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}
