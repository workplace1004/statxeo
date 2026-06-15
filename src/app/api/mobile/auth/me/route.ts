import {NextRequest, NextResponse} from "next/server";

import {parseSessionToken} from "@/server/auth/session";
import {collections} from "@/server/db/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mobile "who am I?" endpoint.
 * Called on app start to validate a stored token and refresh user info.
 *
 * Header: Authorization: Bearer <statxeo_token>
 * Returns: { ok: true, email, name, persona } or 401
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        {ok: false, error: {code: "NO_TOKEN", message: "Authorization header missing"}},
        {status: 401},
      );
    }

    const session = parseSessionToken(token);
    if (!session) {
      return NextResponse.json(
        {ok: false, error: {code: "INVALID_TOKEN", message: "Token is invalid or expired"}},
        {status: 401},
      );
    }

    const c = await collections.users();
    const user = await c.findOne({
      $or: [{googleSub: session.sub}, {email: session.email}],
    });

    if (!user) {
      return NextResponse.json(
        {ok: false, error: {code: "USER_NOT_FOUND", message: "Account no longer exists"}},
        {status: 401},
      );
    }

    return NextResponse.json({
      ok: true,
      email: user.email,
      name: user.name,
      persona: session.persona,
      avatarUrl: user.avatarUrl ?? null,
    });
  } catch (err: any) {
    console.error("[GET /api/mobile/auth/me] error:", err);
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: "Internal server error"}},
      {status: 500},
    );
  }
}
