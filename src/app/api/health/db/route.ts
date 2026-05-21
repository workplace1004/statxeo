import type {NextRequest} from "next/server";

import {getDb} from "../../../../server/db/database";
import {withInternalApiKey} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withInternalApiKey(request, "health.db", async () => {
    const started = Date.now();
    const db = await getDb();
    await db.command({ping: 1});
    return {pingMs: Date.now() - started};
  });
}
