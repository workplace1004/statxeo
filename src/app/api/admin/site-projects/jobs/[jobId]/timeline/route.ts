import type {NextRequest} from "next/server";

import * as operator from "@/server/site-projects/operator";
import {withInternalApiKey} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{jobId: string}>},
) {
  const {jobId} = await params;
  return withInternalApiKey(request, "operator.retry", (ctx) =>
    operator.getJobTimeline(ctx, jobId),
  );
}
