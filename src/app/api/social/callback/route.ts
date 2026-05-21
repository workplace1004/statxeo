import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";

import {getSession} from "@/server/auth/session";
import {collections} from "@/server/db/collections";
import {idToString} from "@/server/db/schemas/_helpers";
import * as service from "@/server/site-projects/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildRedirectUrl(
  request: NextRequest,
  params: {status: "success" | "error"; message?: string},
) {
  const redirectUrl = new URL("/white-label/social", request.url);
  redirectUrl.searchParams.set("status", params.status);
  if (params.message) redirectUrl.searchParams.set("message", params.message);
  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const stateToken = searchParams.get("state");

  if (!sessionId || !stateToken) {
    return NextResponse.redirect(
      buildRedirectUrl(request, {status: "error", message: "Missing social callback parameters."}),
    );
  }

  try {
    const session = await getSession();
    if (!session || session.persona !== "white-label") {
      return NextResponse.redirect(
        buildRedirectUrl(request, {
          status: "error",
          message: "Please sign in again to finish connecting the account.",
        }),
      );
    }

    const users = await collections.users();
    const user = await users.findOne({email: session.email.toLowerCase()});
    const userId = user ? idToString(user._id) : session.sub;
    const agencyOrgId = user?.organizationId;

    if (!agencyOrgId) {
      return NextResponse.redirect(
        buildRedirectUrl(request, {
          status: "error",
          message: "We couldn't verify your organization. Please sign in again.",
        }),
      );
    }

    const result = await service.completeSocialCallback({
      sessionId,
      stateToken,
      agencyOrgId,
      userId,
    });

    return NextResponse.redirect(
      buildRedirectUrl(request, {
        status: "success",
        message: `${result.displayName} connected successfully.`,
      }),
    );
  } catch (error) {
    return NextResponse.redirect(
      buildRedirectUrl(request, {
        status: "error",
        message: "Couldn't complete the social connection. Please try again.",
      }),
    );
  }
}
