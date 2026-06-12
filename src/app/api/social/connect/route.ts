import {NextRequest, NextResponse} from "next/server";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {
  createWhiteLabelerSocialAuthState,
  isWhiteLabelerSocialProvider,
} from "@/server/white-label/social-auth";
import {idToString} from "@/server/db/schemas/_helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId, user} = ctx!;

    const {searchParams} = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider || !isWhiteLabelerSocialProvider(provider)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: `Invalid or missing provider: ${provider}`}},
        {status: 400}
      );
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const appUrl = `${protocol}://${host}`;
    const redirectUri = `${appUrl}/api/social/callback`;

    const state = createWhiteLabelerSocialAuthState({
      whiteLabelerId: orgId,
      userId: idToString(user._id),
      provider,
    });

    // Construct Outstand OAuth URL
    const redirectUrl = `https://api.outstand.so/v1/social-accounts/connect?provider=${provider}&state=${encodeURIComponent(
      state
    )}&redirectUri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.json({ok: true, redirectUrl});
  } catch (err: any) {
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}
