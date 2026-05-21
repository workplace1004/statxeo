import "server-only";

import type {NextRequest} from "next/server";

import type {SiteProjectsContext} from "./context";
import {SiteProjectsError} from "./errors";
import {ERROR_CODES} from "./api-contract";
import {createRequestId, fail, ok, statusForErrorCode} from "./http";
import {resolveRequestContext, resolveInternalApiKey} from "./auth";
import {logError} from "./redaction";

export async function withSiteProjectsSession<T>(
  request: NextRequest,
  handler: (ctx: SiteProjectsContext) => Promise<T>,
) {
  const requestId = createRequestId();
  try {
    const ctx = await resolveRequestContext(request, requestId);
    const data = await handler(ctx);
    return ok(data, requestId);
  } catch (err) {
    return handleRouteError(err, requestId);
  }
}

export async function withInternalApiKey<T>(
  request: NextRequest,
  scope: string,
  handler: (ctx: SiteProjectsContext) => Promise<T>,
) {
  const requestId = createRequestId();
  try {
    const ctx = await resolveInternalApiKey(request, requestId, scope);
    const data = await handler(ctx);
    return ok(data, requestId);
  } catch (err) {
    return handleRouteError(err, requestId);
  }
}

function handleRouteError(err: unknown, requestId: string) {
  if (err instanceof SiteProjectsError) {
    return fail(err.code, err.message, requestId, statusForErrorCode(err.code), err.details);
  }
  logError("site_projects.unhandled", {requestId, code: "INTERNAL"});
  return fail(ERROR_CODES.INTERNAL_ERROR, "Internal server error", requestId, 500);
}
