import {NextResponse} from "next/server";

import {createOAuthState} from "@/server/auth/oauth-state";
import {parsePersona, buildAuthErrorRedirect} from "@/server/auth/redirect";
import {buildGoogleAuthUrl} from "@/server/auth/google-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const persona = parsePersona(searchParams.get("persona"));
  const returnTo = searchParams.get("returnTo") ?? undefined;
  const mode = searchParams.get("mode");

  if (!persona) {
    return NextResponse.redirect(
      new URL(buildAuthErrorRedirect(null, returnTo, "invalid_persona"), request.url),
    );
  }

  try {
    const state = createOAuthState({
      persona,
      returnTo,
      mode: mode === "sign-in" || mode === "sign-up" ? mode : undefined,
    });
    const authUrl = buildGoogleAuthUrl(state);
    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.redirect(
      new URL(buildAuthErrorRedirect(persona, returnTo, "oauth_not_configured"), request.url),
    );
  }
}
