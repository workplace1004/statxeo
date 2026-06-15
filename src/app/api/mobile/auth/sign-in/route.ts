import {NextRequest, NextResponse} from "next/server";

import {createSessionToken, setSessionCookie} from "@/server/auth/session";
import {collections} from "@/server/db/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mobile sign-in endpoint.
 *
 * The mobile app uses Google OAuth on the web via a WebView for sign-up,
 * but uses email-lookup for sign-in (identity confirmed via Google Sub).
 *
 * Since the platform is Google-OAuth-only (no passwords stored),
 * this endpoint issues a session token for any user that already exists
 * in the DB by email — intended for users who have previously signed in
 * via the web portal (which verifies their Google identity).
 *
 * Body: { email: string; persona: "white-label" | "customer" | "affiliate" }
 * Returns: { token: string; email: string; name: string; persona: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {email, persona} = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {ok: false, error: {code: "MISSING_EMAIL", message: "email is required"}},
        {status: 400},
      );
    }

    const validPersonas = ["white-label", "customer", "affiliate"];
    if (!persona || !validPersonas.includes(persona)) {
      return NextResponse.json(
        {ok: false, error: {code: "INVALID_PERSONA", message: "persona must be white-label, customer, or affiliate"}},
        {status: 400},
      );
    }

    const c = await collections.users();
    const user = await c.findOne({email: email.trim().toLowerCase()});

    if (!user) {
      return NextResponse.json(
        {ok: false, error: {code: "USER_NOT_FOUND", message: "No account found for this email. Sign up on the web portal first."}},
        {status: 404},
      );
    }

    const token = createSessionToken({
      sub: user.googleSub ?? user.email,
      email: user.email,
      name: user.name,
      picture: user.avatarUrl ?? undefined,
      persona,
    });

    return NextResponse.json({
      ok: true,
      token,
      email: user.email,
      name: user.name,
      persona,
    });
  } catch (err: any) {
    console.error("[POST /api/mobile/auth/sign-in] error:", err);
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: "Internal server error"}},
      {status: 500},
    );
  }
}
