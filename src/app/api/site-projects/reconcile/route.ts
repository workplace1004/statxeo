import type {NextRequest} from "next/server";

import * as service from "@/server/site-projects/service";
import {withInternalApiKey} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withInternalApiKey(request, "reconcile.run", (ctx) => service.runReconcile(ctx));
}
