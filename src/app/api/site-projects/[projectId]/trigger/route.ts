import type {NextRequest} from "next/server";

import * as service from "@/server/site-projects/service";
import {withSiteProjectsSession} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{projectId: string}>},
) {
  const {projectId} = await params;
  return withSiteProjectsSession(request, (ctx) => service.triggerGeneration(ctx, projectId));
}
