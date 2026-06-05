import "server-only";
import {NextRequest, NextResponse} from "next/server";

import {getSession} from "./auth/session";
import {collections} from "./db/collections";
import type {UserDoc} from "./db/schemas/users";
import type {SessionPayload} from "./auth/session";

export interface AuthenticatedWhiteLabeler {
  session: SessionPayload;
  user: UserDoc;
  orgId: string;
}

/**
 * Validates the request for a white-label API route.
 * Ensures the session exists, the persona is 'white-label',
 * and the user has a valid organizationId.
 * 
 * Returns the context if successful, or an error NextResponse if unauthorized.
 */
export async function getAuthenticatedWhiteLabeler(
  request: NextRequest
): Promise<{ ctx?: AuthenticatedWhiteLabeler; errorResponse?: NextResponse }> {
  const session = await getSession();
  if (!session || session.persona !== "white-label") {
    return {
      errorResponse: NextResponse.json(
        {ok: false, error: {code: "UNAUTHORIZED", message: "Authentication required"}},
        {status: 401}
      )
    };
  }

  const users = await collections.users();
  const user = await users.findOne({email: session.email.toLowerCase()});
  
  if (!user?.organizationId) {
    return {
      errorResponse: NextResponse.json(
        {ok: false, error: {code: "FORBIDDEN", message: "No organization found"}},
        {status: 403}
      )
    };
  }

  return {
    ctx: {
      session,
      user,
      orgId: user.organizationId,
    }
  };
}
