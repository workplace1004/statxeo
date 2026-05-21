import type {NextRequest} from "next/server";

import {z} from "zod";

import * as service from "@/server/site-projects/service";
import {parseJsonBody} from "@/server/site-projects/request-body";
import {withSiteProjectsSession} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({projectId: z.string()});

export async function POST(request: NextRequest) {
  return withSiteProjectsSession(request, async (ctx) => {
    const body = await parseJsonBody(request, bodySchema, {
      maxBytes: 32 * 1024,
      invalidMessage: "Invalid approval payload",
    });
    return service.approvePreview(ctx, body.projectId);
  });
}
