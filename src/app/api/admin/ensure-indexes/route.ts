import type {NextRequest} from "next/server";

import {ensureIndexes} from "../../../../server/db/indexes";
import {withInternalApiKey} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withInternalApiKey(request, "admin.indexes", async () => ensureIndexes());
}
