import "server-only";

import {z} from "zod";

import {getGoogleClientId, getGoogleClientSecret, getGoogleRedirectUri} from "./google-config";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const googleUserSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  picture: z.string().optional(),
  email_verified: z.boolean().optional(),
});

export type GoogleUserProfile = z.infer<typeof googleUserSchema>;

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{accessToken: string}> {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: getGoogleRedirectUri(),
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body,
  });

  if (!res.ok) {
    throw new Error("Failed to exchange authorization code");
  }

  const json = (await res.json()) as {access_token?: string};
  if (!json.access_token) {
    throw new Error("Token response missing access_token");
  }

  return {accessToken: json.access_token};
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: {Authorization: `Bearer ${accessToken}`},
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google user profile");
  }

  const json = await res.json();
  const parsed = googleUserSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Invalid Google user profile");
  }

  if (parsed.data.email_verified === false) {
    throw new Error("Google email is not verified");
  }

  return parsed.data;
}
