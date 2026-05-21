import type {NextRequest} from "next/server";
import {z} from "zod";

import * as service from "@/server/site-projects/service";
import {validationError} from "@/server/site-projects/errors";
import {withSiteProjectsSession} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({leadId: z.string()});

export async function POST(request: NextRequest) {
  return withSiteProjectsSession(request, async (ctx) => {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw validationError("Invalid checkout bypass payload", parsed.error.flatten());
    }

    return service.checkoutBypass(ctx, parsed.data.leadId);
  });
}
