import type {NextRequest} from "next/server";

import * as service from "@/server/site-projects/service";
import {readJsonBody} from "@/server/site-projects/request-body";
import {withSiteProjectsSession} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{projectId: string}>},
) {
  const {projectId} = await params;
  return withSiteProjectsSession(request, (ctx) => service.getProject(ctx, projectId));
}

export async function PATCH(
  request: NextRequest,
  {params}: {params: Promise<{projectId: string}>},
) {
  const {projectId} = await params;
  return withSiteProjectsSession(request, async (ctx) => {
    const body = await readJsonBody(request, {maxBytes: 256 * 1024});
    return service.patchProject(ctx, projectId, body);
  });
}
