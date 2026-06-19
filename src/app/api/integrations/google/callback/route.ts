import {NextResponse} from "next/server";

import {parseOAuthState} from "@/server/auth/oauth-state";
import {
  buildAuthErrorRedirect,
  parsePersona,
  resolvePostAuthRedirect,
} from "@/server/auth/redirect";
import {exchangeCodeForTokens, fetchGoogleUserProfile} from "@/server/auth/google-oauth";
import {createSessionToken, setSessionCookie} from "@/server/auth/session";
import {getAppUrl} from "@/server/auth/google-config";
import {upsertUserFromGoogle} from "@/server/auth/user-upsert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    const fallbackPersona = parsePersona(searchParams.get("persona"));
    return NextResponse.redirect(
      new URL(
        buildAuthErrorRedirect(fallbackPersona, undefined, oauthError),
        request.url,
      ),
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL(buildAuthErrorRedirect(null, undefined, "missing_code"), request.url),
    );
  }

  const state = parseOAuthState(stateParam);
  if (!state || !state.persona) {
    return NextResponse.redirect(
      new URL(buildAuthErrorRedirect(null, undefined, "invalid_state"), request.url),
    );
  }

  const {persona} = state;

  try {
    const {accessToken} = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleUserProfile(accessToken);

    await upsertUserFromGoogle(profile);

    const sessionToken = createSessionToken({
      sub: profile.sub,
      email: profile.email,
      name: profile.name ?? profile.email,
      picture: profile.picture,
      persona: persona,
    });
    await setSessionCookie(sessionToken);

    const destination = resolvePostAuthRedirect(persona, state.returnTo);
    const redirectUrl = new URL(destination, getAppUrl());
    redirectUrl.searchParams.set("auth", "google");

    return NextResponse.redirect(redirectUrl);
  } catch {
    return NextResponse.redirect(
      new URL(
        buildAuthErrorRedirect(persona, state.returnTo, "auth_failed"),
        request.url,
      ),
    );
  }
}
