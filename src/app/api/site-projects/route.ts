import type {NextRequest} from "next/server";

import * as service from "@/server/site-projects/service";
import {withSiteProjectsSession} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withSiteProjectsSession(request, (ctx) => service.listProjects(ctx));
}
