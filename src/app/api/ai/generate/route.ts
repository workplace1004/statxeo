import type {NextRequest} from "next/server";

import {z} from "zod";

import * as service from "@/server/site-projects/service";
import {parseJsonBody} from "@/server/site-projects/request-body";
import {withInternalApiKey} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  jobId: z.string(),
  projectId: z.string(),
  jobType: z.string(),
});

export async function POST(request: NextRequest) {
  return withInternalApiKey(request, "generation.enqueue", async () => {
    const body = await parseJsonBody(request, bodySchema, {
      maxBytes: 32 * 1024,
      invalidMessage: "Invalid generation payload",
    });
    const result = await service.runGenerationInternal(
      body.jobId,
      body.projectId,
      body.jobType,
    );
    return result;
  });
}
